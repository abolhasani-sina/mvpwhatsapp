// ── API Client for V2 Backend ──
import { authFetch } from './auth.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const API_BASE = API;

export async function fetchBusiness() {
  const res = await authFetch(`${API}/business`);
  const json = await res.json();
  return json.data; // null if no business exists
}

export async function createBusiness(templateKey, businessName, templateData) {
  const res = await authFetch(`${API}/business`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateKey, businessName, templateData }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to create business');
  return json.data;
}

export async function deleteBusiness(businessId) {
  await authFetch(`${API}/business/${businessId}`, { method: 'DELETE' });
}

export async function applyTemplate(businessId, templateKey, templateData) {
  const res = await authFetch(`${API}/business/${businessId}/apply-template`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateKey, templateData }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error || 'Failed to apply template');
  }
  return res.json();
}

export async function updateBusiness(businessId, data) {
  const res = await authFetch(`${API}/business/${businessId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  return json.data;
}

export async function loadBuilder(businessId) {
  const res = await authFetch(`${API}/business/${businessId}/builder`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to load builder');
  return json.data; // { business, welcomeMessage, buttons, flow }
}

export async function saveBuilder(businessId, welcomeMessage, buttons) {
  const res = await authFetch(`${API}/business/${businessId}/builder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ welcomeMessage, buttons }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to save');
  return json;
}

export async function submitForm(businessId, data, flowId, deliveryMethod, deliveryStaffId) {
  const res = await authFetch(`${API}/business/${businessId}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, flowId, deliveryMethod, deliveryStaffId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to save submission');
  return json;
}

// ── Submissions management ──

export async function fetchSubmissions(businessId) {
  const res = await authFetch(`${API}/business/${businessId}/submissions`);
  const json = await res.json();
  return json.data;
}

export async function fetchAnalytics(businessId) {
  const res = await authFetch(`${API}/business/${businessId}/analytics`);
  const json = await res.json();
  return json.data;
}

export async function updateSubmissionStatus(submissionId, status) {
  const res = await authFetch(`${API}/submissions/${submissionId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

export async function assignSubmission(submissionId, staffId) {
  const res = await authFetch(`${API}/submissions/${submissionId}/assign`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffId }),
  });
  if (!res.ok) throw new Error('Failed to assign');
  return res.json();
}

// ── Staff management ──

export async function fetchStaff(businessId) {
  const res = await authFetch(`${API}/business/${businessId}/staff`);
  const json = await res.json();
  return json.data;
}

export async function createStaff(businessId, name, role, email, telegram_chat_id) {
  const res = await authFetch(`${API}/business/${businessId}/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, role, email, telegram_chat_id }),
  });
  if (!res.ok) throw new Error('Failed to create staff');
  return res.json();
}

export async function updateStaff(staffId, name, role, email, telegram_chat_id) {
  const res = await authFetch(`${API}/staff/${staffId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, role, email, telegram_chat_id }),
  });
  if (!res.ok) throw new Error('Failed to update staff');
  return res.json();
}

export async function deleteStaff(staffId) {
  const res = await authFetch(`${API}/staff/${staffId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete staff');
  return res.json();
}

// ── Settings ──

export async function fetchSettings(businessId) {
  const res = await authFetch(`${API}/business/${businessId}/settings`);
  const json = await res.json();
  return json.data;
}

export async function updateSettings(businessId, telegramBotToken, telegramChatId, businessEmail, whatsappNumber) {
  const res = await authFetch(`${API}/business/${businessId}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegramBotToken, telegramChatId, businessEmail, whatsappNumber }),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

// ── Flow Destinations ──

export async function fetchFlowDestinations(flowId) {
  const res = await authFetch(`${API}/flows/${flowId}/destinations`);
  const json = await res.json();
  return json.data;
}

export async function addFlowDestination(flowId, channel, staffId) {
  const res = await authFetch(`${API}/flows/${flowId}/destinations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, staffId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to add destination');
  return json;
}

export async function updateFlowDestinations(flowId, destinations) {
  const res = await authFetch(`${API}/flows/${flowId}/destinations`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destinations }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update destinations');
  return json;
}

export async function deleteFlowDestination(flowId, destId) {
  const res = await authFetch(`${API}/flows/${flowId}/destinations/${destId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete destination');
  return res.json();
}

// ── Button Media ──

export async function uploadButtonMedia(businessId, buttonId, file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      const mediaType = file.type.startsWith('image/') ? 'image'
        : file.type.startsWith('video/') ? 'video'
        : file.type.startsWith('audio/') ? 'audio'
        : 'document';
      try {
        const res = await authFetch(`${API}/business/${businessId}/buttons/${buttonId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, mediaType, data: base64 }),
        });
        if (!res.ok) {
          const err = await res.json();
          return reject(new Error(err.error || 'Upload failed'));
        }
        resolve(await res.json());
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function deleteButtonMedia(businessId, mediaId) {
  const res = await authFetch(`${API}/business/${businessId}/media/${mediaId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete media');
  return res.json();
}

export async function fetchMediaData(businessId, mediaId) {
  const res = await authFetch(`${API}/business/${businessId}/media/${mediaId}`);
  const json = await res.json();
  return json.data;
}

// ── System Logs ──

export async function fetchErrorLogs(limit = 30) {
  const res = await authFetch(`${API}/logs/errors/readable?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch error logs');
  const json = await res.json();
  return json.data?.items || [];
}
