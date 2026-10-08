import api from './api';

export const favoriteService = {
  getAll:  (params) => api.get('/favorites', { params }),
  toggle:  (productId) => api.post('/favorites/toggle', { productId }),
};
