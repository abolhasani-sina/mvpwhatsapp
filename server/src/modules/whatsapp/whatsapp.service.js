/**
 * WhatsApp Cloud API client — MOCK implementation.
 *
 * Phase 7 MVP: logs messages to console instead of calling the real Meta API.
 * Replace with actual https calls to graph.facebook.com in production.
 */

/**
 * Send a formatted message payload via WhatsApp.
 * In production, this posts to: POST https://graph.facebook.com/v21.0/{phone_number_id}/messages
 */
async function sendMessage(phoneNumberId, accessToken, payload) {
  console.log('[WhatsApp MOCK] Sending message:');
  console.log(JSON.stringify(payload, null, 2));
  return { success: true, mock: true };
}

/**
 * Send multiple messages sequentially.
 */
async function sendMessages(phoneNumberId, accessToken, payloads) {
  const results = [];
  for (const payload of payloads) {
    const result = await sendMessage(phoneNumberId, accessToken, payload);
    results.push(result);
  }
  return results;
}

module.exports = { sendMessage, sendMessages };
