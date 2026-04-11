const db = require('../../config/database');

/**
 * Rule-based assignment engine.
 * Phase 6 — Assignment System
 *
 * Evaluation logic:
 * 1. Find all active rules for the tenant
 * 2. Filter rules whose conditions match the request data (simple key-value matching)
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

  if (rules.length === 0) return null;

  // 2. Filter rules whose conditions match the request
  const matching = rules.filter((rule) => matchesConditions(rule.conditions, request));

  if (matching.length === 0) return null;

  // 3. Check for priority conflict at the top
  const highestPriority = matching[0].priority;
  const topMatches = matching.filter((r) => r.priority === highestPriority);

  if (topMatches.length > 1) {
    // Multiple rules at same priority → ambiguous, do not assign
    return null;
  }

  const winningRule = topMatches[0];

  // 4. Check assignee is active
  const assignee = await db('assignees')
    .where({ id: winningRule.assignee_id, business_id: tenantId })
    .first();

  if (!assignee || !assignee.is_active) {
    // Assignee inactive or not found → do not assign
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

  return updated;
}

/**
 * Simple condition matching.
 * Conditions is a JSON object with key-value pairs.
 * Each key is checked against the request's data (jsonb).
 * All conditions must match (AND logic).
 * Empty conditions object matches all requests.
 */
function matchesConditions(conditions, request) {
  if (!conditions || typeof conditions !== 'object') return true;

  const keys = Object.keys(conditions);
  if (keys.length === 0) return true;

  const requestData = request.data || {};
  // Also check top-level request fields (source_flow_id, entered_from_node_id, status)
  const matchSource = { ...requestData, source_flow_id: request.source_flow_id, entered_from_node_id: request.entered_from_node_id };

  for (const key of keys) {
    if (matchSource[key] !== conditions[key]) {
      return false;
    }
  }

  return true;
}

module.exports = { assignRequest, matchesConditions };
