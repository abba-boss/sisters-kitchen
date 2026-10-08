# Self-Pickup System - Quick Start Guide

## ⚡ Quick Setup (5 Minutes)

### Step 1: Database Migration
The new fields need to be added to your database. Since you're using TypeORM with auto-sync, the schema should update automatically when you restart the backend.

**Manual Migration (if needed)**:
```sql
-- Add to vendors table
ALTER TABLE vendors 
ADD COLUMN pickupLatitude DECIMAL(10,7) NULL,
ADD COLUMN pickupLongitude DECIMAL(10,7) NULL,
ADD COLUMN pickupInstructions TEXT NULL;

-- Add to orders table
ALTER TABLE orders
ADD COLUMN fulfillmentType ENUM('delivery', 'pickup') DEFAULT 'delivery',
ADD COLUMN pickupToken VARCHAR(255) NULL UNIQUE,
ADD COLUMN pickupVerifiedAt TIMESTAMP NULL,
ADD COLUMN pickupVerifiedBy VARCHAR(255) NULL;
```

### Step 2: Install Dependencies (Already Done ✅)
```bash
cd frontend
npm install qrcode html5-qrcode leaflet react-leaflet
```

### Step 3: Build & Restart
```bash
# Backend
cd backend
npm run build
npm start

# Frontend (Development)
cd frontend
npm run dev

# Frontend (Production)
cd frontend
npm run build
```

---

## 🧪 Testing Guide

