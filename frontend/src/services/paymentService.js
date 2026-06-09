import api from './api';

export const paymentService = {
  initialize: (data) => api.post('/payments/initialize', data),
  verify: (reference) => api.get(`/payments/verify/${reference}`),
  getMyPayments: (params) => api.get('/payments/my-payments', { params }),
  getReceipt: (id) => api.get(`/payments/receipt/${id}`),
};
