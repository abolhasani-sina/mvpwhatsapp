import client from '../api/client';

// Auth
export const authApi = {
  register: (business_name, email, password) => client.post('/auth/register', { business_name, email, password }),
  login: (email, password) => client.post('/auth/login', { email, password }),
  refresh: () => client.post('/auth/refresh'),
  logout: () => client.post('/auth/logout'),
};

// Profile
export const profileApi = {
  get: () => client.get('/profile'),
  update: (data) => client.put('/profile', data),
};

// Services (Business Catalog)
export const servicesApi = {
  list: () => client.get('/services'),
  getTree: () => client.get('/services/tree'),
  getLeaves: () => client.get('/services/leaves'),
  get: (id) => client.get(`/services/${id}`),
  create: (data) => client.post('/services', data),
  update: (id, data) => client.put(`/services/${id}`, data),
  delete: (id) => client.delete(`/services/${id}`),
};

// Menu
export const menuApi = {
  getTree: () => client.get('/menu'),
  getNode: (id) => client.get(`/menu/${id}`),
  create: (data) => client.post('/menu', data),
  update: (id, data) => client.put(`/menu/${id}`, data),
  delete: (id) => client.delete(`/menu/${id}`),
  reorder: (id, sort_order) => client.put(`/menu/${id}/reorder`, { sort_order }),
  publish: () => client.post('/menu/publish'),
};

// Flows
export const flowsApi = {
  list: () => client.get('/flows'),
  get: (id) => client.get(`/flows/${id}`),
  create: (data) => client.post('/flows', data),
  update: (id, data) => client.put(`/flows/${id}`, data),
  delete: (id) => client.delete(`/flows/${id}`),
  listSteps: (flowId) => client.get(`/flows/${flowId}/steps`),
  createStep: (flowId, data) => client.post(`/flows/${flowId}/steps`, data),
  updateStep: (flowId, stepId, data) => client.put(`/flows/${flowId}/steps/${stepId}`, data),
  deleteStep: (flowId, stepId) => client.delete(`/flows/${flowId}/steps/${stepId}`),
};

// Requests
export const requestsApi = {
  list: (status) => client.get('/requests', { params: status ? { status } : {} }),
  get: (id) => client.get(`/requests/${id}`),
  create: (data) => client.post('/requests', data),
  updateStatus: (id, status) => client.patch(`/requests/${id}/status`, { status }),
  assign: (id, assignee_id) => client.post(`/requests/${id}/assign`, { assignee_id }),
};

// Assignees
export const assigneesApi = {
  list: () => client.get('/assignees'),
  create: (data) => client.post('/assignees', data),
  update: (id, data) => client.put(`/assignees/${id}`, data),
  delete: (id) => client.delete(`/assignees/${id}`),
};

// Assignment Rules
export const assignmentRulesApi = {
  list: () => client.get('/assignment-rules'),
  get: (id) => client.get(`/assignment-rules/${id}`),
  create: (data) => client.post('/assignment-rules', data),
  update: (id, data) => client.put(`/assignment-rules/${id}`, data),
  delete: (id) => client.delete(`/assignment-rules/${id}`),
  remapTriggers: (maps) => client.patch('/assignment-rules/remap-triggers', { maps }),
};

// Notifications
export const notificationsApi = {
  list: () => client.get('/notifications'),
  listUnread: () => client.get('/notifications/unread'),
  markAsRead: (id) => client.patch(`/notifications/${id}/read`),
};

// Sessions
export const sessionsApi = {
  list: () => client.get('/sessions'),
  takeover: (id) => client.put(`/sessions/${id}/takeover`),
  release: (id) => client.put(`/sessions/${id}/release`),
  publish: () => client.post('/sessions/publish'),
  reset: (phone) => client.delete('/sessions/reset', { data: phone ? { phone } : {} }),
};

// WhatsApp Simulate
export const whatsappApi = {
  simulate: (phone_number, message) =>
    client.post('/webhook/whatsapp/simulate', { phone_number, message }),
};

// Templates
export const templatesApi = {
  list: () => client.get('/templates'),
  apply: (id) => client.post(`/templates/${id}/apply`),
  skip: () => client.post('/templates/skip'),
  status: () => client.get('/templates/status'),
};
