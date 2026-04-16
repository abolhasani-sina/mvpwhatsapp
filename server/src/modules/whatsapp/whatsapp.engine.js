const sessionService = require('./session.service');
const formatter = require('./whatsapp.formatter');
const menuService = require('../menu/menu.service');
const { buildTree } = require('../menu/menu.tree');
const flowService = require('../flow/flow.service');
const requestService = require('../request/request.service');
const notificationService = require('../notification/notification.service');
const { assignRequest } = require('../assignment-rule/assignment.engine');
const serviceService = require('../service/service.service');
const db = require('../../config/database');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(str) { return UUID_RE.test(str); }

/**
 * Main entry point: process an incoming WhatsApp message.
 *
 * Returns an array of formatted message payloads to send back.
 * messageType: 'interactive' | 'text'
 */
async function handleIncomingMessage(phoneNumber, businessId, messageText, messageType) {
  const text = (messageText || '').trim();

  // 1. Load or create session
  let session = await sessionService.loadOrCreate(phoneNumber, businessId);

  // 2. Check timeout
  if (sessionService.isTimedOut(session)) {
    session = await sessionService.reset(session.id);
    return resetToRootMenu(session, phoneNumber, businessId);
  }

  // 3. Check human takeover mode
  if (session.mode === 'human_takeover') {
    await sessionService.update(session.id, {});
    return [
      formatter.textMessage(
        phoneNumber,
        'You are currently connected with a human agent. Please wait for their response.'
      ),
    ];
  }

  // 4. Strict mode routing — MENU, FLOW, and CATALOG are completely isolated

  // === CATALOG MODE ===
  if (session.current_catalog_node_id !== null && session.current_catalog_node_id !== undefined) {
    if (text === '#' || text.toLowerCase() === 'menu') {
      // Exit catalog, go to root menu
      session = await sessionService.update(session.id, { current_catalog_node_id: null, current_menu_node_id: null });
      return resetToRootMenu(session, phoneNumber, businessId);
    }
    if (text === '0' || text.toLowerCase() === 'back') {
      return handleCatalogBack(session, phoneNumber, businessId);
    }
    return handleCatalogContext(session, phoneNumber, businessId, text);
  }

  if (session.current_flow_id) {
    // === FLOW MODE ===
    // Allow cancel command from any input type
    if (text === '#' || text.toLowerCase() === 'cancel') {
      return cancelFlow(session, phoneNumber, businessId);
    }
    // Block menu navigation — ignore UUID clicks that are menu nodes
    if (isUuid(text) && messageType === 'interactive') {
      const menuNode = await db('menu_nodes')
        .where({ id: text, business_id: businessId })
        .first();
      if (menuNode) {
        // User tried to click a menu button while in flow — reject
        const flow = await flowService.getFlowById(session.current_flow_id, businessId);
        const currentStep = flow && flow.steps
          ? flow.steps.find((s) => s.step_order === session.current_flow_step)
          : null;
        if (currentStep) {
          return [
            formatter.textMessage(phoneNumber, '⚠️ You are currently in a flow. Please complete it or type *cancel* to exit.'),
            await resolveStepPrompt(phoneNumber, currentStep, businessId, session.flow_data),
          ];
        }
      }
    }
    return handleFlowContext(session, phoneNumber, businessId, text);
  }

  // === MENU MODE ===
  // Only interactive input (buttons/list) allowed — reject plain text
  if (messageType === 'text' && !isSpecialCommand(text)) {
    return rejectTextInMenu(session, phoneNumber, businessId);
  }

  return handleMenuContext(session, phoneNumber, businessId, text);
}

/**
 * Check if text is a special command allowed in menu mode.
 */
function isSpecialCommand(text) {
  const lower = text.toLowerCase();
  return lower === '#' || lower === 'menu' || lower === '0' || lower === 'back';
}

/**
 * Reject text input in menu mode — re-show current menu.
 */
async function rejectTextInMenu(session, phoneNumber, businessId) {
  if (session.current_menu_node_id) {
    const children = await getMenuChildren(businessId, session.current_menu_node_id);
    if (children.length > 0) {
      return [buildMenuOptionsMessage(phoneNumber, 'Please choose an option 👇', children)];
    }
  }
  return resetToRootMenu(session, phoneNumber, businessId);
}

/**
 * Cancel flow and return to menu.
 */
async function cancelFlow(session, phoneNumber, businessId) {
  session = await sessionService.update(session.id, {
    current_flow_id: null,
    current_flow_step: null,
    flow_data: null,
    current_menu_node_id: null,
    current_catalog_node_id: null,
  });
  const menuMessages = await resetToRootMenu(session, phoneNumber, businessId);
  return [
    formatter.textMessage(phoneNumber, '❌ Flow cancelled. Returning to main menu.'),
    ...menuMessages,
  ];
}

