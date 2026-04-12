/**
 * WhatsApp Cloud API client.
 *
 * Sends messages via the Meta Graph API.
 * Requires WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env.
 */

/**
 * Send a formatted message payload via WhatsApp Cloud API.
 * POST https://graph.facebook.com/v18.0/{phone_number_id}/messages
 */
async function sendMessage(phoneNumberId, accessToken, payload) {
  const pid = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = accessToken || process.env.WHATSAPP_ACCESS_TOKEN;

  if (!pid || !token) {
    console.error('[WhatsApp] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN');
    return { success: false, error: 'Missing credentials' };
  }

  const url = `https://graph.facebook.com/v18.0/${pid}/messages`;

  console.log('[WhatsApp] Sending message to:', payload.to);
  console.log('[WhatsApp] Payload:', JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[WhatsApp] API error:', res.status, JSON.stringify(data));
      return { success: false, status: res.status, error: data };
    }

    console.log('[WhatsApp] Sent successfully:', JSON.stringify(data));
    return { success: true, data };
  } catch (err) {
    console.error('[WhatsApp] Request failed:', err.message);
    return { success: false, error: err.message };
  }
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
