const sessionService = require('./session.service');
const formatter = require('./whatsapp.formatter');
const menuService = require('../menu/menu.service');
const { buildTree } = require('../menu/menu.tree');
const flowService = require('../flow/flow.service');
const requestService = require('../request/request.service');
const notificationService = require('../notification/notification.service');
const { assignRequest } = require('../assignment-rule/assignment.engine');
const db = require('../../config/database');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(str) { return UUID_RE.test(str); }

/**
 * Main entry point: process an incoming WhatsApp message.
 *
 * Returns an array of formatted message payloads to send back.
 */
async function handleIncomingMessage(phoneNumber, businessId, messageText) {
  const text = (messageText || '').trim();

  // 1. Load or create session
  let session = await sessionService.loadOrCreate(phoneNumber, businessId);

  // 2. Check timeout
  if (sessionService.isTimedOut(session)) {
    session = await sessionService.reset(session.id);
    const menuMessages = await buildRootMenuResponse(phoneNumber, businessId);
    return [
      formatter.textMessage(phoneNumber, '⏰ Your session timed out. Starting fresh.'),
      ...menuMessages,
    ];
  }

  // 3. Check human takeover mode
  if (session.mode === 'human_takeover') {
    // Touch activity so the session stays alive
    await sessionService.update(session.id, {});
    return [
      formatter.textMessage(
        phoneNumber,
        'You are currently connected with a human agent. Please wait for their response.'
      ),
    ];
  }

  // 4. Route based on context
  // If user is in a flow but clicked a menu button, reset session and go to menu
  if (session.current_flow_id && isUuid(text)) {
    const menuNode = await db('menu_nodes')
      .where({ id: text, business_id: businessId })
      .first();
    if (menuNode) {
      session = await sessionService.update(session.id, {
        current_flow_id: null,
        current_flow_step: null,
        flow_data: null,
        current_menu_node_id: null,
      });
      return handleMenuContext(session, phoneNumber, businessId, text);
    }
  }

  if (session.current_flow_id) {
    return handleFlowContext(session, phoneNumber, businessId, text);
  }

  return handleMenuContext(session, phoneNumber, businessId, text);
}

// ==================== Menu Context ====================

async function handleMenuContext(session, phoneNumber, businessId, text) {
  // Special command: go back to root
  if (text === '#' || text.toLowerCase() === 'menu') {
    session = await sessionService.update(session.id, { current_menu_node_id: null });
    return buildRootMenuResponse(phoneNumber, businessId);
  }

  // Special command: go back to parent
  if (text === '0' || text.toLowerCase() === 'back') {
    return handleGoBack(session, phoneNumber, businessId);
  }

  // Get children of current node (or root)
  const children = await getMenuChildren(businessId, session.current_menu_node_id);

  // If current node is an info node, handle button input instead of children
  if (session.current_menu_node_id && children.length === 0) {
    const currentNode = await db('menu_nodes')
      .where({ id: session.current_menu_node_id, business_id: businessId })
      .first();

    if (currentNode && currentNode.node_type === 'info') {
      return handleInfoButtonInput(session, phoneNumber, businessId, currentNode, text);
    }
  }

  if (children.length === 0) {
    // No children — show root menu
    session = await sessionService.update(session.id, { current_menu_node_id: null });
    return buildRootMenuResponse(phoneNumber, businessId);
  }

  // Match user input to a child
  const selectedIndex = parseInt(text, 10);
  let selectedNode = null;

  if (!isNaN(selectedIndex) && selectedIndex >= 1 && selectedIndex <= children.length) {
    selectedNode = children[selectedIndex - 1];
  } else {
    // Try matching by button id (for interactive replies)
    selectedNode = children.find((c) => c.id === text);
  }

  if (!selectedNode) {
    // Invalid selection — re-show current menu
    const headerText = session.current_menu_node_id
      ? 'Please choose a valid option:'
      : 'Welcome! Please choose an option:';
    return [buildMenuOptionsMessage(phoneNumber, headerText, children)];
  }

  // Handle based on node type
  return handleNodeSelection(session, phoneNumber, businessId, selectedNode);
}

