import api from './api';

export const storyService = {
  getFeed:          ()         => api.get('/stories/feed'),
  getVendorStories: (vendorId) => api.get(`/stories/vendor/${vendorId}`),
  getMyStories:     ()         => api.get('/stories/my'),
  create:  (data)              => api.post('/stories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  view:    (id)                => api.post(`/stories/${id}/view`),
  delete:  (id)                => api.delete(`/stories/${id}`),
};
