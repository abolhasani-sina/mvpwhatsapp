const db = require('../../config/database');

const VALID_TRIGGER_TYPES = ['service', 'menu_node', 'flow'];

/**
 * Rule-based assignment engine.
 * Phase 6 — Assignment System
 *
 * Supports two matching modes:
 * 1. Structured: rule has trigger_type + trigger_id (preferred)
 * 2. Legacy: rule has conditions JSON (backward-compatible fallback)
 *
 * Evaluation logic:
 * 1. Find all active rules for the tenant
 * 2. Filter rules that match the request (structured or legacy)
 * 3. Sort matching rules by priority DESC
 * 4. If the highest priority is shared by multiple rules → DO NOT assign (ambiguous)
 * 5. If the winning rule's assignee is inactive → DO NOT assign
 * 6. Otherwise, assign the request to the winning assignee
 *
 * This function NEVER changes request status. Assignment is purely routing.
 */
async function assignRequest(request, tenantId) {
  // 1. Get all active rules for this business, ordered by priority DESC
  const rules = await db('assignment_rules')
    .where({ business_id: tenantId, is_active: true })
    .orderBy('priority', 'desc');

  if (rules.length === 0) {
    console.log(`[assignment] No active rules for business ${tenantId}`);
    return null;
  }

  // 2. Filter rules that match the request
  const matching = rules.filter((rule) => matchesRule(rule, request));

  if (matching.length === 0) {
    console.log(`[assignment] No rules matched request ${request.id} (evaluated ${rules.length} rules)`);
    return null;
  }

  // 3. Check for priority conflict at the top
  const highestPriority = matching[0].priority;
  const topMatches = matching.filter((r) => r.priority === highestPriority);

  if (topMatches.length > 1) {
    console.warn(
      `[assignment] Priority conflict: ${topMatches.length} rules at priority ${highestPriority} for request ${request.id}. Rule IDs: ${topMatches.map((r) => r.id).join(', ')}. Skipping assignment.`
    );
    return null;
  }

  const winningRule = topMatches[0];

  // 4. Check assignee is active
  const assignee = await db('assignees')
    .where({ id: winningRule.assignee_id, business_id: tenantId })
    .first();

  if (!assignee || !assignee.is_active) {
    console.warn(
      `[assignment] Assignee ${winningRule.assignee_id} is ${!assignee ? 'not found' : 'inactive'} for winning rule ${winningRule.id}. Skipping assignment.`
    );
    return null;
  }

  // 5. Assign the request
  const [updated] = await db('requests')
    .where({ id: request.id, business_id: tenantId })
    .update({
      assigned_to_id: assignee.id,
      assignment_rule_id: winningRule.id,
      assigned_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning('*');

  console.log(`[assignment] Request ${request.id} assigned to ${assignee.id} via rule ${winningRule.id}`);
  return updated;
}

/**
 * Determine if a rule matches the request.
 * Uses structured trigger_type/trigger_id if present, else falls back to conditions JSON.
 */
function matchesRule(rule, request) {
  if (rule.trigger_type && rule.trigger_id) {
    return matchesTrigger(rule.trigger_type, rule.trigger_id, request);
  }
  // Fallback: legacy conditions matching
  return matchesConditions(rule.conditions, request);
}

/**
 * Structured trigger matching.
 * - service → match trigger_id against _service_id or scanned service in request data
 * - menu_node → match trigger_id against entered_from_node_id
 * - flow → match trigger_id against source_flow_id
 *
 * Returns false with debug log if required field is missing.
 */
function matchesTrigger(triggerType, triggerId, request) {
  switch (triggerType) {
    case 'menu_node':
      if (!request.entered_from_node_id) {
        console.warn(`[assignment] Rule skipped: trigger_type=menu_node but entered_from_node_id is null (request ${request.id})`);
        return false;
      }
      return request.entered_from_node_id === triggerId;

    case 'flow':
      if (!request.source_flow_id) {
        console.warn(`[assignment] Rule skipped: trigger_type=flow but source_flow_id is null (request ${request.id})`);
        return false;
      }
      return request.source_flow_id === triggerId;

    case 'service': {
      const data = typeof request.data === 'string' ? JSON.parse(request.data) : (request.data || {});
      // Check dedicated _service_id first
      if (data._service_id) {
        return data._service_id === triggerId;
      }
      // Fallback: scan data values for service object
      for (const value of Object.values(data)) {
        if (value && typeof value === 'object' && value.id === triggerId) {
          return true;
        }
      }
      console.warn(`[assignment] Rule skipped: trigger_type=service but no service_id found in request ${request.id}`);
      return false;
    }

    default:
      console.warn(`[assignment] Rule skipped: unknown trigger_type '${triggerType}' (request ${request.id})`);
      return false;
  }
}

/**
 * Legacy condition matching (backward compatibility).
 * Conditions is a JSON object with key-value pairs.
 * Each key is checked against the request's data (jsonb).
 * All conditions must match (AND logic).
 * Empty conditions object matches all requests.
 */
function matchesConditions(conditions, request) {
  if (!conditions || typeof conditions !== 'object') return true;

  const keys = Object.keys(conditions);
  if (keys.length === 0) return true;

  const requestData = typeof request.data === 'string' ? JSON.parse(request.data) : (request.data || {});
  const matchSource = { ...requestData, source_flow_id: request.source_flow_id, entered_from_node_id: request.entered_from_node_id };

  for (const key of keys) {
    if (matchSource[key] !== conditions[key]) {
      return false;
    }
  }

  return true;
}

module.exports = { assignRequest, matchesRule, matchesTrigger, matchesConditions, VALID_TRIGGER_TYPES };
