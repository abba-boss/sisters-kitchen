import api from './api';

export const followerService = {
  toggle:      (vendorId) => api.post(`/followers/${vendorId}/follow`),
  getStatus:   (vendorId) => api.get(`/followers/${vendorId}/count`),
  getFollowers:(vendorId, params) => api.get(`/followers/${vendorId}/list`, { params }),
  getFollowing:() => api.get('/followers/my/following'),
};
