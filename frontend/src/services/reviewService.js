import api from './api';

export const reviewService = {
  create: (data) => api.post('/reviews', data),
  getProductReviews: (productId) => api.get(`/reviews/product/${productId}`),
  getVendorReviews: (vendorId) => api.get(`/reviews/vendor/${vendorId}`),
  delete: (id) => api.delete(`/reviews/${id}`),
};