async function handleNodeSelection(session, phoneNumber, businessId, node) {
  switch (node.node_type) {
    case 'menu':
      return handleMenuNode(session, phoneNumber, businessId, node);
    case 'info':
      return handleInfoNode(session, phoneNumber, businessId, node);
    case 'flow_entry':
      return handleFlowEntryNode(session, phoneNumber, businessId, node);
    case 'action':
      return handleActionNode(session, phoneNumber, businessId, node);
    default:
      return [formatter.textMessage(phoneNumber, 'Unknown option type.')];
  }
}

async function handleMenuNode(session, phoneNumber, businessId, node) {
  // Navigate into this menu node
  session = await sessionService.update(session.id, { current_menu_node_id: node.id });

  const children = await getMenuChildren(businessId, node.id);
  if (children.length === 0) {
    return [formatter.textMessage(phoneNumber, `${node.label}\n\nThis menu has no items yet.`)];
  }

  return [buildMenuOptionsMessage(phoneNumber, node.label, children)];
}

async function handleInfoNode(session, phoneNumber, businessId, node) {
  // Set current node to this info node so button responses route back here
  await sessionService.update(session.id, { current_menu_node_id: node.id });

  // Load info_contents for this node
  const infoContent = await db('info_contents').where({ menu_node_id: node.id }).first();
  let text = `📄 *${node.label}*`;
  if (infoContent) {
    if (infoContent.description) text += `\n\n${infoContent.description}`;
    if (infoContent.price) text += `\n💰 Price: ${infoContent.price}`;
    if (infoContent.duration) text += `\n⏱ Duration: ${infoContent.duration}`;
  }

  // Load action buttons for this info node
  const buttons = await db('action_buttons')
    .where({ menu_node_id: node.id })
    .orderBy('sort_order', 'asc')
    .limit(3);

  if (buttons.length > 0) {
    const options = buttons.map((btn) => ({
      id: btn.id,
      title: btn.label,
    }));
    return [formatter.menuMessage(phoneNumber, text, options)];
  }

  // No buttons — show text with back hint
  text += '\n\nReply *0* to go back.';
  return [formatter.textMessage(phoneNumber, text)];
}

async function handleInfoButtonInput(session, phoneNumber, businessId, infoNode, text) {
  const buttons = await db('action_buttons')
    .where({ menu_node_id: infoNode.id })
    .orderBy('sort_order', 'asc')
    .limit(3);

  if (buttons.length === 0) {
    // No buttons — go back to parent
    return handleGoBack(session, phoneNumber, businessId);
  }

  // Match input: by index or by button id
  const selectedIndex = parseInt(text, 10);
  let selectedButton = null;

  if (!isNaN(selectedIndex) && selectedIndex >= 1 && selectedIndex <= buttons.length) {
    selectedButton = buttons[selectedIndex - 1];
  } else {
    selectedButton = buttons.find((b) => b.id === text);
  }

  if (!selectedButton) {
    // Re-show info node with buttons
    return handleInfoNode(session, phoneNumber, businessId, infoNode);
  }

  // Execute button action based on behavior_type
  if (selectedButton.behavior_type === 'trigger_flow' && selectedButton.flow_id) {
    const flow = await flowService.getFlowById(selectedButton.flow_id, businessId);
    if (!flow || !flow.is_active || !flow.steps || flow.steps.length === 0) {
      return [formatter.textMessage(phoneNumber, 'This flow is not available right now.')];
    }

    const firstStep = flow.steps[0];
    await sessionService.update(session.id, {
      current_flow_id: flow.id,
      current_flow_step: firstStep.step_order,
      flow_data: {},
    });

    const messages = [
      formatter.textMessage(phoneNumber, `📝 Starting: *${flow.name}*`),
      buildStepPrompt(phoneNumber, firstStep, businessId),
    ];

    if (firstStep.type === 'select_service') {
      messages[1] = await buildSelectServicePrompt(phoneNumber, firstStep, businessId);
    }

    return messages;
  }

  if (selectedButton.behavior_type === 'action') {
    const config = selectedButton.action_config || {};
    switch (selectedButton.action_type) {
      case 'show_phone':
        return [formatter.textMessage(phoneNumber, `📞 Phone: ${config.phone || 'N/A'}`)];
      case 'show_location':
        return [formatter.textMessage(phoneNumber, `📍 Location: ${config.address || config.url || 'N/A'}`)];
      case 'open_link':
        return [formatter.textMessage(phoneNumber, `🔗 Link: ${config.url || 'N/A'}`)];
      case 'go_back':
        return handleGoBack(session, phoneNumber, businessId);
      default:
        return [formatter.textMessage(phoneNumber, 'Action completed.')];
    }
  }

  return [formatter.textMessage(phoneNumber, 'Unknown button action.')];
}

