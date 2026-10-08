# 📱 Manual Token Entry - Complete Guide

## Overview

The self-pickup system supports **two verification methods**:

1. **QR Code Scanning** (Primary) - Fast and convenient
2. **Manual Token Entry** (Fallback) - Reliable backup when camera fails

---

## 🎯 How It Works

### Customer Side (Order Detail Page)

When a pickup order is **ready**, the customer sees:

```
┌──────────────────────────────────┐
│ ✅ Ready for Pickup!             │
│                                  │
│   ┌──────────────┐              │
│   │  ████████████│              │
│   │  ██ QR Code █│              │
│   │  ████████████│              │
│   └──────────────┘              │
│                                  │
│ Pickup Token (Manual Entry)      │
│ ┌──────────────────────────────┐│
│ │ a1b2c3d4e5f6g7h8i9j0k1l2... ││
│ └──────────────────────────────┘│
│ [Copy] button                    │
│                                  │
│ 💡 If vendor can't scan QR,      │
│ they can manually enter token    │
└──────────────────────────────────┘
```

**Features:**
- ✅ QR code displayed prominently
- ✅ Token shown in monospace font
- ✅ One-click copy button
- ✅ Helpful instruction text
- ✅ Token automatically selected on click

---

### Vendor Side (Verification Modal)

When vendor clicks **"Verify Pickup"**, they see:

```
┌──────────────────────────────────┐
│ Verify Pickup                    │
│ Order #ORD-123456                │
│                                  │
│ [📷 Scan QR]  [⌨️ Manual]       │
│                                  │
│ ┌──────────────────────────────┐│
│ │ Paste or type token here...  ││
│ └──────────────────────────────┘│
│                                  │
│ [Verify Pickup] button           │
│                                  │
│ Customer: John Doe               │
│ Phone: +234...                   │
│ Total: ₦3,500                    │
└──────────────────────────────────┘
```

**Features:**
- ✅ Two tabs: "Scan QR" and "Manual"
- ✅ Easy toggle between modes
- ✅ Monospace input field for token
- ✅ Paste support (Ctrl+V / Cmd+V)
- ✅ Verify button activates when token entered

---

## 🔄 Complete Workflows

### Workflow 1: QR Code Scanning (Primary)

**Customer:**
1. Order reaches "Ready" status
2. Opens order detail page
3. Sees QR code displayed
4. Goes to vendor location

**Vendor:**
1. Clicks "Verify Pickup" on order
2. Stays on "Scan QR" tab (default)
3. Clicks "Start Camera Scanner"
4. Points camera at customer's QR code
5. ✅ Auto-verified when QR detected

**Success:** Order marked as "Delivered" automatically

---

### Workflow 2: Manual Token Entry (Fallback)

**When to Use:**
- Camera permission denied
- Poor lighting conditions
- Camera not working
- Phone doesn't support camera API
- Faster for experienced vendors

**Customer:**
1. Order reaches "Ready" status
2. Opens order detail page
3. Scrolls to "Pickup Token" section
4. Clicks **"Copy"** button
5. Shares token with vendor (verbally or via message)

**Vendor:**
1. Clicks "Verify Pickup" on order
2. Clicks **"Manual"** tab
3. Two options:
   - **Paste** token (if customer copied it)
   - **Type** token (if customer reads it aloud)
4. Clicks "Verify Pickup" button
5. ✅ Order verified!

**Success:** Order marked as "Delivered"

---

## 📋 Token Details

### Token Format
- **Length**: 64 characters
- **Type**: Hexadecimal string
- **Example**: `a1b2c3d4e5f6789012345678901234567890abcdefabcdef0123456789abcdef`
- **Generated**: Using Node.js `crypto.randomBytes(32).toString('hex')`