// ==================== Menu Context ====================

async function handleMenuContext(session, phoneNumber, businessId, text) {
  // Special command: go back to root
  if (text === '#' || text.toLowerCase() === 'menu') {
    session = await sessionService.update(session.id, { current_menu_node_id: null });
    return resetToRootMenu(session, phoneNumber, businessId);
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
    return resetToRootMenu(session, phoneNumber, businessId);
  }

  // Match user input to a child (by sequential index — no UUIDs exposed)
  const selectedIndex = parseInt(text, 10);
  let selectedNode = null;

  if (!isNaN(selectedIndex) && selectedIndex >= 1 && selectedIndex <= children.length) {
    selectedNode = children[selectedIndex - 1];
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
    case 'catalog_entry':
      return handleCatalogEntryNode(session, phoneNumber, businessId, node);
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
    const options = buttons.map((btn, i) => ({
      id: String(i + 1),
      title: btn.label,
    }));
    return [formatter.menuMessage(phoneNumber, text, options)];
  }

  // No buttons — show back button
  return [
    formatter.textMessage(phoneNumber, text),
    formatter.menuMessage(phoneNumber, 'What would you like to do?', [{ id: '0', title: '⬅️ Back' }]),
  ];
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

  // Match input: by sequential index (buttons use "1", "2", "3")
  const selectedIndex = parseInt(text, 10);
  let selectedButton = null;

  if (!isNaN(selectedIndex) && selectedIndex >= 1 && selectedIndex <= buttons.length) {
    selectedButton = buttons[selectedIndex - 1];
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
    return resetToRootMenu(session, phoneNumber, businessId);
  }

  // Find parent of current node
  const currentNode = await db('menu_nodes')
    .where({ id: session.current_menu_node_id, business_id: businessId })
    .first();

  const parentId = currentNode ? currentNode.parent_id : null;

  if (!parentId) {
    // Going back to root
    session = await sessionService.update(session.id, { current_menu_node_id: null });
    return resetToRootMenu(session, phoneNumber, businessId);
  }

  // Check if parent is the root wrapper — if so, treat as root
  const parentNode = await db('menu_nodes')
    .where({ id: parentId, business_id: businessId })
    .first();
  if (parentNode && !parentNode.parent_id) {
    // Parent is root-level — check if it's the wrapper
    const rootNodes = await getMenuChildren(businessId, null);
    if (rootNodes.length === 1 && rootNodes[0].node_type === 'menu' && rootNodes[0].id === parentId) {
      // Parent IS the wrapper — go to root display
      session = await sessionService.update(session.id, { current_menu_node_id: null });
      return resetToRootMenu(session, phoneNumber, businessId);
    }
  }

  session = await sessionService.update(session.id, { current_menu_node_id: parentId });
  const children = await getMenuChildren(businessId, parentId);
  const label = parentNode ? parentNode.label : 'Menu';
  return [buildMenuOptionsMessage(phoneNumber, label, children)];
}

// ==================== Flow Context ====================

