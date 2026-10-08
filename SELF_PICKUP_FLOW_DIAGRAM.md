# Self-Pickup System - Flow Diagrams

## 📊 Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SELF-PICKUP SYSTEM                               │
│                    Sisters Kitchen Marketplace                           │
└─────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════
                            VENDOR SETUP PHASE
═══════════════════════════════════════════════════════════════════════════

    ┌─────────┐
    │ Vendor  │
    └────┬────┘
         │
         ├─1─→ Go to Profile
         │
         ├─2─→ Find "Self-Pickup Location" section
         │
         ├─3─→ Get coordinates from Google Maps
         │      • Open Google Maps
         │      • Right-click location
         │      • Copy coordinates (6.5244, 3.3792)
         │
         ├─4─→ Enter in form:
         │      • Latitude: 6.5244
         │      • Longitude: 3.3792
         │      • Instructions: "Enter main gate..."
         │
         ├─5─→ Save Profile
         │
         ├─6─→ ✅ Pickup Enabled!
         │      Database stores:
         │      - pickupLatitude
         │      - pickupLongitude
         │      - pickupInstructions
         │
         └─────→ [Vendor can now receive pickup orders]


═══════════════════════════════════════════════════════════════════════════
                           CUSTOMER ORDER PHASE
═══════════════════════════════════════════════════════════════════════════

    ┌──────────┐
    │ Customer │
    └────┬─────┘
         │
         ├─1─→ Browse & Add to Cart (normal flow)
         │
         ├─2─→ Go to Checkout
         │
         ├─3─→ Choose Fulfillment Type:
         │      ┌─────────────┐  OR  ┌─────────────┐
         │      │  Delivery   │      │ Self-Pickup │
         │      │ (₦500 fee)  │      │  (₦0 fee)   │
         │      └─────────────┘      └─────────────┘
         │              │                    │
         │              ↓                    ↓
         │      Shows address         Hides address
         │      field (required)      Shows phone only
         │
         ├─4─→ Complete Payment (Paystack/COD)
         │
         ├─5─→ Order Created in Database:
         │      {
         │        fulfillmentType: 'pickup',
         │        deliveryFee: 0,
         │        pickupToken: '64-char-hex-string',
         │        status: 'pending',
         │        pickupVerifiedAt: null
         │      }
         │
         ├─6─→ View Order Details:
         │      • "Self-Pickup" badge shown
         │      • "Order Being Prepared" status
         │      • No QR code yet (not ready)
         │      • Map hidden
         │
         └─────→ [Wait for vendor to mark ready]


═══════════════════════════════════════════════════════════════════════════
                          VENDOR PREPARATION PHASE
═══════════════════════════════════════════════════════════════════════════

    ┌─────────┐
    │ Vendor  │
    └────┬────┘
         │
         ├─1─→ Receives Order Notification 🛎️
         │      • Real-time via Socket.io
         │      • Shows "Pickup" badge
         │      • No delivery address shown
         │
         ├─2─→ Accepts Order → Status: 'confirmed'
         │
         ├─3─→ Starts Preparing → Status: 'preparing'
         │
         ├─4─→ Marks Ready → Status: 'ready'
         │      ┌────────────────────────────────┐
         │      │ "Verify Pickup" button appears │
         │      └────────────────────────────────┘
         │
         ├─5─→ Customer Notified (real-time)
         │      Subject: "Order Ready for Pickup! 🎉"
         │      Message: "Your order is ready"
         │
         └─────→ [Wait for customer to arrive]


═══════════════════════════════════════════════════════════════════════════
                      CUSTOMER PICKUP PREPARATION PHASE
