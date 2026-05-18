// ── API Client for V2 Backend ──
import { authFetch } from './auth.jsx';

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');
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

export async function updateSettings(businessId, telegramBotToken, telegramChatId, businessEmail, whatsappNumber, whatsappPhoneNumberId, whatsappAccessToken, whatsappWabaId) {
  const res = await authFetch(`${API}/business/${businessId}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegramBotToken, telegramChatId, businessEmail, whatsappNumber, whatsappPhoneNumberId, whatsappAccessToken, whatsappWabaId }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    const err = new Error(json.error || 'Failed to update settings');
    err.code = json.code;
    err.channel = json.channel;
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// ── Channel Change Requests (Phase 10.2) ──

export async function createChannelChangeRequest(businessId, channel, requestedValue, reason) {
  const res = await authFetch(`${API}/business/${businessId}/channel-change-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, requestedValue, reason }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to submit change request');
  return json.data;
}

export async function fetchChannelChangeRequests(businessId) {
  const res = await authFetch(`${API}/business/${businessId}/channel-change-requests`);
  const json = await res.json();
  return json.data || [];
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
  // Phase 10: error logs moved to /api/owner/logs/errors/readable (owner only)
  const res = await authFetch(`${API}/owner/logs/errors/readable?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch error logs');
  const json = await res.json();
  return json.data?.items || [];
}

// ── Owner / Platform Admin (Phase 10.1) ──

export async function fetchOwnerTenants() {
  const res = await authFetch(`${API}/owner/tenants`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch tenants');
  return json.data || [];
}

export async function fetchOwnerTenant(id) {
  const res = await authFetch(`${API}/owner/tenants/${id}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch tenant');
  return json.data;
}

export async function suspendTenant(id) {
  const res = await authFetch(`${API}/owner/tenants/${id}/suspend`, { method: 'POST' });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || 'Failed to suspend');
  }
  return res.json();
}

export async function reactivateTenant(id) {
  const res = await authFetch(`${API}/owner/tenants/${id}/reactivate`, { method: 'POST' });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || 'Failed to reactivate');
  }
  return res.json();
}

export async function setTenantPlan(id, planId) {
  const res = await authFetch(`${API}/owner/tenants/${id}/plan`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update plan');
  return json;
}

export async function fetchOwnerPlans() {
  const res = await authFetch(`${API}/owner/plans`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch plans');
  return json.data || [];
}

export async function createOwnerPlan(payload) {
  const res = await authFetch(`${API}/owner/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to create plan');
  return json.data;
}

export async function updateOwnerPlan(id, payload) {
  const res = await authFetch(`${API}/owner/plans/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update plan');
  return json.data;
}

export async function deleteOwnerPlan(id) {
  const res = await authFetch(`${API}/owner/plans/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || 'Failed to delete plan');
  }
  return res.json();
}

export async function fetchOwnerChannelRequests(status = 'pending') {
  const res = await authFetch(`${API}/owner/channel-requests?status=${encodeURIComponent(status)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch channel requests');
  return json.data || [];
}

export async function approveChannelRequest(id, note) {
  const res = await authFetch(`${API}/owner/channel-requests/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: note || '' }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to approve');
  return json;
}

export async function rejectChannelRequest(id, note) {
  const res = await authFetch(`${API}/owner/channel-requests/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: note || '' }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to reject');
  return json;
}

export async function fetchOwnerStats() {
  const res = await authFetch(`${API}/owner/stats`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch stats');
  return json.data;
}

export async function fetchStaffMembers(businessId) {
  const res = await authFetch(`${API}/business/${businessId}/staff-members`);
  return res.ok ? res.json() : [];
}
export async function createStaffMember(businessId, data) {
  const res = await authFetch(`${API}/business/${businessId}/staff-members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed');
  return json;
}
export async function updateStaffMember(businessId, staffId, data) {
  const res = await authFetch(`${API}/business/${businessId}/staff-members/${staffId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed');
  return json;
}
export async function deleteStaffMember(businessId, staffId) {
  const res = await authFetch(`${API}/business/${businessId}/staff-members/${staffId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed');
}
export async function fetchServices(businessId) {
  const res = await authFetch(`${API}/business/${businessId}/services`);
  return res.ok ? res.json() : [];
}
export async function createService(businessId, data) {
  const res = await authFetch(`${API}/business/${businessId}/services`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed');
  return json;
}
export async function updateService(businessId, serviceId, data) {
  const res = await authFetch(`${API}/business/${businessId}/services/${serviceId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed');
  return json;
}
export async function deleteService(businessId, serviceId) {
  const res = await authFetch(`${API}/business/${businessId}/services/${serviceId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed');
}
export async function fetchBusinessHours(businessId) {
  const res = await authFetch(`${API}/business/${businessId}/hours`);
  return res.ok ? res.json() : [];
}
export async function saveBusinessHours(businessId, hours) {
  const res = await authFetch(`${API}/business/${businessId}/hours`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hours }) });
  if (!res.ok) throw new Error('Failed');
}
export async function fetchBookings(businessId, params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await authFetch(`${API}/business/${businessId}/bookings${q ? '?' + q : ''}`);
  return res.ok ? res.json() : [];
}
