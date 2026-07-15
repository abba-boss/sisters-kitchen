import api from './api';
export const followerService = {
  toggle:       (vendorId) => api.post(`/followers/${vendorId}/follow`),
  getStatus:    (vendorId) => api.get(`/followers/${vendorId}/count`),
  getFollowers: (vendorId, p) => api.get(`/followers/${vendorId}/list`, { params: p }),
  getFollowing: () => api.get('/followers/my/following'),
};