async function handleFlowEntryNode(session, phoneNumber, businessId, node) {
  if (!node.flow_id) {
    return [formatter.textMessage(phoneNumber, 'This option is not configured yet.')];
  }

  const flow = await flowService.getFlowById(node.flow_id, businessId);
  if (!flow || !flow.is_active || !flow.steps || flow.steps.length === 0) {
    return [formatter.textMessage(phoneNumber, 'This flow is not available right now.')];
  }

  // Start flow: set session to first step
  const firstStep = flow.steps[0];
  session = await sessionService.update(session.id, {
    current_flow_id: flow.id,
    current_flow_step: firstStep.step_order,
    flow_data: {},
  });

  // Send flow intro + first step prompt
  const messages = [
    formatter.textMessage(phoneNumber, `📝 Starting: *${flow.name}*`),
    buildStepPrompt(phoneNumber, firstStep, businessId),
  ];

  // If select_service, we need async resolution
  if (firstStep.type === 'select_service') {
    const prompt = await buildSelectServicePrompt(phoneNumber, firstStep, businessId);
    messages[1] = prompt;
  }

  return messages;
}

async function handleActionNode(session, phoneNumber, businessId, node) {
  await sessionService.update(session.id, {});

  const config = node.action_config || {};

  switch (node.action_type) {
    case 'show_phone':
      return [formatter.textMessage(phoneNumber, `📞 Phone: ${config.phone || 'N/A'}`)];
    case 'show_location':
      return [formatter.textMessage(phoneNumber, `📍 Location: ${config.address || config.url || 'N/A'}`)];
    case 'open_link':
      return [formatter.textMessage(phoneNumber, `🔗 Link: ${config.url || 'N/A'}`)];
    case 'go_back':
      return handleGoBack(session, phoneNumber, businessId);
    default:
      return [formatter.textMessage(phoneNumber, 'Action completed.')];
  }
}

async function handleGoBack(session, phoneNumber, businessId) {
  if (!session.current_menu_node_id) {
    // Already at root
    return buildRootMenuResponse(phoneNumber, businessId);
  }

  // Find parent of current node
  const currentNode = await db('menu_nodes')
    .where({ id: session.current_menu_node_id, business_id: businessId })
    .first();

  const parentId = currentNode ? currentNode.parent_id : null;
  session = await sessionService.update(session.id, { current_menu_node_id: parentId });

  if (!parentId) {
    return buildRootMenuResponse(phoneNumber, businessId);
  }

  const parentNode = await db('menu_nodes')
    .where({ id: parentId, business_id: businessId })
    .first();
  const children = await getMenuChildren(businessId, parentId);
  const label = parentNode ? parentNode.label : 'Menu';
  return [buildMenuOptionsMessage(phoneNumber, label, children)];
}

// ==================== Flow Context ====================

