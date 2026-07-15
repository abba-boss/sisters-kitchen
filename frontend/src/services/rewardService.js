import api from './api';
export const rewardService = {
  getWallet:  () => api.get('/rewards/wallet'),
  getHistory: (p) => api.get('/rewards/history', { params: p }),
  claimDaily: () => api.post('/rewards/daily'),
  redeem:     (data) => api.post('/rewards/redeem', data),
};