async function handleFlowContext(session, phoneNumber, businessId, text) {
  // Cancel is already handled in handleIncomingMessage before reaching here

  const flow = await flowService.getFlowById(session.current_flow_id, businessId);
  if (!flow || !flow.steps || flow.steps.length === 0) {
    session = await sessionService.update(session.id, {
      current_flow_id: null,
      current_flow_step: null,
      flow_data: null,
    });
    return resetToRootMenu(session, phoneNumber, businessId);
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
    return resetToRootMenu(session, phoneNumber, businessId);
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
      current_catalog_node_id: null,
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

  // Reset session flow context — back to root menu state
  session = await sessionService.update(session.id, {
    current_flow_id: null,
    current_flow_step: null,
    flow_data: null,
    current_menu_node_id: null,
    current_catalog_node_id: null,
  });

  // Set session to root wrapper so next message routes correctly
  const root = await resolveRootMenu(businessId);
  if (root.wrapperId) {
    await sessionService.update(session.id, { current_menu_node_id: root.wrapperId });
  }

  // Send confirmation ONLY — no auto-menu
  return [
    formatter.textMessage(
      phoneNumber,
      `✅ Your request has been submitted successfully!\n\nWe'll get back to you soon.\n\nSend any message to return to the menu.`
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
        const opt = options[idx - 1];
        return { value: typeof opt === 'object' ? (opt.label || opt.value || opt) : String(opt) };
      }
      return { error: `Please select a number between 1 and ${options.length}.` };
    }

    case 'select_service': {
      // Load leaf services (at any depth — nodes with no children)
      const leafServices = await serviceService.getLeafServices(businessId);

      const idx = parseInt(text, 10);
      if (!isNaN(idx) && idx >= 1 && idx <= leafServices.length) {
        const svc = leafServices[idx - 1];
        return { value: { id: svc.id, name: svc.name } };
      }
      return { error: `Please select a number between 1 and ${leafServices.length}.` };
    }

    // Legacy select_date — treat as select_option with config.options
    case 'select_date': {
      // If has date_options (legacy), treat them as regular options
      const dateOpts = config.date_options || config.options || [];
      if (dateOpts.length > 0) {
        const idx = parseInt(text, 10);
        if (!isNaN(idx) && idx >= 1 && idx <= dateOpts.length) {
          const opt = dateOpts[idx - 1];
          return { value: typeof opt === 'object' ? (opt.label || opt) : String(opt) };
        }
        return { error: `Please select a number between 1 and ${dateOpts.length}.` };
      }
      // No options defined — accept free text
      if (!text) return { error: 'Please enter your answer.' };
      return { value: text };
    }

    case 'select_time':
      if (!text) return { error: 'Please enter your answer.' };
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
 * Resolve the root menu structure for a business.
 * Handles the Builder pattern where a single root "menu" node wraps all buttons.
 * Falls back to services table (WhatsApp Builder data) if no menu_nodes exist.
 */
async function resolveRootMenu(businessId) {
  const rootNodes = await getMenuChildren(businessId, null);

  // Builder pattern: single root menu node wraps everything
  if (rootNodes.length === 1 && rootNodes[0].node_type === 'menu') {
    const wrapper = rootNodes[0];
    const children = await getMenuChildren(businessId, wrapper.id);
    if (children.length > 0) {
      return { wrapperId: wrapper.id, welcomeText: wrapper.label, children };
    }
  }

  // Direct root nodes (legacy / no wrapper)
  if (rootNodes.length > 0) {
    return { wrapperId: null, welcomeText: 'Welcome! Please choose an option:', children: rootNodes };
  }

  // No menu_nodes — fall back to services (WhatsApp Builder model)
  const rootServices = await getCatalogChildren(businessId, null);
  if (rootServices.length > 0) {
    return {
      wrapperId: null,
      welcomeText: 'Welcome! How can we help you today?',
      children: rootServices,
      isServiceBased: true,
    };
  }

  return { wrapperId: null, welcomeText: null, children: [] };
}

/**
 * Reset session to root menu and return the welcome message.
 * Sets current_menu_node_id to the wrapper node so button clicks match correctly.
 * If no menu_nodes but services exist, auto-enters catalog mode.
 */
async function resetToRootMenu(session, phoneNumber, businessId) {
  const root = await resolveRootMenu(businessId);

  if (root.children.length === 0) {
    await sessionService.update(session.id, { current_menu_node_id: null, current_catalog_node_id: null });
    return [formatter.textMessage(phoneNumber, 'Menu is not configured yet.')];
  }

  // Service-based menu (WhatsApp Builder) — enter catalog mode
  if (root.isServiceBased) {
    await sessionService.update(session.id, {
      current_menu_node_id: null,
      current_catalog_node_id: 'ROOT',
      current_flow_id: null,
      current_flow_step: null,
      flow_data: null,
    });
    return [buildCatalogOptionsMessage(phoneNumber, root.welcomeText, root.children)];
  }

  // Set session to wrapper node so next button click finds the right children
  await sessionService.update(session.id, { current_menu_node_id: root.wrapperId });

  return [buildMenuOptionsMessage(phoneNumber, root.welcomeText, root.children)];
}

/**
 * Build a menu options message from an array of menu nodes.
 */
function buildMenuOptionsMessage(phoneNumber, headerText, nodes) {
  const options = nodes.map((node, i) => ({
    id: String(i + 1),
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

    // Legacy select_date — render as regular options
    case 'select_date': {
      const dateOpts = config.date_options || config.options || [];
      if (dateOpts.length > 0) {
        const options = dateOpts.map((opt, i) => ({
          id: String(i + 1),
          title: typeof opt === 'object' ? (opt.label || opt) : String(opt),
        }));
        return formatter.menuMessage(phoneNumber, step.label, options);
      }
      return formatter.textMessage(phoneNumber, step.label);
    }

    case 'select_time':
      return formatter.textMessage(phoneNumber, `${step.label}`);

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

async function buildSelectServicePrompt(phoneNumber, step, businessId) {
  // Load full service tree and leaf services
  const allServices = await db('services')
    .where({ business_id: businessId })
    .select('id', 'name', 'description', 'price', 'parent_id')
    .orderBy('name');

  if (allServices.length === 0) {
    return formatter.textMessage(phoneNumber, `${step.label}\n\nNo services available.`);
  }

  // Determine leaf services (no children at any depth)
  const parentIds = new Set(allServices.filter(s => s.parent_id).map(s => s.parent_id));
  const leafServices = allServices.filter(s => !parentIds.has(s.id));

  // Build path labels for context (walk up parent chain)
  const byId = Object.fromEntries(allServices.map(s => [s.id, s]));
  const options = leafServices.map((s, i) => {
    const parts = [];
    let cur = byId[s.parent_id];
    while (cur) { parts.unshift(cur.name); cur = byId[cur.parent_id]; }
    const breadcrumb = parts.length > 0 ? parts.join(' > ') : undefined;
    return {
      id: String(i + 1),
      title: s.name,
      description: breadcrumb || (s.price ? `$${s.price}` : undefined),
    };
  });

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

// ==================== Catalog Browsing ====================

/**
 * Handle catalog_entry menu node — enter catalog browsing mode.
 * catalog_node_id points to the root service node (or null for full catalog).
 */
async function handleCatalogEntryNode(session, phoneNumber, businessId, node) {
  // The catalog_node_id on the menu node tells us where to start browsing
  const startNodeId = node.catalog_node_id || null;

  // Set session into catalog browsing mode
  // Use 'ROOT' marker when browsing from the very top, or the actual service ID
  const catalogState = startNodeId || 'ROOT';
  session = await sessionService.update(session.id, {
    current_catalog_node_id: catalogState,
  });

  // Load children of the starting catalog node
  const children = await getCatalogChildren(businessId, startNodeId);
  if (children.length === 0) {
    // No catalog items — exit catalog mode
    await sessionService.update(session.id, { current_catalog_node_id: null });
    return [formatter.textMessage(phoneNumber, '📋 No services available in the catalog yet.')];
  }

  return [buildCatalogOptionsMessage(phoneNumber, '📋 *Business Catalog*\n\nBrowse our services:', children)];
}

/**
 * Handle user input while in catalog browsing mode.
 * Supports Builder behavior types: show_children, show_description, ask_questions, direct_action.
 */
async function handleCatalogContext(session, phoneNumber, businessId, text) {
  // Check if we're in a service-based form (ask_questions behavior)
  if (session.current_flow_step !== null && session.current_flow_step !== undefined && !session.current_flow_id) {
    return handleServiceFormContext(session, phoneNumber, businessId, text);
  }

  const currentId = session.current_catalog_node_id === 'ROOT' ? null : session.current_catalog_node_id;

  const children = await getCatalogChildren(businessId, currentId);

  if (children.length === 0) {
    // Current node is a leaf — check if it has button actions
    if (currentId) {
      return handleCatalogLeafAction(session, phoneNumber, businessId, currentId, text);
    }
    // No items at root — shouldn't happen
    await sessionService.update(session.id, { current_catalog_node_id: null });
    return resetToRootMenu(session, phoneNumber, businessId);
  }

  // Match user input to a child by sequential index
  const selectedIndex = parseInt(text, 10);
  if (isNaN(selectedIndex) || selectedIndex < 1 || selectedIndex > children.length) {
    return [buildCatalogOptionsMessage(phoneNumber, 'Please choose a valid option:', children)];
  }

  const selectedNode = children[selectedIndex - 1];
  const behavior = parseServiceBehavior(selectedNode.behavior);

  // Route based on Builder behavior type
  if (behavior.type === 'direct_action') {
    return handleServiceDirectAction(session, phoneNumber, businessId, selectedNode, behavior);
  }

  if (behavior.type === 'custom' && behavior.mode === 'ask_questions' && behavior.steps?.length > 0) {
    return startServiceForm(session, phoneNumber, businessId, selectedNode, behavior);
  }

  if (behavior.type === 'show_description') {
    // Show info page, then show children (if any) as action buttons
    session = await sessionService.update(session.id, {
      current_catalog_node_id: selectedNode.id,
    });
    return showServiceInfoPage(phoneNumber, selectedNode, businessId);
  }

  // Default (show_children or no behavior) — navigate into children
  const grandchildren = await getCatalogChildren(businessId, selectedNode.id);

  if (grandchildren.length > 0) {
    session = await sessionService.update(session.id, {
      current_catalog_node_id: selectedNode.id,
    });

    const headerText = `*${selectedNode.name}*${selectedNode.description ? '\n' + selectedNode.description : ''}\n\nChoose an option:`;
    return [buildCatalogOptionsMessage(phoneNumber, headerText, grandchildren)];
  }

  // Leaf node — show details and buttons
  session = await sessionService.update(session.id, {
    current_catalog_node_id: selectedNode.id,
  });

  return showCatalogLeaf(phoneNumber, selectedNode, businessId);
}

/**
 * Show a leaf service's details and configurable buttons.
 */
async function showCatalogLeaf(phoneNumber, service, businessId) {
  let text = `🏷️ *${service.name}*`;
  if (service.description) text += `\n\n${service.description}`;
  if (service.price != null) text += `\n\n💰 Price: $${service.price}`;
  if (service.duration) text += `\n⏱ Duration: ${service.duration}`;

  // Parse buttons from the service
  const buttons = parseServiceButtons(service);

  if (buttons.length > 0) {
    const options = buttons.map((btn, i) => ({
      id: String(i + 1),
      title: btn.label,
    }));
    // Add back button
    options.push({ id: '0', title: '⬅️ Back' });
    return [formatter.menuMessage(phoneNumber, text, options)];
  }

  // Default buttons if none configured
  return [formatter.menuMessage(phoneNumber, text, [
    { id: '1', title: '📝 Book Now' },
    { id: '0', title: '⬅️ Back' },
  ])];
}

/**
 * Handle button action on a leaf catalog node.
 * Also handles show_description services with children (action buttons).
 */
async function handleCatalogLeafAction(session, phoneNumber, businessId, serviceId, text) {
  const service = await serviceService.getById(serviceId, businessId);
  if (!service) {
    await sessionService.update(session.id, { current_catalog_node_id: null });
    return resetToRootMenu(session, phoneNumber, businessId);
  }

  // Handle back
  if (text === '0') {
    return handleCatalogBack(session, phoneNumber, businessId);
  }

  const behavior = parseServiceBehavior(service.behavior);
  const selectedIndex = parseInt(text, 10);

  // For show_description services, children serve as action buttons
  if (behavior.type === 'show_description') {
    const children = await getCatalogChildren(businessId, service.id);
    if (children.length > 0 && !isNaN(selectedIndex) && selectedIndex >= 1 && selectedIndex <= children.length) {
      const selectedChild = children[selectedIndex - 1];
      const childBehavior = parseServiceBehavior(selectedChild.behavior);

      // Route child based on its behavior
      if (childBehavior.type === 'direct_action') {
        return handleServiceDirectAction(session, phoneNumber, businessId, selectedChild, childBehavior);
      }
      if (childBehavior.type === 'custom' && childBehavior.mode === 'ask_questions' && childBehavior.steps?.length > 0) {
        return startServiceForm(session, phoneNumber, businessId, selectedChild, childBehavior);
      }
      // Default: navigate into child or show leaf
      const grandchildren = await getCatalogChildren(businessId, selectedChild.id);
      if (grandchildren.length > 0) {
        session = await sessionService.update(session.id, { current_catalog_node_id: selectedChild.id });
        return [buildCatalogOptionsMessage(phoneNumber, `*${selectedChild.name}*\n\nChoose an option:`, grandchildren)];
      }
      session = await sessionService.update(session.id, { current_catalog_node_id: selectedChild.id });
      return showCatalogLeaf(phoneNumber, selectedChild, businessId);
    }
    // Invalid selection — re-show info page
    return showServiceInfoPage(phoneNumber, service, businessId);
  }

  // Standard leaf with configured buttons
  const buttons = parseServiceButtons(service);

  if (buttons.length > 0 && !isNaN(selectedIndex) && selectedIndex >= 1 && selectedIndex <= buttons.length) {
    const btn = buttons[selectedIndex - 1];
    return executeCatalogButton(session, phoneNumber, businessId, service, btn);
  }

  // Default action: if no buttons configured, "1" = booking
  if (text === '1' && buttons.length === 0) {
    return handleCatalogBooking(session, phoneNumber, businessId, service);
  }

  // Invalid — re-show leaf
  return showCatalogLeaf(phoneNumber, service, businessId);
}

/**
 * Execute a button action from a catalog leaf node.
 */
async function executeCatalogButton(session, phoneNumber, businessId, service, button) {
  const config = button.config || {};

  switch (button.type) {
    case 'booking':
      return handleCatalogBooking(session, phoneNumber, businessId, service);

    case 'phone':
      return [
        formatter.textMessage(phoneNumber, `📞 Phone: ${config.phone || 'Contact us for details'}`),
        ...(await showCatalogLeaf(phoneNumber, service, businessId)),
      ];

    case 'link':
      return [
        formatter.textMessage(phoneNumber, `🔗 Link: ${config.url || 'N/A'}`),
        ...(await showCatalogLeaf(phoneNumber, service, businessId)),
      ];

    case 'back':
      return handleCatalogBack(session, phoneNumber, businessId);

    case 'go_to_node': {
      if (config.target_node_id) {
        const targetNode = await db('menu_nodes')
          .where({ id: config.target_node_id, business_id: businessId })
          .first();
        if (targetNode) {
          await sessionService.update(session.id, { current_catalog_node_id: null });
          return handleNodeSelection(session, phoneNumber, businessId, targetNode);
        }
      }
      return [formatter.textMessage(phoneNumber, 'Target not found.')];
    }

    case 'handover':
      await sessionService.update(session.id, {
        current_catalog_node_id: null,
        mode: 'human_takeover',
      });
      return [formatter.textMessage(phoneNumber, '👤 You are now connected to a human agent. Please wait for a response.')];

    default:
      return showCatalogLeaf(phoneNumber, service, businessId);
  }
}

/**
 * Handle booking action from catalog — find a booking flow and start it with service pre-selected.
 */
async function handleCatalogBooking(session, phoneNumber, businessId, service) {
  // Find a flow that has a select_service step (likely the booking flow)
  const flows = await db('flows').where({ business_id: businessId, is_active: true });
  let bookingFlow = null;

  for (const flow of flows) {
    const steps = await db('flow_steps').where({ flow_id: flow.id }).orderBy('step_order', 'asc');
    if (steps.some(s => s.type === 'select_service')) {
      bookingFlow = { ...flow, steps };
      break;
    }
  }

  if (!bookingFlow) {
    // No booking flow — create a simple request directly
    await sessionService.update(session.id, { current_catalog_node_id: null, current_menu_node_id: null });
    const request = await requestService.create(
      {
        phone_number: phoneNumber,
        data: { service: { id: service.id, name: service.name }, _service_id: service.id },
      },
      businessId
    );
    await notificationService.create({
      businessId,
      type: 'request_created',
      referenceId: request.id,
      referenceType: 'request',
      message: `New booking request for ${service.name}`,
    });
    await assignRequest(request, businessId);

    const root = await resolveRootMenu(businessId);
    if (root.wrapperId) {
      await sessionService.update(session.id, { current_menu_node_id: root.wrapperId });
    }

    return [
      formatter.textMessage(phoneNumber, `✅ Your request for *${service.name}* has been submitted!\n\nWe'll get back to you soon.\n\nSend any message to return to the menu.`),
    ];
  }

  // Start the booking flow with service pre-selected
  const firstStep = bookingFlow.steps[0];
  const flowData = {};

  // If first step is select_service, skip it by pre-filling
  if (firstStep.type === 'select_service') {
    flowData[firstStep.label] = { id: service.id, name: service.name };
    const nextStep = bookingFlow.steps[1];
    if (!nextStep) {
      // Only one step? Complete immediately
      return completeFlow(session, phoneNumber, businessId, bookingFlow, flowData);
    }

    await sessionService.update(session.id, {
      current_catalog_node_id: null,
      current_flow_id: bookingFlow.id,
      current_flow_step: nextStep.step_order,
      flow_data: flowData,
    });

    return [
      formatter.textMessage(phoneNumber, `📝 Booking *${service.name}*`),
      await resolveStepPrompt(phoneNumber, nextStep, businessId, flowData),
    ];
  }

  // First step is not select_service — start flow normally
  await sessionService.update(session.id, {
    current_catalog_node_id: null,
    current_flow_id: bookingFlow.id,
    current_flow_step: firstStep.step_order,
    flow_data: {},
  });

  return [
    formatter.textMessage(phoneNumber, `📝 Starting: *${bookingFlow.name}*`),
    await resolveStepPrompt(phoneNumber, firstStep, businessId, {}),
  ];
}

/**
 * Go back in catalog: navigate to parent service node or exit to menu.
 */
async function handleCatalogBack(session, phoneNumber, businessId) {
  const currentId = session.current_catalog_node_id === 'ROOT' ? null : session.current_catalog_node_id;

  if (!currentId) {
    // Already at catalog root — exit to menu
    await sessionService.update(session.id, { current_catalog_node_id: null });
    return resetToRootMenu(session, phoneNumber, businessId);
  }

  const currentNode = await db('services')
    .where({ id: currentId, business_id: businessId })
    .first();

  if (!currentNode || !currentNode.parent_id) {
    // At top level of catalog — go to catalog root
    session = await sessionService.update(session.id, { current_catalog_node_id: 'ROOT' });
    const children = await getCatalogChildren(businessId, null);
    if (children.length === 0) {
      await sessionService.update(session.id, { current_catalog_node_id: null });
      return resetToRootMenu(session, phoneNumber, businessId);
    }
    return [buildCatalogOptionsMessage(phoneNumber, '📋 *Business Catalog*\n\nBrowse our services:', children)];
  }

  // Navigate to parent
  session = await sessionService.update(session.id, {
    current_catalog_node_id: currentNode.parent_id,
  });

  const parent = await db('services')
    .where({ id: currentNode.parent_id, business_id: businessId })
    .first();
  const siblings = await getCatalogChildren(businessId, currentNode.parent_id);
  const headerText = parent ? `📁 *${parent.name}*\n\nChoose a service:` : '📋 *Business Catalog*\n\nBrowse our services:';
  return [buildCatalogOptionsMessage(phoneNumber, headerText, siblings)];
}

/**
 * Get children services of a catalog node (or root if parentId is null).
 */
async function getCatalogChildren(businessId, parentId) {
  const query = db('services')
    .where({ business_id: businessId })
    .orderBy('sort_order', 'asc')
    .orderBy('name', 'asc');

  if (parentId) {
    query.andWhere({ parent_id: parentId });
  } else {
    query.andWhereRaw('parent_id IS NULL');
  }

  return query;
}

/**
 * Build a catalog options message from service nodes.
 */
function buildCatalogOptionsMessage(phoneNumber, headerText, serviceNodes) {
  const options = serviceNodes.map((node, i) => ({
    id: String(i + 1),
    title: node.name,
    description: node.description ? node.description.substring(0, 72) : undefined,
  }));
  return formatter.menuMessage(phoneNumber, headerText, options);
}

/**
 * Parse buttons from a service's buttons JSON field.
 * Returns default buttons if none configured.
 */
function parseServiceButtons(service) {
  let buttons = [];
  if (service.buttons) {
    try {
      buttons = typeof service.buttons === 'string' ? JSON.parse(service.buttons) : service.buttons;
    } catch {
      buttons = [];
    }
  }
  return Array.isArray(buttons) ? buttons : [];
}

/**
 * Parse behavior JSON from a service record.
 */
function parseServiceBehavior(behavior) {
  if (!behavior) return {};
  if (typeof behavior === 'string') {
    try { return JSON.parse(behavior); } catch { return {}; }
  }
  return behavior;
}

/**
 * Show a service info page (show_description behavior).
 * Displays description, price, duration, then action buttons or child buttons.
 */
async function showServiceInfoPage(phoneNumber, service, businessId) {
  let text = `📄 *${service.name}*`;
  if (service.description) text += `\n\n${service.description}`;
  if (service.price != null) text += `\n\n💰 Price: $${service.price}`;
  if (service.duration) text += `\n⏱ Duration: ${service.duration}`;

  // Check for children (action buttons added inside this info page)
  const children = await getCatalogChildren(businessId, service.id);
  if (children.length > 0) {
    const options = children.map((child, i) => ({
      id: String(i + 1),
      title: child.name,
    }));
    options.push({ id: '0', title: '⬅️ Back' });
    return [formatter.menuMessage(phoneNumber, text, options)];
  }

  // Use configured buttons if any
  const buttons = parseServiceButtons(service);
  if (buttons.length > 0) {
    const options = buttons.map((btn, i) => ({
      id: String(i + 1),
      title: btn.label,
    }));
    options.push({ id: '0', title: '⬅️ Back' });
    return [formatter.menuMessage(phoneNumber, text, options)];
  }

  // Default: just back button
  return [formatter.menuMessage(phoneNumber, text, [
    { id: '1', title: '📝 Book Now' },
    { id: '0', title: '⬅️ Back' },
  ])];
}

/**
 * Handle direct_action behavior from a Builder service.
 */
async function handleServiceDirectAction(session, phoneNumber, businessId, service, behavior) {
  const action = behavior.action || 'back';
  const config = behavior.config || {};

  switch (action) {
    case 'phone':
      return [
        formatter.textMessage(phoneNumber, `📞 Phone: ${config.phone || 'Contact us for details'}`),
      ];
    case 'link':
      return [
        formatter.textMessage(phoneNumber, `🔗 Link: ${config.url || 'N/A'}`),
      ];
    case 'handover':
      await sessionService.update(session.id, {
        current_catalog_node_id: null,
        mode: 'human_takeover',
      });
      return [formatter.textMessage(phoneNumber, '👤 You are now connected to a human agent. Please wait for a response.')];
    case 'back':
    default:
      return handleCatalogBack(session, phoneNumber, businessId);
  }
}

/**
 * Start an inline form from a Builder service's ask_questions behavior.
 * Uses session.current_flow_step to track progress through behavior.steps.
 */
async function startServiceForm(session, phoneNumber, businessId, service, behavior) {
  const steps = behavior.steps || [];
  if (steps.length === 0) {
    return [formatter.textMessage(phoneNumber, 'This form has no questions configured yet.')];
  }

  // Enter form mode: set catalog node to the service, flow_step to 0
  await sessionService.update(session.id, {
    current_catalog_node_id: service.id,
    current_flow_id: null,
    current_flow_step: 0,
    flow_data: {},
  });

  const firstStep = steps[0];
  return [buildServiceFormPrompt(phoneNumber, firstStep, 0, steps.length)];
}

/**
 * Handle user input during a service-based form (ask_questions behavior).
 */
async function handleServiceFormContext(session, phoneNumber, businessId, text) {
  const serviceId = session.current_catalog_node_id;
  const service = await serviceService.getById(serviceId, businessId);

  if (!service) {
    await sessionService.update(session.id, {
      current_catalog_node_id: null,
      current_flow_step: null,
      flow_data: null,
    });
    return resetToRootMenu(session, phoneNumber, businessId);
  }

  const behavior = parseServiceBehavior(service.behavior);
  const steps = behavior.steps || [];
  const stepIdx = session.current_flow_step || 0;
  const currentStep = steps[stepIdx];

  if (!currentStep) {
    // No more steps — complete the form
    return completeServiceForm(session, phoneNumber, businessId, service, session.flow_data || {});
  }

  // Validate user input
  const validation = validateServiceFormInput(currentStep, text);
  if (validation.error) {
    return [
      formatter.textMessage(phoneNumber, `⚠️ ${validation.error}`),
      buildServiceFormPrompt(phoneNumber, currentStep, stepIdx, steps.length),
    ];
  }

  // Store answer
  const flowData = session.flow_data || {};
  flowData[currentStep.question || `Step ${stepIdx + 1}`] = validation.value;

  // Check for next step
  const nextIdx = stepIdx + 1;
  if (nextIdx < steps.length) {
    await sessionService.update(session.id, {
      current_flow_step: nextIdx,
      flow_data: flowData,
    });
    return [buildServiceFormPrompt(phoneNumber, steps[nextIdx], nextIdx, steps.length)];
  }

  // Form complete
  return completeServiceForm(session, phoneNumber, businessId, service, flowData);
}

/**
 * Complete a service-based form — create a request with collected data.
 */
async function completeServiceForm(session, phoneNumber, businessId, service, flowData) {
  // Create request
  const enrichedData = { ...flowData, _service_id: service.id, _service_name: service.name };
  const request = await requestService.create(
    {
      phone_number: phoneNumber,
      data: enrichedData,
    },
    businessId
  );

  await notificationService.create({
    businessId,
    type: 'request_created',
    referenceId: request.id,
    referenceType: 'request',
    message: `New request via form: ${service.name}`,
  });

  await assignRequest(request, businessId);

  // Reset session
  await sessionService.update(session.id, {
    current_catalog_node_id: null,
    current_flow_id: null,
    current_flow_step: null,
    flow_data: null,
    current_menu_node_id: null,
  });

  return [
    formatter.textMessage(
      phoneNumber,
      `✅ Your request has been submitted!\n\nWe'll get back to you soon.\n\nSend any message to return to the menu.`
    ),
  ];
}

/**
 * Build prompt message for a service form step.
 */
function buildServiceFormPrompt(phoneNumber, step, stepIdx, totalSteps) {
  const questionText = `📝 (${stepIdx + 1}/${totalSteps}) ${step.question || 'Please answer:'}`;

  if (step.answerType === 'select' || step.answerType === 'hybrid') {
    const opts = step.options || [];
    if (opts.length > 0) {
      const options = opts.map((opt, i) => ({
        id: String(i + 1),
        title: typeof opt === 'string' ? opt : String(opt),
      }));
      if (step.answerType === 'hybrid' && step.allowManual) {
        return formatter.menuMessage(phoneNumber, questionText + '\n\n_Or type your own answer._', options);
      }
      return formatter.menuMessage(phoneNumber, questionText, options);
    }
  }

  // Text input — just ask the question
  return formatter.textMessage(phoneNumber, questionText);
}

/**
 * Validate input for a service form step.
 */
function validateServiceFormInput(step, text) {
  if (!text || !text.trim()) {
    return { error: 'Please provide an answer.' };
  }

  if (step.answerType === 'select') {
    const opts = step.options || [];
    const idx = parseInt(text, 10);
    if (!isNaN(idx) && idx >= 1 && idx <= opts.length) {
      return { value: opts[idx - 1] };
    }
    return { error: `Please select a number between 1 and ${opts.length}.` };
  }

  if (step.answerType === 'hybrid') {
    const opts = step.options || [];
    const idx = parseInt(text, 10);
    // Allow selecting from options by number
    if (!isNaN(idx) && idx >= 1 && idx <= opts.length) {
      return { value: opts[idx - 1] };
    }
    // Allow manual input if enabled
    if (step.allowManual) {
      return { value: text.trim() };
    }
    return { error: `Please select a number between 1 and ${opts.length}.` };
  }

  // Text input
  return { value: text.trim() };
}

module.exports = { handleIncomingMessage };
