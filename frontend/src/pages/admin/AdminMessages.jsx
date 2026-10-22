import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, MessageSquare, Clock, CheckCheck, Loader2, Search,
  Store, ChefHat, AlertCircle
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { messageService } from '../../services/messageService';
import { useSocketEvent } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/authStore';
import { formatDate, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function AdminMessages() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.vendor.user.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    setLoading(true);
    try {
      const { data } = await messageService.getConversations();
      setConversations(data.data || []);
      
      // Auto-select first conversation
      if (data.data && data.data.length > 0) {
        setSelectedConversation(data.data[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (vendorUserId) => {
    try {
      const { data } = await messageService.getMessagesWithUser(vendorUserId);
      setMessages(data.data || []);
      
      // Mark messages as read
      await messageService.markAsRead(vendorUserId);
      
      // Update unread count in conversation
      setConversations(prev =>
        prev.map(conv =>
          conv.vendor.user.id === vendorUserId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;
    
    setSending(true);
    try {
      const { data } = await messageService.sendMessage({
        receiverId: selectedConversation.vendor.user.id,
        content: newMessage.trim(),
        vendorId: selectedConversation.vendorId,
      });
      
      setMessages(prev => [...prev, data.data]);
      setNewMessage('');
      
      // Update last message in conversation
      setConversations(prev =>
        prev.map(conv =>
          conv.vendorId === selectedConversation.vendorId
            ? { ...conv, lastMessage: data.data }
            : conv
        )
      );
      
      messageInputRef.current?.focus();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Real-time message received
  useSocketEvent('message:new', ({ message }) => {
    // Only process messages from vendors
    if (message.sender?.role === 'vendor' || message.sender?.role === 'VENDOR') {
      if (selectedConversation && message.senderId === selectedConversation.vendor.user.id) {
        setMessages(prev => [...prev, message]);
        
        // Mark as read immediately since chat is open
        messageService.markAsRead(message.senderId);
        
        // Show toast notification
        toast.success(`New message from ${selectedConversation.vendor?.businessName}`);
      } else {
        // Message from different vendor
        toast('New vendor message', { icon: '💬' });
      }
      
      // Update or add conversation
      setConversations(prev => {
        const existingIndex = prev.findIndex(
          conv => conv.vendor.user.id === message.senderId
        );
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: message,
            unreadCount: selectedConversation && message.senderId === selectedConversation.vendor.user.id 
              ? 0 
              : updated[existingIndex].unreadCount + 1
          };
          return updated;
        }
        
        return prev;
      });
    }
  });

  // Real-time unread count update
  useSocketEvent('message:unread-count', ({ count }) => {
    console.log('Unread messages:', count);
  });

  const isMyMessage = (msg) => msg.senderId === user?.id;

  const formatMessageTime = (date) => {
    const msgDate = new Date(date);
    const now = new Date();
    const diffInMs = now - msgDate;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return msgDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: msgDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  // Filter conversations by search query
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.vendor?.businessName?.toLowerCase().includes(query) ||
      conv.vendor?.user?.firstName?.toLowerCase().includes(query) ||
      conv.vendor?.user?.lastName?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-poppins font-bold text-2xl text-brand-dark">Vendor Messages</h1>
        <p className="text-sm text-brand-muted mt-1">Chat with vendors and provide support</p>
      </div>

      {/* Messages Container */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <div className="card overflow-hidden h-[calc(100vh-220px)] flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-orange-100 bg-brand-bg/30">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-orange-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <MessageSquare size={32} className="text-brand-muted mb-2" />
                  <p className="text-sm text-brand-muted">
                    {searchQuery ? 'No vendors found' : 'No messages yet'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-orange-50">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.vendorId}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 text-left hover:bg-orange-50/50 transition-colors ${
                        selectedConversation?.vendorId === conv.vendorId ? 'bg-orange-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          <Store size={20} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-sm text-brand-dark truncate">
                              {conv.vendor?.businessName}
                            </h4>
                            {conv.unreadCount > 0 && (
                              <span className="ml-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-brand-muted truncate mb-1">
                            {conv.vendor?.user?.firstName} {conv.vendor?.user?.lastName}
                          </p>
                          {conv.lastMessage && (
                            <p className="text-xs text-brand-muted/70 truncate">
                              {conv.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden h-[calc(100vh-220px)] flex flex-col">
            {!selectedConversation ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mb-4">
                  <MessageSquare size={32} className="text-brand-muted" />
                </div>
                <h3 className="font-semibold text-brand-dark mb-2">Select a conversation</h3>
                <p className="text-sm text-brand-muted max-w-md">
                  Choose a vendor from the list to start chatting
                </p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-orange-100 bg-brand-bg/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white flex-shrink-0">
                      <Store size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-brand-dark">
                        {selectedConversation.vendor?.businessName}
                      </h3>
                      <p className="text-xs text-brand-muted">
                        {selectedConversation.vendor?.user?.firstName}{' '}
                        {selectedConversation.vendor?.user?.lastName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-orange-50/20 to-transparent">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mb-3">
                        <MessageSquare size={24} className="text-brand-muted" />
                      </div>
                      <p className="text-sm text-brand-muted">No messages yet</p>
                      <p className="text-xs text-brand-muted/70 mt-1">Start the conversation below</p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {messages.map((msg, index) => {
                        const isMine = isMyMessage(msg);
                        const showDate = index === 0 || 
                          formatDate(messages[index - 1].createdAt) !== formatDate(msg.createdAt);

                        return (
                          <div key={msg.id}>
                            {/* Date Separator */}
                            {showDate && (
                              <div className="flex items-center justify-center my-4">
                                <div className="px-3 py-1 bg-brand-bg rounded-full">
                                  <p className="text-xs text-brand-muted font-medium">
                                    {formatDate(msg.createdAt)}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Message Bubble */}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[70%] ${isMine ? 'order-2' : 'order-1'}`}>
                                <div
                                  className={`rounded-2xl px-4 py-2.5 ${
                                    isMine
                                      ? 'bg-gradient-to-br from-primary to-accent text-white rounded-br-sm'
                                      : 'bg-white border border-orange-100 text-brand-dark rounded-bl-sm'
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {msg.content}
                                  </p>
                                </div>
                                <div className={`flex items-center gap-1.5 mt-1 px-1 ${
                                  isMine ? 'justify-end' : 'justify-start'
                                }`}>
                                  <p className="text-xs text-brand-muted/70">
                                    {formatMessageTime(msg.createdAt)}
                                  </p>
                                  {isMine && msg.isRead && (
                                    <CheckCheck size={14} className="text-blue-500" />
                                  )}
                                  {isMine && !msg.isRead && (
                                    <Clock size={12} className="text-brand-muted/50" />
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-orange-100 bg-white">
                  <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                    <div className="flex-1">
                      <textarea
                        ref={messageInputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        placeholder="Type your message... (Press Enter to send)"
                        className="w-full px-4 py-3 border border-orange-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                        rows="1"
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                        onInput={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="btn-primary flex items-center gap-2 py-3 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </form>
                  <p className="text-xs text-brand-muted/70 mt-2 text-center">
                    Press <kbd className="px-1.5 py-0.5 bg-brand-bg rounded text-[10px] font-mono">Enter</kbd> to send, 
                    <kbd className="px-1.5 py-0.5 bg-brand-bg rounded text-[10px] font-mono ml-1">Shift+Enter</kbd> for new line
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