═══════════════════════════════════════════════════════════════════════════

    ┌──────────┐
    │ Customer │ (Receives "Ready" notification)
    └────┬─────┘
         │
         ├─1─→ Opens Order Details
         │
         ├─2─→ Sees Updated UI:
         │      ┌────────────────────────────────────────┐
         │      │ ✨ Ready for Pickup!                   │
         │      │                                        │
         │      │ ┌──────────┐                          │
         │      │ │  QR Code │ ← Generated from token  │
         │      │ │  ████████│                          │
         │      │ │  ████████│                          │
         │      │ └──────────┘                          │
         │      │                                        │
         │      │ 📍 Vendor Location:                   │
         │      │ [Interactive Map]                     │
         │      │                                        │
         │      │ [Get Directions Button]               │
         │      │                                        │
         │      │ Pickup Instructions:                  │
         │      │ "Enter main gate, counter #5"        │
         │      └────────────────────────────────────────┘
         │
         ├─3─→ Clicks "Get Directions"
         │      • Opens Google Maps app/website
         │      • Navigation to vendor location
         │
         ├─4─→ Travels to Vendor Location 🚗
         │
         └─5─→ Arrives at Vendor
               • Has QR code ready on phone
               • Goes to pickup counter


═══════════════════════════════════════════════════════════════════════════
                          VERIFICATION PHASE (QR SCAN)
═══════════════════════════════════════════════════════════════════════════

    ┌─────────┐                              ┌──────────┐
    │ Vendor  │                              │ Customer │
    └────┬────┘                              └────┬─────┘
         │                                        │
         │                                        │
         ├─1─→ Clicks "Verify Pickup" button     │
         │                                        │
         ├─2─→ Modal Opens:                      │
         │      ┌─────────────────────────┐      │
         │      │   Verify Pickup         │      │
         │      │  Order #ABC123          │      │
         │      │                         │      │
         │      │  [Scan QR] [Manual]     │      │
         │      │         ↑               │      │
         │      │    Selected by default  │      │
         │      └─────────────────────────┘      │
         │                                        │
         ├─3─→ Clicks "Start Camera Scanner"     │
         │      • Browser asks for camera        │
         │      • Vendor allows                  │
         │      • Live camera feed shows          │
         │                                        │
         ├─4─→ Points camera at customer's phone ←┤
         │      showing QR code                   │
         │                                        │
         ├─5─→ QR Code Auto-Detected! ✅          │
         │      • Token extracted                │
         │      • API call starts                │
         │                                        │
         ├─6─→ Backend Validates:                │
         │      ┌─────────────────────────────┐  │
         │      │ ✓ Token matches order       │  │
         │      │ ✓ Vendor owns order         │  │
         │      │ ✓ Status is 'ready'         │  │
         │      │ ✓ Payment completed         │  │
         │      │ ✓ Not already verified      │  │
         │      └─────────────────────────────┘  │
         │                                        │
         ├─7─→ Database Updated:                 │
         │      {                                │
         │        status: 'delivered',           │
         │        pickupVerifiedAt: NOW(),       │
         │        pickupVerifiedBy: vendorId     │
         │      }                                │
         │                                        │
         ├─8─→ Success Message: ✅                │
         │      "Pickup verified successfully!"  │
         │                                        │
         ├─9─→ Vendor Earnings Updated:          │
         │      totalOrders += 1                 │
         │      totalEarnings += orderTotal      │
         │                                        │
         ├─10→ Real-time Notification Sent ────→─┤
         │      Subject: "Order Picked Up! 🎉"   │
         │      Message: "Enjoy your meal!"      │
         │                                        │
         └────→ Modal Closes                     │
                                                  │
                                                  ├→ Order Status: "Picked Up"
                                                  │  Shows timestamp
                                                  │
                                                  └→ ✅ COMPLETE


═══════════════════════════════════════════════════════════════════════════
                      ALTERNATIVE: MANUAL TOKEN ENTRY
