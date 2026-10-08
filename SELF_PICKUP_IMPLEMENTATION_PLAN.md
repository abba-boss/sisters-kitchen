# Self-Pickup System Implementation Plan

## Analysis Summary

### Existing Architecture
- **Order Entity**: Currently has `deliveryAddress`, `deliveryPhone`, `deliveryFee` (all nullable/have defaults)
- **Vendor Entity**: Has `address` field but NO latitude/longitude for pickup location
- **Order Flow**: Checkout → Create Order → Payment → Order Detail (tracking)
- **Status Flow**: pending → confirmed → preparing → ready → out_for_delivery → delivered

### What Needs to Be Added

#### 1. Backend Database Changes

**Vendor Entity** (`backend/src/entities/Vendor.ts`):
- Add `pickupLatitude: number | null`
- Add `pickupLongitude: number | null`  
- Add `pickupInstructions: string | null`

**Order Entity** (`backend/src/entities/Order.ts`):
- Add `fulfillmentType: 'delivery' | 'pickup'` (enum, default: 'delivery')
- Add `pickupToken: string | null` (unique secure token for verification)
- Add `pickupVerifiedAt: Date | null`
- Add `pickupVerifiedBy: string | null` (vendor user ID who verified)

#### 2. Backend API Changes

**orderController.ts**:
- `createOrder`: Accept `fulfillmentType` in request body
- If `fulfillmentType='pickup'`:
  - `deliveryAddress` not required
  - `deliveryFee` = 0
  - Generate secure `pickupToken` using crypto.randomBytes(32)
- Validate vendor has pickup location if pickup order

**New endpoint**: `POST /api/orders/:id/verify-pickup`
- Body: `{ token: string }`
- Validate:
  - Token matches order.pickupToken
  - Order belongs to current vendor
  - Order status is 'ready'
  - Payment is completed
  - Not already verified (pickupVerifiedAt is null)
- On success:
  - Update pickupVerifiedAt to current timestamp
  - Update pickupVerifiedBy to vendor user ID
  - Update order status to 'delivered'
  - Return success

**vendorController.ts**:
- `updateVendorProfile`: Accept pickupLatitude, pickupLongitude, pickupInstructions

#### 3. Frontend Customer Changes

**CheckoutPage.jsx**:
- Add fulfillment type selector (radio buttons: Delivery / Self-Pickup)
- If 'pickup' selected:
  - Hide deliveryAddress field
  - Show vendor pickup location preview
  - Show "No delivery fee for pickup" message
- Calculate deliveryFee based on fulfillmentType
- Send fulfillmentType in order creation

**OrderDetailPage.jsx**:
- Check `order.fulfillmentType`
- If 'pickup':
  - Show "Self-Pickup Order" badge
  - Show vendor pickup location with map
  - Generate QR code containing pickupToken
  - Add "Get Directions" button (opens Google Maps)
  - Show pickup instructions from vendor
  - Show verification status (if pickupVerifiedAt exists)

**New Component**: `PickupOrderCard.jsx`
- Displays vendor location
- Interactive map (using react-leaflet or Google Maps)
- QR code for token
- Directions button
- Pickup instructions

#### 4. Frontend Vendor Changes

**VendorProfile.jsx**:
- Add "Pickup Location" section
- Fields:
  - Pickup Address (text)
  - Latitude (number input with map picker)
  - Longitude (number input with map picker)
  - Pickup Instructions (textarea)
- Optional: Map picker to select coordinates visually

**VendorOrders.jsx**:
- Display fulfillmentType badge on each order
- For pickup orders with status='ready':
  - Show "Verify Pickup" button
  - Opens QR scanner modal

**New Component**: `PickupVerificationModal.jsx`
- QR scanner using html5-qrcode library
- Scans customer's QR code
- Extracts token, calls verify-pickup endpoint
- Shows success/error message
- Alternative: Manual token input field

#### 5. Libraries to Install

**Backend**: None (use Node.js built-in `crypto`)

**Frontend**:
```bash
cd frontend
npm install qrcode html5-qrcode
npm install leaflet react-leaflet  # OR use Google Maps React
```

---

## Implementation Steps

### Phase 1: Backend Foundation
1. Update Vendor entity with pickup location fields
2. Update Order entity with fulfillment type and pickup fields
3. Create TypeORM migration
4. Run migration

### Phase 2: Backend API
1. Update orderController createOrder to handle fulfillmentType
2. Add pickup token generation
3. Create verifyPickup endpoint
4. Update vendorController to accept pickup location

### Phase 3: Frontend Customer Experience
1. Install required libraries
2. Update CheckoutPage with fulfillment selector
3. Create PickupOrderCard component
4. Update OrderDetailPage to show pickup info
5. Implement QR code generation

### Phase 4: Frontend Vendor Experience
1. Update VendorProfile with pickup location form
2. Create PickupVerificationModal with QR scanner
3. Update VendorOrders to show fulfillment type and verify button

### Phase 5: Testing
1. Test delivery flow (ensure no breaking changes)
2. Test pickup order creation
3. Test QR code generation and scanning
4. Test pickup verification
5. Test edge cases (wrong token, already verified, etc.)

---

## Non-Breaking Guarantees

✅ All changes are additive (new fields, new features)  
✅ Default fulfillmentType is 'delivery' (existing behavior)  
✅ deliveryAddress/deliveryFee remain unchanged for delivery orders  
✅ Existing order status flow works for both types  
✅ No UI redesign, only new sections added  
✅ Existing delivery orders continue working normally

---

## Success Criteria

- [ ] Customer can choose delivery or pickup at checkout
- [ ] Pickup orders have zero delivery fee
- [ ] Pickup orders show vendor location and QR code
- [ ] Vendor can set pickup location in profile
- [ ] Vendor can scan QR to verify pickup
- [ ] Backend validates token and prevents duplicate verification
- [ ] All existing features continue working
- [ ] No breaking changes to API or database