async function handleFlowContext(session, phoneNumber, businessId, text) {
  // Cancel command
  if (text === '#' || text.toLowerCase() === 'cancel') {
    session = await sessionService.update(session.id, {
      current_flow_id: null,
      current_flow_step: null,
      flow_data: null,
      current_menu_node_id: null,
    });
    const menuMessages = await buildRootMenuResponse(phoneNumber, businessId);
    return [
      formatter.textMessage(phoneNumber, '❌ Flow cancelled. Returning to main menu.'),
      ...menuMessages,
    ];
  }

  const flow = await flowService.getFlowById(session.current_flow_id, businessId);
  if (!flow || !flow.steps || flow.steps.length === 0) {
    session = await sessionService.update(session.id, {
      current_flow_id: null,
      current_flow_step: null,
      flow_data: null,
    });
    return [
      formatter.textMessage(phoneNumber, 'This flow is no longer available.'),
      ...(await buildRootMenuResponse(phoneNumber, businessId)),
    ];
  }

  // Find current step
  const currentStep = flow.steps.find((s) => s.step_order === session.current_flow_step);
  if (!currentStep) {
    // Step not found — reset
    session = await sessionService.update(session.id, {
      current_flow_id: null,
      current_flow_step: null,
      flow_data: null,
    });
    return buildRootMenuResponse(phoneNumber, businessId);
  }

  // Validate and process user input for this step
  const validation = await validateStepInput(currentStep, text, businessId);
  if (validation.error) {
    return [
      formatter.textMessage(phoneNumber, `⚠️ ${validation.error}`),
      await resolveStepPrompt(phoneNumber, currentStep, businessId, session.flow_data),
    ];
  }

  // Confirm step: if user said no, cancel the flow
  if (currentStep.type === 'confirm' && validation.value === false) {
    await sessionService.update(session.id, {
      current_flow_id: null,
      current_flow_step: null,
      flow_data: null,
      current_menu_node_id: null,
    });
    const menuMessages = await buildRootMenuResponse(phoneNumber, businessId);
    return [
      formatter.textMessage(phoneNumber, '❌ Request cancelled.'),
      ...menuMessages,
    ];
  }

  // Store collected value
  const flowData = session.flow_data || {};
  flowData[currentStep.label] = validation.value;

  // Find next step
  const currentIndex = flow.steps.findIndex((s) => s.step_order === session.current_flow_step);
  const nextStep = flow.steps[currentIndex + 1];

  if (nextStep) {
    // Advance to next step
    session = await sessionService.update(session.id, {
      current_flow_step: nextStep.step_order,
      flow_data: flowData,
    });

    return [await resolveStepPrompt(phoneNumber, nextStep, businessId, flowData)];
  }

  // Flow complete — create request
  return completeFlow(session, phoneNumber, businessId, flow, flowData);
}

async function completeFlow(session, phoneNumber, businessId, flow, flowData) {
  // Find the menu node the user entered from (fallback to session's current node)
  const enteredFromNodeId =
    (await findFlowEntryNode(flow.id, businessId)) || session.current_menu_node_id || null;

  // Extract service_id from flow data if a select_service step was used
  const enrichedData = { ...flowData };
  for (const value of Object.values(flowData)) {
    if (value && typeof value === 'object' && value.id && value.name) {
      enrichedData._service_id = value.id;
      break;
    }
  }

  // Create request
  let request = await requestService.create(
    {
      source_flow_id: flow.id,
      entered_from_node_id: enteredFromNodeId,
      phone_number: phoneNumber,
      data: enrichedData,
    },
    businessId
  );

  // Notification: request_created
  await notificationService.create({
    businessId,
    type: 'request_created',
    referenceId: request.id,
    referenceType: 'request',
    message: `New request via WhatsApp (flow: ${flow.name})`,
  });

  // Auto-assignment
  const assigned = await assignRequest(request, businessId);
  if (assigned) {
    request = assigned;
    await notificationService.create({
      businessId,
      type: 'request_assigned',
      referenceId: request.id,
      referenceType: 'request',
      message: 'Request auto-assigned to assignee',
    });
  }

  // Reset session flow context
  await sessionService.update(session.id, {
    current_flow_id: null,
    current_flow_step: null,
    flow_data: null,
    current_menu_node_id: null,
  });

  // Send confirmation only — do not auto-restart welcome menu
  return [
    formatter.textMessage(
      phoneNumber,
      `✅ Your request has been submitted successfully!\n\nWe'll get back to you soon.`
    ),
  ];
}

