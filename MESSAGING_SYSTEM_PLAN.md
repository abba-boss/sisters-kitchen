# Messaging System Implementation Plan 💬

## Overview
Create a complete in-app messaging system for customers and vendors to communicate directly, with real-time updates using Socket.IO.

---

## Features

### **1. Core Messaging** ✉️
- Direct messaging between customers and vendors
- Real-time message delivery using Socket.IO
- Message read receipts
- Typing indicators
- Message timestamps
- Image/photo sharing

### **2. Conversation Management** 💭
- Conversation list view (like WhatsApp)
- Unread message counts
- Last message preview
- Search conversations
- Archive conversations

### **3. Notifications** 🔔
- Push notifications for new messages
- Badge count on Messages icon in sidebar
- Desktop notifications (optional)
- Sound notifications (optional)

### **4. User Experience** 🎨
- Modern chat UI (Instagram/WhatsApp style)
- Message bubbles (sent/received)
- User avatars
- Online/offline status indicators
- Smooth scrolling
- Auto-scroll to latest message

---

## Database Schema

### **Conversation Table**
```typescript
{
  id: UUID
  customerId: UUID (foreign key to User)
  vendorId: UUID (foreign key to Vendor)
  lastMessage: string
  lastMessageAt: Date
  customerUnread: number
  vendorUnread: number
  createdAt: Date
  updatedAt: Date
}
```

### **Message Table**
```typescript
{
  id: UUID
  conversationId: UUID (foreign key)
  senderId: UUID (foreign key to User)
  senderType: enum('customer', 'vendor')
  content: string
  type: enum('text', 'image')
  imageUrl: string (optional)
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}
```

---

## Backend Implementation

### **Files to Create:**

1. **`backend/src/entities/Conversation.ts`**
   - Conversation entity with relations

2. **`backend/src/entities/Message.ts`**
   - Message entity with relations

3. **`backend/src/controllers/messageController.ts`**
   - Get conversations list
   - Get messages in conversation
   - Send message
   - Mark as read
   - Upload image

4. **`backend/src/routes/messageRoutes.ts`**
   - `/api/messages/conversations` (GET)
   - `/api/messages/:conversationId` (GET)
   - `/api/messages` (POST)
   - `/api/messages/:messageId/read` (PATCH)

5. **`backend/src/config/socket.ts` (UPDATE)**
   - Add message socket events
   - `message:send`
   - `message:received`
   - `message:read`
   - `typing:start`
   - `typing:stop`

---

## Frontend Implementation

### **Files to Create:**

1. **`frontend/src/pages/MessagesPage.jsx`**
   - Main messages page with conversation list
   - Split view: Conversations | Chat window

2. **`frontend/src/components/messages/ConversationList.jsx`**
   - List of conversations
   - Search bar
   - Unread counts

3. **`frontend/src/components/messages/ChatWindow.jsx`**
   - Chat header (vendor/customer info)
   - Message list (scrollable)
   - Message input
   - Send button
   - Image upload

4. **`frontend/src/components/messages/MessageBubble.jsx`**
   - Sent message (right, primary color)
   - Received message (left, gray)
   - Timestamp
   - Read receipt

5. **`frontend/src/services/messageService.js`**
   - API calls for messaging
   - Socket.IO event handlers

6. **`frontend/src/store/messageStore.js`**
   - Zustand store for messages
   - Conversations state
   - Active conversation
   - Unread counts

---

## Socket.IO Events

### **Client → Server**
```javascript
// Join conversation room
socket.emit('conversation:join', conversationId);

// Send message
socket.emit('message:send', { conversationId, content, type });

// Typing indicator
socket.emit('typing:start', conversationId);
socket.emit('typing:stop', conversationId);

// Mark as read
socket.emit('message:read', messageId);
```

### **Server → Client**
```javascript
// New message received
socket.on('message:new', (message) => { ... });

// Message read
socket.on('message:read', (messageId) => { ... });

// Someone is typing
socket.on('typing:start', (userId) => { ... });
socket.on('typing:stop', (userId) => { ... });

// User online/offline
socket.on('user:online', (userId) => { ... });
socket.on('user:offline', (userId) => { ... });
```

---

## UI Design (Instagram Style)

