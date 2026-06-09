import api from './api';

export const orderService = {
  create: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getVendorOrders: (params) => api.get('/orders/vendor-orders', { params }),
  getAllOrders: (params) => api.get('/orders/all', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
};