// ==================== Step Validation ====================

async function validateStepInput(step, text, businessId) {
  const config = typeof step.config === 'string' ? JSON.parse(step.config) : (step.config || {});

  switch (step.type) {
    case 'text_input':
      if (!text) return { error: 'Please enter a text response.' };
      return { value: text };

    case 'number_input': {
      const num = Number(text);
      if (isNaN(num)) return { error: 'Please enter a valid number.' };
      if (config.min !== undefined && num < config.min) return { error: `Minimum value is ${config.min}.` };
      if (config.max !== undefined && num > config.max) return { error: `Maximum value is ${config.max}.` };
      return { value: num };
    }

    case 'select_option': {
      const options = config.options || [];
      const idx = parseInt(text, 10);
      if (!isNaN(idx) && idx >= 1 && idx <= options.length) {
        return { value: options[idx - 1] };
      }
      // Try matching by option id
      const match = options.find((o) => (typeof o === 'object' ? o.id === text : false));
      if (match) return { value: typeof match === 'object' ? match.label || match.value : match };
      return { error: `Please select a number between 1 and ${options.length}.` };
    }

    case 'select_service': {
      const services = await db('services')
        .where({ business_id: businessId })
        .select('id', 'name')
        .orderBy('name');
      const idx = parseInt(text, 10);
      if (!isNaN(idx) && idx >= 1 && idx <= services.length) {
        return { value: { id: services[idx - 1].id, name: services[idx - 1].name } };
      }
      const match = services.find((s) => s.id === text);
      if (match) return { value: { id: match.id, name: match.name } };
      return { error: `Please select a number between 1 and ${services.length}.` };
    }

    case 'select_date':
      if (!text) return { error: 'Please enter a date.' };
      return { value: text };

    case 'select_time':
      if (!text) return { error: 'Please enter a time.' };
      return { value: text };

    case 'summary': {
      const lower = text.toLowerCase();
      if (['yes', 'y', '1', 'confirm'].includes(lower)) return { value: 'confirmed' };
      if (['no', 'n', '0', 'cancel'].includes(lower)) return { value: 'rejected' };
      return { error: 'Please reply *yes* to confirm or *no* to cancel.' };
    }

    case 'confirm': {
      const lower2 = text.toLowerCase();
      if (['yes', 'y', '1'].includes(lower2)) return { value: true };
      if (['no', 'n', '0'].includes(lower2)) return { value: false };
      return { error: 'Please reply with *yes* or *no*.' };
    }

    default:
      return { value: text };
  }
}

// ==================== Helpers ====================

/**
 * Get active children of a menu node (or root nodes if parentId is null).
 * Sorted by sort_order.
 */
async function getMenuChildren(businessId, parentId) {
  const query = db('menu_nodes')
    .where({ business_id: businessId, is_active: true })
    .orderBy('sort_order', 'asc');

  if (parentId) {
    query.andWhere({ parent_id: parentId });
  } else {
    query.andWhereRaw('parent_id IS NULL');
  }

  return query;
}

/**
 * Build the root menu response messages.
 */
async function buildRootMenuResponse(phoneNumber, businessId) {
  const rootNodes = await getMenuChildren(businessId, null);

  if (rootNodes.length === 0) {
    return [formatter.textMessage(phoneNumber, 'Welcome! The menu is not configured yet.')];
  }

  return [buildMenuOptionsMessage(phoneNumber, 'Welcome! Please choose an option:', rootNodes)];
}

