# 🧪 Test Messaging System - Quick Guide

**Time Required**: 5 minutes  
**What to Test**: Vendor ↔ Admin messaging end-to-end

---

## 🚀 Quick Setup

### 1. Start Backend (if not running)
```bash
cd backend
npm run dev
```

### 2. Frontend Already Running
```
✅ Running on http://localhost:5174 (Process ID: 8)
```

---

## 👤 Test Accounts

### Vendor Account
```
Email: mama.ngozi@sisterskitchen.ng
Password: Vendor@2024
```

### Admin Account
```
Email: admin@sisterskitchen.ng
Password: Admin@2024
```

### Customer Account (for blocking test)
```
Email: customer@sisterskitchen.ng
Password: Customer@2024
```

---

## ✅ Test #1: Vendor Sends Message to Admin

### Steps:
1. **Open Browser #1** (Chrome)
   ```
   http://localhost:5174
   ```

2. **Login as Vendor**
   - Email: `mama.ngozi@sisterskitchen.ng`
   - Password: `Vendor@2024`

3. **Go to Messages**
   - Click "Messages" in left sidebar
   - Or navigate to: `http://localhost:5174/vendor/messages`

4. **Send a Message**
   - Type: "Hello admin, I need help with my products"
   - Press **Enter** (or click Send button)

### Expected Results:
- ✅ Message appears in your chat bubble (orange gradient)
- ✅ Timestamp shows "Just now"
- ✅ Message is right-aligned
- ✅ No errors in console

---

## ✅ Test #2: Admin Receives & Replies

### Steps:
1. **Open Browser #2** (Firefox or Incognito)
   ```
   http://localhost:5174
   ```

2. **Login as Admin**
   - Email: `admin@sisterskitchen.ng`
   - Password: `Admin@2024`

3. **Go to Messages**
   - Click "Messages" in sidebar
   - Or navigate to: `http://localhost:5174/admin/messages`

4. **Check Vendor Message**
   - Look for "Mama Ngozi's Kitchen" in conversation list
   - Click on it
   - ✅ Should see vendor's message "Hello admin, I need help..."

5. **Reply to Vendor**
   - Type: "Hi! I'm here to help. What do you need?"
   - Press **Enter**

### Expected Results:
- ✅ Message appears in admin's chat (orange gradient)
- ✅ Vendor's message shows in white bubble on left
- ✅ Admin's message shows in orange bubble on right
- ✅ Timestamp displays correctly

---

## ✅ Test #3: Real-Time Delivery

### Steps:
1. **Keep both browsers open** side-by-side
2. **From Vendor Browser**: Send message "Can you help me add more products?"
3. **Watch Admin Browser**: Should update **instantly**

### Expected Results:
- ✅ Message appears in admin browser **within 1 second**
- ✅ Toast notification shows "New message from..."
- ✅ No page refresh needed
- ✅ Conversation list updates with latest message

---

## ✅ Test #4: Read Receipts

### Steps:
1. **From Admin Browser**: Send message "Sure, I can help!"
2. **From Vendor Browser**: Watch the message arrive
3. **Admin Browser**: Look at your sent message

### Expected Results:
- ✅ Admin sees double check mark (✓✓) next to message
- ✅ Check mark turns blue when vendor reads it
- ✅ Vendor sees message immediately

---

## ✅ Test #5: Customer Blocked (Security)

### Steps:
1. **Logout from Browser #1**
2. **Login as Customer**
   - Email: `customer@sisterskitchen.ng`
   - Password: `Customer@2024`

3. **Look at Sidebar**
   - ✅ No "Messages" link should appear
   - Only Orders, Profile, Notifications, etc.

4. **Try Direct URL** (optional)
   - Type: `http://localhost:5174/messages`
   - ✅ Should redirect or show 404

5. **Check Backend Protection** (if you want)
   - Open DevTools (F12)
   - Try making API call to `/api/messages`
   - ✅ Should get 403 Forbidden error

### Expected Results:
- ✅ Customer has NO access to messaging
- ✅ No links or buttons to send messages
- ✅ Backend blocks any attempts (403 error)

---

## ✅ Test #6: Multiple Messages & Scroll

