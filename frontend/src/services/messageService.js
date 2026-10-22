import api from './api';

export const messageService = {
  // Send a message
  sendMessage: (data) => api.post('/messages', data),

  // Get all conversations
  getConversations: () => api.get('/messages/conversations'),

  // Get messages with a specific user
  getMessagesWithUser: (otherUserId, params = {}) => 
    api.get(`/messages/${otherUserId}`, { params }),

  // Mark messages as read
  markAsRead: (otherUserId) => 
    api.post('/messages/read', { otherUserId }),

  // Get unread message count
  getUnreadCount: () => api.get('/messages/unread/count'),

  // Delete a message
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
};
