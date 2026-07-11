import api from './api';

export const postService = {
  // Feed & listing
  getFeed:        (params) => api.get('/posts/feed', { params }),
  getVendorPosts: (vendorId, params) => api.get(`/posts/vendor/${vendorId}`, { params }),
  getMyPosts:     (params) => api.get('/posts/my/posts', { params }),
  getById:        (id) => api.get(`/posts/${id}`),

  // CRUD
  create: (data) => api.post('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),

  // Engagement
  toggleLike:   (id) => api.post(`/posts/${id}/like`),
  getLikeStatus:(id) => api.get(`/posts/${id}/like-status`),
  toggleSave:   (id) => api.post(`/posts/${id}/save`),
  getSaved:     (params) => api.get('/posts/saved/list', { params }),

  // Comments
  getComments:   (id, params) => api.get(`/posts/${id}/comments`, { params }),
  addComment:    (id, data)   => api.post(`/posts/${id}/comments`, data),
  deleteComment: (id, commentId) => api.delete(`/posts/${id}/comments/${commentId}`),
};