/**
 * Build a menu options message from an array of menu nodes.
 */
function buildMenuOptionsMessage(phoneNumber, headerText, nodes) {
  const options = nodes.map((node) => ({
    id: node.id,
    title: node.label,
  }));
  return formatter.menuMessage(phoneNumber, headerText, options);
}

/**
 * Build prompt for a flow step (sync version for simple types).
 */
function buildStepPrompt(phoneNumber, step, businessId) {
  const config = typeof step.config === 'string' ? JSON.parse(step.config) : (step.config || {});

  switch (step.type) {
    case 'text_input':
      return formatter.textMessage(phoneNumber, step.label);

    case 'number_input': {
      let hint = step.label;
      if (config.min !== undefined || config.max !== undefined) {
        hint += ` (${config.min !== undefined ? `min: ${config.min}` : ''}${config.min !== undefined && config.max !== undefined ? ', ' : ''}${config.max !== undefined ? `max: ${config.max}` : ''})`;
      }
      return formatter.textMessage(phoneNumber, hint);
    }

    case 'select_option': {
      const options = (config.options || []).map((opt, i) => ({
        id: String(i + 1),
        title: typeof opt === 'object' ? opt.label || opt.value : String(opt),
      }));
      return formatter.menuMessage(phoneNumber, step.label, options);
    }

    case 'select_date':
      return formatter.textMessage(phoneNumber, `${step.label}\n\nPlease enter a date.`);

    case 'select_time':
      return formatter.textMessage(phoneNumber, `${step.label}\n\nPlease enter a time.`);

    case 'summary':
      // Summary needs flow_data — handled in resolveStepPrompt
      return formatter.textMessage(phoneNumber, step.label);

    case 'confirm':
      return formatter.textMessage(phoneNumber, `${step.label}\n\nReply *yes* or *no*.`);

    case 'select_service':
      // Needs async — this is a fallback placeholder
      return formatter.textMessage(phoneNumber, step.label);

    default:
      return formatter.textMessage(phoneNumber, step.label);
  }
}

/**
 * Resolve step prompt with async support (for select_service).
 */
async function resolveStepPrompt(phoneNumber, step, businessId, flowData) {
  if (step.type === 'select_service') {
    return buildSelectServicePrompt(phoneNumber, step, businessId);
  }
  if (step.type === 'summary' && flowData) {
    return buildSummaryPrompt(phoneNumber, step, flowData);
  }
  return buildStepPrompt(phoneNumber, step, businessId);
}

function buildSummaryPrompt(phoneNumber, step, flowData) {
  let text = `📋 *${step.label}*\n`;
  for (const [key, value] of Object.entries(flowData)) {
    const display = typeof value === 'object' ? (value.name || JSON.stringify(value)) : String(value);
    text += `\n• *${key}:* ${display}`;
  }
  text += '\n\nReply *yes* to confirm or *no* to cancel.';
  return formatter.textMessage(phoneNumber, text);
}

/**
 * Build prompt for select_service step type.
 */
async function buildSelectServicePrompt(phoneNumber, step, businessId) {
  const services = await db('services')
    .where({ business_id: businessId })
    .select('id', 'name', 'description', 'price')
    .orderBy('name');

  if (services.length === 0) {
    return formatter.textMessage(phoneNumber, `${step.label}\n\nNo services available.`);
  }

  const options = services.map((s, i) => ({
    id: s.id,
    title: s.name,
    description: s.price ? `$${s.price}` : undefined,
  }));

  return formatter.menuMessage(phoneNumber, step.label, options);
}

/**
 * Find the menu_node that is a flow_entry pointing to the given flow.
 * Returns the node id or null.
 */
async function findFlowEntryNode(flowId, businessId) {
  const node = await db('menu_nodes')
    .where({ business_id: businessId, flow_id: flowId, node_type: 'flow_entry' })
    .first();
  return node ? node.id : null;
}

module.exports = { handleIncomingMessage };
