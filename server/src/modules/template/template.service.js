const db = require('../../config/database');

/**
 * List all available templates.
 */
async function list() {
  return db('templates').select('*').orderBy('name', 'asc');
}

/**
 * Get a single template by ID with its data.
 */
async function getById(id) {
  const template = await db('templates').where({ id }).first();
  if (!template) return null;

  const templateData = await db('template_data')
    .where({ template_id: id })
    .select('*');

  return { ...template, template_data: templateData };
}

/**
 * Check if a business has already applied a template.
 * Uses the template_applied_at column on the businesses table.
 */
async function hasAppliedTemplate(tenantId) {
  const business = await db('businesses').where({ id: tenantId }).first();
  return business && business.template_applied_at != null;
}

/**
 * Apply a template to a business via deep copy.
 * Runs inside a transaction. Copies:
 * - services (new IDs, mapped to business_id)
 * - menu_nodes (structure only — Phase 3 tables, copy if they exist)
 * - flows (structure only — Phase 4 tables, copy if they exist)
 * All IDs are re-mapped. No reference leakage.
 */
async function applyTemplate(templateId, tenantId) {
  const template = await getById(templateId);
  if (!template) return null;

  return db.transaction(async (trx) => {
    const result = {
      services: [],
      menu_nodes: [],
      flows: [],
      flow_steps: [],
    };

    // ID maps — accessible across all template_data rows
    const serviceIdMap = {};
    const nodeIdMap = {};
    const flowIdMap = {};

    // The template_data contains the blueprint as a jsonb blob.
    // Each template_data row has a data field with the structure to copy.
    for (const td of template.template_data) {
      const data = td.data;

      // --- Copy services ---
      if (data.services && Array.isArray(data.services)) {
        for (const svc of data.services) {
          const [newService] = await trx('services')
            .insert({
              business_id: tenantId,
              name: svc.name,
              description: svc.description || null,
              price: svc.price != null ? svc.price : null,
              duration: svc.duration || null,
            })
            .returning('*');
          serviceIdMap[svc.id] = newService.id;
          result.services.push(newService);
        }
      }

      // --- Copy menu_nodes (Phase 3+ — only if table exists) ---
      const menuNodesExist = await trx.schema.hasTable('menu_nodes');
      if (menuNodesExist && data.menu_nodes && Array.isArray(data.menu_nodes)) {

        // First pass: insert nodes without parent_id references
        for (const node of data.menu_nodes) {
          const [newNode] = await trx('menu_nodes')
            .insert({
              business_id: tenantId,
              parent_id: null, // will be updated in second pass
              node_type: node.node_type,
              label: node.label,
              sort_order: node.sort_order || 0,
              action_type: node.action_type || null,
              action_config: node.action_config || null,
              flow_id: null, // will be updated after flows are copied
            })
            .returning('*');
          nodeIdMap[node.id] = newNode.id;
          result.menu_nodes.push(newNode);
        }

        // Second pass: update parent_id references
        for (const node of data.menu_nodes) {
          if (node.parent_id && nodeIdMap[node.parent_id]) {
            await trx('menu_nodes')
              .where({ id: nodeIdMap[node.id] })
              .update({ parent_id: nodeIdMap[node.parent_id] });
          }
        }
      }

      // --- Copy flows + flow_steps (Phase 4+ — only if tables exist) ---
      const flowsExist = await trx.schema.hasTable('flows');
      if (flowsExist && data.flows && Array.isArray(data.flows)) {
        for (const flow of data.flows) {
          const [newFlow] = await trx('flows')
            .insert({
              business_id: tenantId,
              name: flow.name,
              description: flow.description || null,
              is_active: true,
            })
            .returning('*');
          flowIdMap[flow.id] = newFlow.id;
          result.flows.push(newFlow);

          // Copy flow steps
          if (flow.steps && Array.isArray(flow.steps)) {
            const flowStepsExist = await trx.schema.hasTable('flow_steps');
            if (flowStepsExist) {
              for (const step of flow.steps) {
                const [newStep] = await trx('flow_steps')
                  .insert({
                    flow_id: newFlow.id,
                    step_order: step.step_order || step.order || 1,
                    type: step.step_type || step.type,
                    label: step.label || step.step_type || step.type || 'Step',
                    config: step.configuration || step.config || '{}',
                    is_required: step.is_required !== undefined ? step.is_required : true,
                  })
                  .returning('*');
                result.flow_steps.push(newStep);
              }
            }
          }
        }

        // Update Flow Entry Nodes to point to new flow IDs
        if (menuNodesExist && data.menu_nodes) {
          for (const node of data.menu_nodes) {
            if (node.flow_id && flowIdMap[node.flow_id] && nodeIdMap[node.id]) {
              await trx('menu_nodes')
                .where({ id: nodeIdMap[node.id] })
                .update({ flow_id: flowIdMap[node.flow_id] });
            }
          }
        }
      }
    }

    // --- Create default assignee + assignment rules ---
    const assigneesExist = await trx.schema.hasTable('assignees');
    const rulesExist = await trx.schema.hasTable('assignment_rules');

    if (assigneesExist && rulesExist) {
      // Create a default staff member
      const [defaultAssignee] = await trx('assignees')
        .insert({ business_id: tenantId, name: 'Default Staff', is_active: true })
        .returning('*');

      result.assignees = [defaultAssignee];
      result.assignment_rules = [];

      // Create a service-based rule for each copied service
      let priority = Object.keys(serviceIdMap).length + 1;
      for (const [, newServiceId] of Object.entries(serviceIdMap)) {
        const svc = result.services.find((s) => s.id === newServiceId);
        const [rule] = await trx('assignment_rules')
          .insert({
            business_id: tenantId,
            name: svc ? `${svc.name} → Default Staff` : 'Service Rule',
            priority,
            conditions: '{}',
            trigger_type: 'service',
            trigger_id: newServiceId,
            assignee_id: defaultAssignee.id,
            is_active: true,
          })
          .returning('*');
        result.assignment_rules.push(rule);
        priority--;
      }

      // Fallback catch-all rule (lowest priority)
      const [fallback] = await trx('assignment_rules')
        .insert({
          business_id: tenantId,
          name: 'Fallback → Default Staff',
          priority: 0,
          conditions: '{}',
          trigger_type: null,
          trigger_id: null,
          assignee_id: defaultAssignee.id,
          is_active: true,
        })
        .returning('*');
      result.assignment_rules.push(fallback);
    }

    // Stamp business as template-applied
    await trx('businesses')
      .where({ id: tenantId })
      .update({ template_applied_at: trx.fn.now() });

    return result;
  });
}

/**
 * Mark a business as setup-complete without applying a template.
 */
async function markSetupComplete(tenantId) {
  await db('businesses')
    .where({ id: tenantId })
    .update({ template_applied_at: db.fn.now() });
}

module.exports = { list, getById, hasAppliedTemplate, applyTemplate, markSetupComplete };
