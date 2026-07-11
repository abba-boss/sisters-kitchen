import api from './api';

export const favoriteService = {
  toggle: (productId) => api.post('/favorites/toggle', { productId }),
  getAll: () => api.get('/favorites'),
};