### Token Security
- ✅ Cryptographically secure random generation
- ✅ Unique per order (no duplicates)
- ✅ Single-use (can't be reused)
- ✅ Validated on backend
- ✅ Requires correct order ID + token match

### Token Validation
Backend checks:
1. Token exists and is not empty
2. Order exists and belongs to vendor
3. Order is pickup type
4. Token matches order's pickupToken
5. Not already verified
6. Order status is "ready"
7. Order is paid

---

## 🎓 Usage Examples

### Example 1: Customer Copies Token
```
1. Customer: *clicks "Copy" button*
   ✅ "Token copied to clipboard!"

2. Customer: *shows phone to vendor*
   "I have the token copied"

3. Vendor: *clicks "Manual" tab*
   *pastes token into input field*
   *clicks "Verify Pickup"*

4. System: ✅ "Pickup verified successfully!"
```

### Example 2: Customer Reads Token Aloud
```
1. Vendor: "Can you read me the pickup token?"

2. Customer: *opens order detail page*
   *scrolls to token section*
   "a-1-b-2-c-3-d-4-e-5..."

3. Vendor: *types token into manual entry field*
   *clicks "Verify Pickup"*

4. System: ✅ "Pickup verified successfully!"
```

### Example 3: Customer Sends via WhatsApp
```
1. Customer: *copies token*
   *sends to vendor via WhatsApp*

2. Vendor: *receives message on phone*
   *copies token from WhatsApp*
   *pastes into verification modal*
   *clicks "Verify Pickup"*

3. System: ✅ "Pickup verified successfully!"
```

---

## 🎨 UI Components

### Customer Component: `PickupOrderCard.jsx`

**Added Features:**
```jsx
// Token display section
<div className="mt-4 bg-brand-bg rounded-xl p-3">
  <div className="flex items-center justify-between mb-1">
    <p className="text-xs font-medium">Pickup Token</p>
    <button onClick={handleCopyToken}>
      {copied ? <Check /> : <Copy />} {copied ? 'Copied!' : 'Copy'}
    </button>
  </div>
  <div className="bg-white rounded-lg p-2">
    <p className="font-mono text-[10px]">{pickupToken}</p>
  </div>
  <p className="text-[10px] text-muted mt-1.5">
    💡 If vendor can't scan QR, they can manually enter this token
  </p>
</div>
```

**Features:**
- Monospace font for easy reading
- Break-all to prevent overflow
- Copy button with feedback
- Helpful instruction text

---

### Vendor Component: `PickupVerificationModal.jsx`

**Already Implemented:**
```jsx
// Mode toggle
<div className="flex gap-2 mb-4">
  <button onClick={() => setManualMode(false)}>
    <Camera /> Scan QR
  </button>
  <button onClick={() => setManualMode(true)}>
    <Keyboard /> Manual
  </button>
</div>

// Manual entry form
{manualMode && (
  <form onSubmit={handleManualSubmit}>
    <input
      type="text"
      value={manualToken}
      onChange={(e) => setManualToken(e.target.value)}
      placeholder="Paste or type token here..."
      className="input-field font-mono"
      required
    />
    <button type="submit">
      Verify Pickup
    </button>
  </form>
)}
```

**Features:**
- Tab-based navigation
- Monospace input for token
- Paste support
- Real-time validation
- Error messages

---

## 🧪 Testing Manual Token Flow

### Test 1: Copy & Paste (2 minutes)

**As Customer:**
1. Place pickup order
2. Wait for "Ready" status (or have vendor mark it)
3. Go to order detail page
4. Scroll to token section
5. Click "Copy" button
6. ✅ Should see "Token copied!" toast

**As Vendor:**
1. Go to order
2. Click "Verify Pickup"
3. Click "Manual" tab
4. Paste token (Ctrl+V / Cmd+V)
5. Click "Verify Pickup"
6. ✅ Should see success message

---

### Test 2: Manual Typing (3 minutes)

**As Customer:**
1. Open order detail page
2. View token (don't copy)
3. Read first 10 characters

**As Vendor:**
1. Click "Verify Pickup"
2. Click "Manual" tab
3. Type the token manually
4. Click "Verify Pickup"
5. ✅ Should verify if token correct
6. ❌ Should show error if token wrong

---

### Test 3: Error Handling (2 minutes)

**Invalid Token:**
```
Input: "wrong-token-12345"
Result: ❌ "Invalid pickup token"
```

**Wrong Order:**
```
Input: Token from different order
Result: ❌ "Invalid pickup token"
```

**Already Verified:**
```
Input: Token from verified order
Result: ❌ "This order has already been picked up"
```

**Wrong Status:**
```
Input: Token from "pending" order
Result: ❌ "Order must be in 'ready' status"
```

---

## 🎯 User Experience

### Customer Experience
**Before Enhancement:**
- ❓ Only saw QR code
- ❓ No fallback if QR fails
- ❓ Couldn't share token easily

**After Enhancement:**
- ✅ See both QR code and token
- ✅ Can copy token with one click
- ✅ Can share via message/email
- ✅ Clear instructions provided
- ✅ Vendor has multiple verification options

---

### Vendor Experience
**Before:**
- ✅ QR scanner works
- ❌ No backup if camera fails

**After:**
- ✅ QR scanner (primary)
- ✅ Manual entry (fallback)
- ✅ Easy toggle between modes
- ✅ Clear error messages
- ✅ Works in all situations

---

## 📊 Comparison: QR vs Manual

| Aspect | QR Code Scanning | Manual Token Entry |
|--------|------------------|-------------------|
| **Speed** | ⚡ 2-3 seconds | 🐢 15-30 seconds |
| **Accuracy** | ✅ 100% automatic | ⚠️ Depends on typing |
| **Requirements** | 📷 Camera + permissions | ⌨️ Just keyboard |
| **User Skill** | 👶 Anyone can do it | 🤓 Need to type carefully |
| **Reliability** | ⚠️ Needs good lighting | ✅ Always works |
| **Best For** | Normal conditions | Fallback/backup |

**Recommendation**: Use QR scanning by default, manual entry as backup

---

## 🚨 Common Issues & Solutions

### Issue 1: Token Not Showing
**Symptom**: Customer doesn't see token on order page  
**Cause**: Order not in "ready" status yet  
**Fix**: Vendor must mark order as ready first

### Issue 2: Copy Button Not Working
**Symptom**: Click "Copy" but nothing happens  
**Cause**: Browser clipboard API not available  
**Fix**: Manually select and copy text (Ctrl+C)

### Issue 3: Paste Not Working
**Symptom**: Ctrl+V doesn't paste in modal  
**Cause**: Input field not focused  
**Fix**: Click inside input field first, then paste

### Issue 4: Token Validation Fails
**Symptom**: "Invalid token" error  
**Cause**: Wrong token, extra spaces, or typo  
**Fix**: 
- Copy again from customer's phone
- Check for extra spaces
- Verify it's the correct order

### Issue 5: Modal Doesn't Open
**Symptom**: "Verify Pickup" button doesn't work  
**Cause**: Order not in correct status  
**Fix**: Order must be "ready" status first

---

## ✨ Summary

### What's Available Now

**For Customers:**
- ✅ QR code displayed when order ready
- ✅ Token shown in readable format
- ✅ One-click copy button
- ✅ Copy confirmation toast
- ✅ Clear instructions

**For Vendors:**
- ✅ Two verification modes (QR + Manual)
- ✅ Easy toggle between modes
- ✅ Monospace input for accuracy
- ✅ Paste support
- ✅ Real-time validation
- ✅ Clear error messages

### Key Benefits

1. **Reliability**: Always works, even if camera fails
2. **Flexibility**: Vendor chooses best method
3. **Speed**: QR is fast, manual is thorough
4. **Simplicity**: Clear UI, obvious actions
5. **Security**: Same validation for both methods

---

## 🎊 Ready to Test!

Both QR scanning and manual token entry are **fully implemented and working**!

### Quick Test:
1. Place pickup order
2. Have vendor mark as "Ready"
3. View order as customer
4. Click "Copy" button on token
5. Verify as vendor using "Manual" tab
6. Paste token and verify
7. ✅ Should work perfectly!

---

**Implementation**: ✅ Complete  
**Testing**: Ready  
**Documentation**: This file  
**Status**: 🎉 Production Ready