### Steps:
1. **Login as Vendor** (Browser #1)
2. **Send 10 messages** quickly:
   - "Message 1"
   - "Message 2"
   - ... (up to 10)

3. **Watch behavior**:
   - Auto-scroll to bottom?
   - Messages grouped by date?
   - Smooth animations?

### Expected Results:
- ✅ All messages appear in order
- ✅ Auto-scrolls to latest message
- ✅ Smooth animations (no jank)
- ✅ Date separator if messages span days

---

## ✅ Test #7: Search (Admin Only)

### Steps:
1. **Login as Admin**
2. **Go to Messages page**
3. **Type in search box**: "Mama"

### Expected Results:
- ✅ "Mama Ngozi's Kitchen" appears in results
- ✅ Other vendors filtered out
- ✅ Search is instant (no delay)
- ✅ Clear search shows all vendors again

---

## ✅ Test #8: Keyboard Shortcuts

### Steps:
1. **In message input field**:
   - Type message and press **Enter** → Sends message
   - Type message and press **Shift+Enter** → New line
   - Press **Enter** on empty field → Nothing happens (disabled)

### Expected Results:
- ✅ Enter sends message
- ✅ Shift+Enter creates new line
- ✅ Empty message cannot be sent
- ✅ Send button disabled when empty

---

## ✅ Test #9: Network Interruption

### Steps:
1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Set to "Offline"**
4. **Try sending message**

### Expected Results:
- ✅ Shows loading spinner
- ✅ Displays error message
- ✅ Message not sent
- ✅ Error toast appears

---

## ✅ Test #10: Mobile Responsive

### Steps:
1. **Press F12** (DevTools)
2. **Click Device Toolbar** (phone icon)
3. **Select iPhone 12 Pro**
4. **Navigate to messages page**

### Expected Results:
- ✅ Chat takes full width
- ✅ Buttons are touch-friendly
- ✅ Text readable
- ✅ Send button shows icon only
- ✅ Scrolling smooth

---

## 🎯 Quick Checklist

Copy this checklist and mark as you test:

```
Vendor → Admin:
[ ] Vendor can send message
[ ] Message appears in vendor chat
[ ] Admin receives message
[ ] Admin sees in conversation list

Admin → Vendor:
[ ] Admin can reply
[ ] Vendor receives reply in real-time
[ ] Toast notification appears
[ ] Read receipt shows

Real-time:
[ ] Messages deliver instantly (< 1 second)
[ ] No refresh needed
[ ] Socket.IO connected
[ ] Notifications work

Customer Blocked:
[ ] No Messages link for customers
[ ] Cannot access /messages URL
[ ] Backend returns 403 error

UI/UX:
[ ] Smooth animations
[ ] Auto-scroll works
[ ] Date separators display
[ ] Timestamps correct
[ ] Mobile responsive

Features:
[ ] Enter to send
[ ] Shift+Enter for new line
[ ] Search works (admin)
[ ] Empty state shows
[ ] Loading states work
```

---

## 🐛 Troubleshooting

### Messages not sending?
```bash
# 1. Check backend running
ps aux | grep "npm run dev"

# 2. Check logs
# Look for Socket.IO connection messages
# Should see: "🔌 Socket connected: user@email.com"

# 3. Check browser console
# Open DevTools (F12) → Console tab
# Look for errors
```

### Socket.IO not connecting?
```javascript
// Check connection in browser console
localStorage.getItem('token')  // Should show JWT token

// Check socket status
// Look for green "Online" indicator in chat header
```

### 403 Error?
```
✅ This is CORRECT behavior for customers!
❌ If vendor/admin gets 403, check:
   - JWT token valid?
   - User role correct in database?
   - Backend running?
```

---

## 📊 Success Criteria

After testing, you should see:

✅ **10/10 tests passing**  
✅ **Real-time delivery working**  
✅ **Customer access blocked**  
✅ **No console errors**  
✅ **Smooth UI/UX**  
✅ **Mobile responsive**

---

## 🎉 Demo Script (30 seconds)

Perfect for showing stakeholders:

1. **Open two browsers side-by-side**
2. **Login**: Vendor (left) + Admin (right)
3. **Vendor sends**: "Hello, I need help"
4. **Watch message appear** on admin side instantly
5. **Admin replies**: "How can I help?"
6. **Watch reply appear** on vendor side instantly
7. **Show toast notifications**
8. **Show mobile view** (optional)

**Done!** ✨

---

## 📸 Screenshots to Take

For documentation:
1. Vendor messages page (desktop)
2. Admin messages page with conversation list
3. Real-time message delivery (GIF)
4. Toast notification
5. Mobile view
6. Customer blocked (no messages link)
7. Read receipts
8. Empty state

---

## ⏱️ Time Breakdown

- **Test #1-2**: 2 minutes (basic send/receive)
- **Test #3-4**: 1 minute (real-time + receipts)
- **Test #5**: 1 minute (customer block)
- **Test #6-10**: 5 minutes (all other features)

**Total**: ~10 minutes for complete testing

---

## ✅ Final Verification

Before marking as complete:

1. [ ] All 10 tests passed
2. [ ] No console errors
3. [ ] Real-time working
4. [ ] Customer blocked
5. [ ] Mobile works
6. [ ] Screenshots taken
7. [ ] Demo script practiced
8. [ ] Documentation read

---

**Happy Testing!** 🚀

If everything works, you're ready to:
- Deploy to production
- Show to stakeholders
- Add to feature list
- Train users