### **Desktop Layout:**
```
┌─────────────────────────────────────────────┐
│  Messages                          🔍 Search │
├──────────────┬──────────────────────────────┤
│              │  Vendor Name           ✕ 🎧  │
│ Conversations│─────────────────────────────│
│              │                              │
│ ┌──────────┐│  ┌──────────────────────┐   │
│ │ Vendor 1 ││  │ Their message        │   │
│ │ Last msg ││  │ 10:30 AM             │   │
│ │ 2m ago   ││  └──────────────────────┘   │
│ └──────────┘│                              │
│              │       ┌──────────────────┐  │
│ ┌──────────┐│       │ Your message     │  │
│ │ Vendor 2 ││       │ 10:32 AM     ✓✓ │  │
│ │ Last msg ││       └──────────────────┘  │
│ │ 1h ago   ││                              │
│ └──────────┘│                              │
│              │─────────────────────────────│
│              │  💬 Type a message...   📷 📤│
│              │─────────────────────────────│
└──────────────┴──────────────────────────────┘
```

### **Mobile Layout:**
```
Conversation List View:
┌──────────────────────┐
│ Messages       🔍    │
├──────────────────────┤
│ ┌────┐               │
│ │ V1 │ Vendor Name   │
│ └────┘ Last message  │
│        2m ago    [2] │
├──────────────────────┤
│ ┌────┐               │
│ │ V2 │ Other Vendor  │
│ └────┘ Last message  │
│        1h ago        │
└──────────────────────┘

Chat View:
┌──────────────────────┐
│ ← Vendor Name    ⋮   │
├──────────────────────┤
│                      │
│ ┌────────────────┐  │
│ │ Their message  │  │
│ └────────────────┘  │
│                      │
│      ┌──────────┐   │
│      │ Your msg │   │
│      └──────────┘   │
│                      │
├──────────────────────┤
│ 💬 Message... 📷 📤 │
└──────────────────────┘
```

---

## Implementation Steps

### **Phase 1: Backend Setup**
1. Create Conversation entity
2. Create Message entity
3. Create message controller
4. Create message routes
5. Update Socket.IO config
6. Test with Postman

### **Phase 2: Frontend Core**
1. Create message service
2. Create message store
3. Create Messages page
4. Add to routing
5. Update sidebar link

### **Phase 3: UI Components**
1. Conversation list component
2. Chat window component
3. Message bubble component
4. Input component
5. Styling

### **Phase 4: Real-time Features**
1. Socket.IO integration
2. Message delivery
3. Read receipts
4. Typing indicators
5. Online status

### **Phase 5: Polish**
1. Notifications
2. Badge counts
3. Sound effects
4. Image sharing
5. Search
6. Archive

---

## Benefits

### **For Customers** 👥
- ✅ Ask vendors questions before ordering
- ✅ Clarify order details
- ✅ Request customization
- ✅ Quick communication
- ✅ Order updates via chat

### **For Vendors** 🏪
- ✅ Answer customer inquiries
- ✅ Provide order updates
- ✅ Build customer relationships
- ✅ Handle special requests
- ✅ Improve customer service

### **For Platform** 🚀
- ✅ Keep users in-app (not WhatsApp)
- ✅ Better user engagement
- ✅ Track conversations
- ✅ Moderate if needed
- ✅ Professional communication

---

## Alternative: Quick Implementation

If you want something simpler first:

### **Option A: WhatsApp Integration** (Current)
- Keep "Message" button → Opens WhatsApp
- Fast, no development needed
- But users leave your app

### **Option B: Simple Contact Form**
- Modal with message form
- Sends to vendor email
- No real-time chat
- Quick to implement

### **Option C: Full Messaging System** (Recommended)
- Complete in-app messaging
- Real-time communication
- Professional and modern
- Better user experience

---

## Recommendation

I recommend **implementing the full messaging system** because:

1. ✅ Your app already has Socket.IO set up
2. ✅ Instagram-style messaging is user-friendly
3. ✅ Keeps users in your app
4. ✅ Professional and modern
5. ✅ Can add features later (images, voice notes, etc.)

---

## Status: 📋 PLANNED

Would you like me to implement:
1. **Full messaging system** (recommended, ~2-3 hours work)
2. **Simple contact form** (quick, ~30 minutes)
3. **Keep WhatsApp integration** (current state)

Let me know your preference and I'll start implementation!
