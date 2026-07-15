import api from './api';
export const postService = {
  getFeed:         (p) => api.get('/posts/feed', { params: p }),
  getVendorPosts:  (vendorId, p) => api.get(`/posts/vendor/${vendorId}`, { params: p }),
  getMyPosts:      (p) => api.get('/posts/my/posts', { params: p }),
  getById:         (id) => api.get(`/posts/${id}`),
  create:          (data) => api.post('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:          (id, data) => api.put(`/posts/${id}`, data),
  delete:          (id) => api.delete(`/posts/${id}`),
  toggleLike:      (id) => api.post(`/posts/${id}/like`),
  getLikeStatus:   (id) => api.get(`/posts/${id}/like-status`),
  toggleSave:      (id) => api.post(`/posts/${id}/save`),
  getSaved:        (p) => api.get('/posts/saved/list', { params: p }),
  getComments:     (id, p) => api.get(`/posts/${id}/comments`, { params: p }),
  addComment:      (id, data) => api.post(`/posts/${id}/comments`, data),
  deleteComment:   (id, cid) => api.delete(`/posts/${id}/comments/${cid}`),
};
