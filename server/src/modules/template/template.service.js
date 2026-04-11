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
 * A business that already has menu_nodes is considered to have applied a template.
 * For Phase 2 (no menu_nodes table yet), check if services exist.
 * The roadmap says "Template apply: one-time only (reject if business already has menu data)".
 * Since menu_nodes don't exist until Phase 3, we track via a flag approach:
 * check if template_data references already exist for this business.
 */
async function hasAppliedTemplate(tenantId) {
  // Check if business already has services created from a template.
  // In Phase 3+, this will also check menu_nodes.
  const tableExists = await db.schema.hasTable('menu_nodes');
  if (tableExists) {
    const nodes = await db('menu_nodes').where({ business_id: tenantId }).first();
    if (nodes) return true;
  }
  return false;
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

    // The template_data contains the blueprint as a jsonb blob.
    // Each template_data row has a data field with the structure to copy.
    for (const td of template.template_data) {
      const data = td.data;

      // --- Copy services ---
      if (data.services && Array.isArray(data.services)) {
        const serviceIdMap = {};
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
        const nodeIdMap = {};

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
        const flowIdMap = {};
        for (const flow of data.flows) {
          const [newFlow] = await trx('flows')
            .insert({
              business_id: tenantId,
              name: flow.name,
              description: flow.description || null,
              is_published: false,
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
                    step_type: step.step_type,
                    order: step.order,
                    configuration: step.configuration || {},
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
            if (node.flow_id && flowIdMap[node.flow_id]) {
              const nodeIdMap = {};
              result.menu_nodes.forEach((n, i) => {
                const origNode = data.menu_nodes[i];
                if (origNode) nodeIdMap[origNode.id] = n.id;
              });
              if (nodeIdMap[node.id]) {
                await trx('menu_nodes')
                  .where({ id: nodeIdMap[node.id] })
                  .update({ flow_id: flowIdMap[node.flow_id] });
              }
            }
          }
        }
      }
    }

    return result;
  });
}

module.exports = { list, getById, hasAppliedTemplate, applyTemplate };
