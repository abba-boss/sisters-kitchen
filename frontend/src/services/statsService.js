import api from './api';

export const statsService = {
  getPublic: () => api.get('/stats/public'),
};
