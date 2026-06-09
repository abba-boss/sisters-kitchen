import api from './api';

export const vendorService = {
  getAll: (params) => api.get('/vendors', { params }),
  getById: (id) => api.get(`/vendors/${id}`),
  getMyProfile: () => api.get('/vendors/my-profile'),
  getStats: () => api.get('/vendors/stats'),
  updateProfile: (data) =>
    api.put('/vendors/my-profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  toggleStatus: () => api.patch('/vendors/toggle-status'),
  updateApproval: (id, status) => api.patch(`/vendors/${id}/approval`, { status }),
};
