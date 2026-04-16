// ── Template → Database seeder ──
// Takes a template's { welcomeMessage, buttons } and inserts it as a full
// business owned by the given user. Returns the new business_id.

import db from './db.js';

export function seedBusiness(userId, businessName, templateKey, templateData) {
  const { welcomeMessage, buttons } = templateData;

  // We do everything in a transaction for atomicity
  const txn = db.transaction(() => {
    // 1. Create business
    const biz = db.prepare(
      'INSERT INTO businesses (user_id, name, template_key) VALUES (?, ?, ?)'
    ).run(userId, businessName, templateKey);
    const businessId = biz.lastInsertRowid;

    // 2. Create bot_config
    db.prepare(
      'INSERT INTO bot_configs (business_id, welcome_message) VALUES (?, ?)'
    ).run(businessId, welcomeMessage);

    // 3. Create a single shared booking flow for this business
    const flowRow = db.prepare(
      'INSERT INTO flows (business_id, name) VALUES (?, ?)'
    ).run(businessId, 'Booking Flow');
    const flowId = flowRow.lastInsertRowid;

    // Map from old template IDs → new DB button IDs
    const oldToNewButtonId = new Map();

    // We need to find the baseFlow — it's the flowSteps on the first start_flow
    // action button we encounter, or the booking CTA's flow.
    // We'll collect it from the first actionButton with behavior=start_flow.
    let baseFlowSteps = null;

    // 4. Insert buttons tree recursively
    const insertStmt = db.prepare(
      'INSERT INTO buttons (business_id, parent_id, label, behavior, sort_order) VALUES (?, ?, ?, ?, ?)'
    );
    const infoStmt = db.prepare(
      `INSERT INTO info_pages (button_id, title, description, amount, currency, duration, style, show_price, show_duration)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const actionBtnStmt = db.prepare(
      'INSERT INTO action_buttons (info_page_id, label, behavior, prefill_service, sort_order) VALUES (?, ?, ?, ?, ?)'
    );
    const extraStepStmt = db.prepare(
      `INSERT INTO extra_steps (button_id, type, question, key, summary_label, options, step_order, manual_placeholder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const actionFlowStepStmt = db.prepare(
      `INSERT INTO action_button_flow_steps (action_button_id, type, question, key, summary_label, options, step_order, menu_root_button_id, manual_placeholder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    function insertButtons(btns, parentDbId, depth) {
      for (let i = 0; i < btns.length; i++) {
        const btn = btns[i];
        const result = insertStmt.run(
          businessId,
          parentDbId,
          btn.label,
          btn.behavior || null,
          i
        );
        const newBtnId = Number(result.lastInsertRowid);
        oldToNewButtonId.set(btn.id, newBtnId);

        // Insert info page if present
        if (btn.behavior === 'info' && btn.infoPage) {
          const ip = btn.infoPage;
          const ipResult = infoStmt.run(
            newBtnId,
            ip.title || '',
            ip.description || '',
            ip.amount || '',
            ip.currency || 'USD',
            ip.duration || '',
            ip.style || 'clean',
            ip.showPrice ? 1 : 0,
            ip.showDuration ? 1 : 0
          );
          const infoPageId = Number(ipResult.lastInsertRowid);

          // Insert extra steps for this info page's button
          if (ip.extraSteps && ip.extraSteps.length > 0) {
            for (let s = 0; s < ip.extraSteps.length; s++) {
              const step = ip.extraSteps[s];
              extraStepStmt.run(
                newBtnId,
                step.type,
                step.question || '',
                step.key || '',
                step.label || '',
                JSON.stringify(step.options || []),
                s,
                step.manualPlaceholder || ''
              );
            }
          }

          // Insert action buttons
          if (ip.actionButtons && ip.actionButtons.length > 0) {
            for (let a = 0; a < ip.actionButtons.length; a++) {
              const ab = ip.actionButtons[a];
              const abResult = actionBtnStmt.run(
                infoPageId,
                ab.label || '',
                ab.behavior || 'go_back',
                ab.prefillService || '',
                a
              );
              const actionBtnId = Number(abResult.lastInsertRowid);

              // Capture the baseFlow from the first start_flow action button
              if (ab.behavior === 'start_flow' && ab.flowSteps && !baseFlowSteps) {
                baseFlowSteps = ab.flowSteps;
              }
            }
          }
        }

        // Recurse into children
        if (btn.children && btn.children.length > 0) {
          insertButtons(btn.children, newBtnId, depth + 1);
        }
      }
    }

    insertButtons(buttons, null, 0);

    // 5. Now insert the base flow steps into the flow, remapping menuRoot IDs
    if (baseFlowSteps) {
      const flowStepStmt = db.prepare(
        `INSERT INTO flow_steps (flow_id, type, question, key, summary_label, options, step_order, menu_root_button_id, manual_placeholder)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (let s = 0; s < baseFlowSteps.length; s++) {
        const step = baseFlowSteps[s];
        const remappedMenuRoot = step.menuRoot
          ? (oldToNewButtonId.get(step.menuRoot) || null)
          : null;
        flowStepStmt.run(
          flowId,
          step.type,
          step.question || '',
          step.key || '',
          step.label || '',
          JSON.stringify(step.options || []),
          s,
          remappedMenuRoot,
          step.manualPlaceholder || ''
        );
      }
    }

    // 6. Update action_button_flow_steps — link each start_flow action button
    //    to the flow steps (they all share the same base flow for now, stored 
    //    as a reference to flow_id; but for full compatibility we store the 
    //    flow_id on the action_buttons row instead).
    //    Actually, simpler: we store flow_id reference on action_buttons.
    //    Let's add that.

    // We'll re-walk the tree to link action buttons to the flow
    // Rather than storing duplicate flow steps per action button, we store 
    // a flow_id reference. But the schema doesn't have that column yet.
    // Let's add it at migration time. For now, the flow_id is the same 
    // for the whole business.

    // Create default settings row so settings page works immediately
    db.prepare(
      'INSERT INTO settings (business_id, telegram_bot_token, telegram_chat_id, business_email, whatsapp_number) VALUES (?, ?, ?, ?, ?)'
    ).run(businessId, '', '', '', '');

    return Number(businessId);
  });

  return txn();
}