### Test 1: Vendor Setup (2 minutes)
1. Login as a vendor
2. Go to **Store Profile**
3. Scroll to **"Self-Pickup Location"** section
4. Get coordinates from Google Maps:
   - Open [Google Maps](https://maps.google.com)
   - Find your location
   - Right-click → "What's here?"
   - Copy the coordinates (e.g., 6.5244, 3.3792)
5. Enter:
   - **Latitude**: `6.5244`
   - **Longitude**: `3.3792`
   - **Pickup Instructions**: `"Enter through main gate, look for counter #5"`
6. Click **"Save Profile"**
7. ✅ Should see: "✨ Self-pickup enabled!"

### Test 2: Customer Pickup Order (3 minutes)
1. Login as a customer
2. Add products from the vendor above to cart
3. Go to **Checkout**
4. Select **"Self-Pickup"** option
5. ✅ Should see: "No delivery fee for pickup orders!"
6. Enter phone number (optional)
7. Click **"Place Order"**
8. Complete payment
9. Go to **My Orders** → Click on new order
10. ✅ Should see:
    - "Self-Pickup" badge
    - "Order Being Prepared" status
    - No QR code yet (order not ready)
    - Vendor location and map

### Test 3: Vendor Preparation (1 minute)
1. Login as the vendor
2. Go to **Orders**
3. Find the new order
4. ✅ Should see: "Pickup" badge (primary color)
5. Click **"Accept"** → **"Start Preparing"** → **"Mark Ready"**
6. ✅ "Verify Pickup" button should appear

### Test 4: Customer Sees Ready Order (1 minute)
1. Login as customer
2. Go to **My Orders** → Click order
3. ✅ Should see:
   - "Ready for Pickup!" (primary color)
   - QR code displayed
   - Map with vendor location
   - "Get Directions" button
   - Pickup instructions

### Test 5: QR Code Verification (2 minutes)

**Option A: QR Scanner (Recommended)**
1. As vendor, click **"Verify Pickup"** button
2. Click **"Start Camera Scanner"**
3. Allow camera access
4. Point camera at customer's QR code (on their phone/screen)
5. ✅ Should auto-detect and verify
6. ✅ Success message appears
7. Order status changes to "Delivered"

**Option B: Manual Entry (Fallback)**
1. As vendor, click **"Verify Pickup"**
2. Click **"Manual"** tab
3. Customer shows their screen
4. Copy the token from the QR code URL or use browser inspect
5. Paste token in field
6. Click **"Verify Pickup"**
7. ✅ Should verify successfully

### Test 6: Verify Changes (1 minute)
1. As customer, refresh order page
2. ✅ Should see: "Order Picked Up!" with timestamp
3. As vendor, check order list
4. ✅ Should see: "Picked up at [time]" with green checkmark
5. Check vendor earnings
6. ✅ Should be updated with order total

---

## 🎯 Feature Checklist

### Customer Features ✅
- [x] Choose delivery or pickup at checkout
- [x] See zero delivery fee for pickup
- [x] View vendor location on map
- [x] Get directions to vendor
- [x] See pickup instructions
- [x] Generate QR code for verification
- [x] Real-time order status updates

### Vendor Features ✅
- [x] Set pickup location in profile
- [x] See fulfillment type badge on orders
- [x] Verify pickup with QR scanner
- [x] Verify pickup with manual entry
- [x] Automatic earnings update
- [x] Pickup timestamp tracking

### System Features ✅
- [x] Secure token generation
- [x] Token validation
- [x] Duplicate prevention
- [x] Camera permission handling
- [x] Error messages
- [x] Mobile responsive
- [x] Real-time notifications
- [x] Non-breaking changes

---

## 📱 Mobile Testing

### iOS Safari
1. Open checkout page
2. Select pickup option
3. Complete order
4. View order detail → QR code should display
5. Vendor scans with camera → Should work

### Android Chrome
1. Same steps as iOS
2. Verify QR scanner works
3. Test manual entry fallback

### Camera Permissions
- First time: Browser will ask for camera permission
- If denied: Manual entry mode becomes available
- HTTPS required for camera access in production

---

## 🐛 Troubleshooting

### "Vendor does not offer pickup service"
- Vendor must set pickup location in profile
- Both latitude and longitude required
- Save profile after entering coordinates

### QR code not showing
- Order must be in "ready" status
- Pickup orders only (not delivery)
- Already picked up orders won't show QR code

### Camera not working
- Ensure HTTPS (required for camera API)
- Check browser permissions
- Use manual entry as fallback
- Try different browser

### "Invalid pickup token"
- Token is case-sensitive
- Copy full token (64 characters)
- Check for extra spaces
- Token is one-time use only

### Map not loading
- Check internet connection
- Leaflet CSS should be imported
- Coordinates must be valid numbers
- OpenStreetMap tiles loading

### Multiple vendors error
- Pickup only works with single vendor
- Checkout one vendor at a time for pickup
- Use delivery for multi-vendor orders

---

## 🚀 Production Deployment

### Pre-Deployment Checklist
- [x] Backend builds successfully (`npm run build`)
- [x] Frontend builds successfully (`npm run build`)
- [x] No TypeScript errors
- [x] No ESLint errors
- [x] Database migration ready
- [ ] HTTPS configured (required for camera)
- [ ] Test on staging environment
- [ ] Mobile testing complete

### Deployment Steps
1. **Backup database**
2. **Deploy backend**:
   ```bash
   cd backend
   git pull
   npm install
   npm run build
   pm2 restart sisters-kitchen-backend
   ```
3. **Deploy frontend**:
   ```bash
   cd frontend
   git pull
   npm install
   npm run build
   # Copy dist/ to web server
   ```
4. **Verify**:
   - Backend health check
   - Frontend loads
   - Database schema updated
   - Test one complete flow

### Post-Deployment
- Monitor error logs for 24 hours
- Check camera permissions work on production domain
- Test QR scanner on real mobile devices
- Gather vendor feedback
- Monitor pickup adoption rate

---

## 📊 Analytics to Track

1. **Adoption Rate**: % of orders choosing pickup
2. **Vendor Enablement**: % of vendors with pickup location set
3. **Verification Time**: Average time from ready → picked up
4. **Scanner Usage**: QR scanner vs manual entry ratio
5. **Customer Savings**: Total delivery fees saved
6. **Error Rate**: Failed verifications / total verifications

---

## 💡 Tips for Vendors

### Getting Accurate Coordinates
1. Search your business on Google Maps
2. Make sure you're zoomed in close
3. Right-click directly on your location
4. Click "What's here?" at the top
5. Coordinates appear at the bottom
6. First number = Latitude, Second = Longitude

### Writing Good Pickup Instructions
Good examples:
- ✅ "Enter through main gate, counter is on the right"
- ✅ "Ring doorbell, someone will bring your order out"
- ✅ "Park in visitor parking, call when you arrive"

Avoid:
- ❌ "Come get it" (not helpful)
- ❌ Long paragraphs (keep it concise)

---

## 📞 Support

### For Vendors
- How to set pickup location: See profile page help section
- How to verify pickup: Click "Verify Pickup" button when order ready
- Camera not working: Use manual entry tab

### For Customers
- How to choose pickup: Select at checkout
- How to find vendor: Use "Get Directions" button
- QR code not showing: Order must be "ready" first

### For Developers
- Backend endpoint: `POST /api/orders/:id/verify-pickup`
- Token format: 64-character hex string
- QR library: qrcode npm package
- Scanner library: html5-qrcode npm package
- Map library: react-leaflet with OpenStreetMap

---

## ✅ Ready to Go!

Your Self-Pickup system is now ready to use. Follow the testing guide above to verify everything works, then deploy to production when ready.

**Next**: Run through Test 1-6 above to verify the complete flow works end-to-end.