═══════════════════════════════════════════════════════════════════════════

         ┌─────────┐                         ┌──────────┐
         │ Vendor  │                         │ Customer │
         └────┬────┘                         └────┬─────┘
              │                                   │
              ├─1→ Camera not available?          │
              │    (denied/not working)           │
              │                                   │
              ├─2→ Clicks "Manual" tab            │
              │                                   │
              ├─3→ Shows token input field        │
              │                                   │
              ├─4→ Asks customer to show token ←──┤
              │    (customer shows phone screen)  │
              │                                   │
              ├─5→ Types/pastes 64-char token     │
              │    (can use browser inspect)      │
              │                                   │
              ├─6→ Clicks "Verify Pickup"         │
              │                                   │
              └─7→ [Same validation & update      │
                   process as QR scan]            │


═══════════════════════════════════════════════════════════════════════════
                              ERROR SCENARIOS
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 1: Vendor Has No Pickup Location                               │
└─────────────────────────────────────────────────────────────────────────┘

Customer selects "Pickup" → Clicks "Place Order"
        ↓
Backend checks vendor.pickupLatitude && vendor.pickupLongitude
        ↓
NULL found → Error Response:
        ↓
❌ "This vendor does not offer pickup service yet. 
    Please choose delivery or contact the vendor."


┌─────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 2: Multiple Vendors + Pickup                                   │
└─────────────────────────────────────────────────────────────────────────┘

Customer has 2 vendors in cart → Selects "Pickup" → Validation:
        ↓
Frontend checks groupsToCheckout.length > 1
        ↓
❌ "Pickup orders can only be placed with one vendor at a time"


┌─────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 3: Invalid Token                                               │
└─────────────────────────────────────────────────────────────────────────┘

Vendor scans wrong QR code → Backend validates:
        ↓
Token doesn't match order.pickupToken
        ↓
❌ "Invalid pickup token"


┌─────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 4: Already Verified                                            │
└─────────────────────────────────────────────────────────────────────────┘

Vendor tries to verify again → Backend checks:
        ↓
order.pickupVerifiedAt !== NULL
        ↓
❌ "This order has already been picked up"
   Shows: verifiedAt timestamp


┌─────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 5: Wrong Status                                                │
└─────────────────────────────────────────────────────────────────────────┘

Order is still 'preparing' → Vendor tries to verify:
        ↓
Backend checks: order.status === 'ready'
        ↓
Status is 'preparing' → Error:
        ↓
❌ "Order must be in 'ready' status. Current status: preparing"


═══════════════════════════════════════════════════════════════════════════
                           DATABASE RELATIONSHIPS
═══════════════════════════════════════════════════════════════════════════

┌────────────────────────┐
│       Vendor           │
│────────────────────────│
│ id (PK)                │
│ businessName           │
│ address                │
│ pickupLatitude    ←────┼─── NEW: For pickup orders
│ pickupLongitude   ←────┼─── NEW: For map display
│ pickupInstructions←────┼─── NEW: Customer guidance
└────────────────────────┘
          │ 1
          │
          │ has many
          │
          ↓ *
┌────────────────────────┐
│        Order           │
│────────────────────────│
│ id (PK)                │
│ orderNumber            │
│ status                 │
│ fulfillmentType   ←────┼─── NEW: 'delivery' | 'pickup'
│ deliveryAddress        │ (nullable now for pickup)
│ deliveryFee            │ (0 for pickup)
│ pickupToken       ←────┼─── NEW: Secure 64-char hex
│ pickupVerifiedAt  ←────┼─── NEW: Verification timestamp
│ pickupVerifiedBy  ←────┼─── NEW: Vendor user ID
│ vendorId (FK)          │
│ userId (FK)            │
└────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                            API REQUEST/RESPONSE
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│ Create Pickup Order                                                      │
└─────────────────────────────────────────────────────────────────────────┘

POST /api/orders
Headers: { Authorization: "Bearer <customer-token>" }
Body:
{
  "vendorId": "vendor-uuid",
  "items": [
    { "productId": "product-uuid", "quantity": 2 }
  ],
  "fulfillmentType": "pickup",      ← NEW
  "deliveryAddress": null,           ← Not required for pickup
  "deliveryPhone": "+234...",
  "notes": "Extra spicy please"
}

Response:
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "id": "order-uuid",
    "orderNumber": "ORD-123456",
    "fulfillmentType": "pickup",     ← NEW
    "deliveryFee": 0,                ← Zero for pickup
    "pickupToken": "a1b2c3...",      ← NEW: 64-char token
    "status": "pending",
    ...
  }
}


┌─────────────────────────────────────────────────────────────────────────┐
│ Verify Pickup                                                            │
└─────────────────────────────────────────────────────────────────────────┘

POST /api/orders/:orderId/verify-pickup
Headers: { Authorization: "Bearer <vendor-token>" }
Body:
{
  "token": "a1b2c3d4e5f6..." // 64-char token from QR
}

Response (Success):
{
  "success": true,
  "message": "Pickup verified successfully! Order marked as delivered.",
  "data": {
    "id": "order-uuid",
    "status": "delivered",           ← Updated
    "pickupVerifiedAt": "2026-10-07T12:34:56Z",  ← NEW
    "pickupVerifiedBy": "vendor-user-id",         ← NEW
    ...
  }
}

Response (Error):
{
  "success": false,
  "message": "Invalid pickup token"
}


═══════════════════════════════════════════════════════════════════════════
                         STATE MACHINE DIAGRAM
═══════════════════════════════════════════════════════════════════════════

Order Status Flow (Pickup Orders):

    pending
       ↓
    confirmed  (Vendor accepts)
       ↓
    preparing  (Vendor cooking)
       ↓
     ready     (Vendor done) ← "Verify Pickup" button appears
       ↓
               ← Customer arrives, shows QR code
       ↓
               ← Vendor scans QR code
       ↓
               ← Backend validates & updates
       ↓
   delivered   (Pickup verified) ← pickupVerifiedAt set
       ↓
    ✅ DONE


═══════════════════════════════════════════════════════════════════════════
                       COMPONENT HIERARCHY
═══════════════════════════════════════════════════════════════════════════

Customer Side:
─────────────
CheckoutPage
  ├─ MainLayout
  ├─ Fulfillment Selector (radio buttons)
  ├─ Delivery Form (conditional)
  ├─ Pickup Contact Form (conditional)
  └─ Order Summary (dynamic fee)

OrderDetailPage
  ├─ MainLayout
  ├─ Order Header
  ├─ PickupOrderCard (if pickup)    ← NEW COMPONENT
  │   ├─ Status Display
  │   ├─ Vendor Location
  │   ├─ Map (Leaflet)
  │   ├─ Get Directions Button
  │   ├─ Pickup Instructions
  │   └─ QR Code (qrcode)
  ├─ Delivery Info (if delivery)
  └─ Order Items

Vendor Side:
────────────
VendorProfile
  ├─ DashboardLayout
  ├─ Business Info Form
  ├─ Pickup Location Section       ← NEW SECTION
  │   ├─ Latitude Input
  │   ├─ Longitude Input
  │   ├─ Instructions Textarea
  │   └─ Help Text
  └─ Bank Details Form

VendorOrders
  ├─ DashboardLayout
  ├─ Order List
  │   ├─ Fulfillment Badge (each)  ← NEW
  │   ├─ Verify Button (if ready)  ← NEW
  │   └─ Status Actions
  └─ PickupVerificationModal       ← NEW COMPONENT
      ├─ Mode Toggle (QR/Manual)
      ├─ Camera Scanner (html5-qrcode)
      ├─ Manual Token Input
      └─ Customer Info Display


═══════════════════════════════════════════════════════════════════════════

Legend:
  ─→  Direct flow
  ←─  Response/callback
  ↓   Sequential step
  ✅  Success state
  ❌  Error state
  ←─  NEW: Added in this implementation

═══════════════════════════════════════════════════════════════════════════
```
