# 🚀 PRE-ORDER SYSTEM - IMPLEMENTATION PLAN
**Sisters Kitchen - Step-by-Step Integration Guide**

---

## 📋 QUICK SUMMARY

**What**: Scheduled Pre-Order system for future date/time products  
**How**: Parallel system alongside existing orders (non-breaking)  
**When**: Implement in 3 phases over 2-3 weeks  

---

## 🎯 ARCHITECTURE OVERVIEW

### Non-Breaking Design ✅

```
EXISTING SYSTEM (Untouched):
Product → Cart → Order → Payment → Delivery
     ✅ Works exactly as before

NEW PRE-ORDER SYSTEM (Parallel):
Product → PreOrderSchedule → PreOrder → Payment → Ready on Date
     ✅ Separate entities, no conflicts
```

---

## 📊 NEW DATABASE ENTITIES

### 1. PreOrderSchedule
**Purpose**: Define when/how product is available for pre-order

```typescript
{
  product: Product,              // Link to product
  vendor: Vendor,                // Who's offering it
  availableDate: Date,           // When it's ready (Oct 13, 2pm)
  preOrderStartTime: Date,       // Pre-orders open (Oct 7)
  preOrderEndTime: Date,         // Deadline (Oct 12)
  scheduledStock: 50,            // How many available
  soldQuantity: 23,              // How many pre-ordered
  fulfillmentType: "both",       // pickup, delivery, both
  preOrderPrice: 2500,           // Optional special price
  specialNotes: "Sunday lunch",  // Context
}
```

### 2. PreOrder
**Purpose**: Customer's pre-order booking

```typescript
{
  schedule: PreOrderSchedule,    // Which schedule
  customer: User,                // Who ordered
  product: Product,              // What they ordered
  quantity: 3,                   // How many
  pricePerUnit: 2500,           // Price locked in
  totalAmount: 7500,            // Total cost
  fulfillmentMethod: "delivery", // pickup or delivery
  deliveryAddress: "...",        // If delivery
  status: "paid",                // Payment status
  paymentId: "...",             // Link to payment
}
```

---

## 🛠️ IMPLEMENTATION PHASES

### ✅ PHASE 1: Backend Foundation (Week 1)

#### Day 1-2: Database Setup
```bash
# Tasks:
- Create PreOrderSchedule entity
- Create PreOrder entity
- Run migrations
- Add Product.preOrderSchedules relationship (optional)
```

#### Day 3-4: Controllers & Services
```bash
# Tasks:
- PreOrderScheduleController
  - create, update, delete schedule
  - get vendor's schedules
  - get active schedules
  
- PreOrderController
  - place pre-order
  - get customer's pre-orders
  - get schedule's pre-orders
  - cancel pre-order
```

#### Day 5: Validation & Logic
```bash
# Tasks:
- Stock validation (check remaining)
- Time window validation
- Fulfillment type validation
- Stock decrement on pre-order
- Stock restoration on cancellation
```

---

### ✅ PHASE 2: Vendor Interface (Week 2)

#### Day 6-7: Schedule Management
```bash
# New Pages:
1. VendorPreOrders.jsx (list all schedules)
2. PreOrderForm.jsx (create/edit schedule)
3. PreOrderScheduleCard.jsx (display component)

# Features:
- View upcoming, active, closed schedules
- Create new schedule for any product
- Edit schedule (before pre-orders start)
- Cancel schedule
- See pre-order count & revenue
```

#### Day 8-9: Pre-Order Management
```bash
# Features:
- List customers who pre-ordered
- See delivery/pickup details
- Mark pre-orders as ready
- Customer notifications
- Pre-order analytics
```

#### Day 10: Dashboard Integration
```bash
# Updates:
- Add "Upcoming Pre-Orders" widget to dashboard
- Show pre-order revenue
- Real-time notifications for new pre-orders
```

---

### ✅ PHASE 3: Customer Interface (Week 3)

#### Day 11-12: Product Display
```bash
# Updates to Existing Components:
1. ProductCard.jsx
   - Add pre-order badge
   - Show availability date
   - Display countdown
   - "Pre-Order Now" button

2. ProductDetailPage.jsx
   - Pre-order schedule card
   - Countdown timer
   - Remaining slots
   - Fulfillment options
```

#### Day 13-14: Pre-Order Checkout
```bash
# New Flow:
1. Customer clicks "Pre-Order Now"
2. PreOrderCheckout.jsx
   - Select quantity (limited by stock)
   - Choose pickup/delivery
   - Enter delivery details (if delivery)
   - Review schedule details
3. Payment (use existing Paystack)
4. Confirmation with pre-order number
```

#### Day 15-16: Customer Dashboard
```bash
# New Page: MyPreOrders.jsx
- List all customer's pre-orders
- Filter: Upcoming, Past
- Show:
  - Pre-order number
  - Product & quantity
  - Available date/time
  - Fulfillment method
  - Status
- Cancel option (before deadline)
```

---

## 🎨 UI EXAMPLES

### Vendor: Schedule Creation Form

```jsx
<form>
  <h2>Schedule Pre-Order</h2>

  {/* 1. Product Selection */}
  <select name="productId">
    <option>Jollof Rice Party Pack</option>
    <option>Birthday Cake (12")</option>
    <option>Shawarma Special</option>
  </select>

  {/* 2. Dates & Times */}
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label>Available Date & Time</label>
      <input 
        type="datetime-local" 
        name="availableDate"
        // e.g., Sunday Oct 13, 2:00 PM
      />
    </div>
    <div>
      <label>Pre-Order Deadline</label>
      <input 
        type="datetime-local" 
        name="preOrderEndTime"
        // e.g., Saturday Oct 12, 6:00 PM
      />
    </div>
  </div>

  {/* 3. Stock */}
  <div>
    <label>How Many Available?</label>
    <input type="number" name="scheduledStock" value="50" />
    <p className="text-xs text-brand-muted">
      Total slots for this schedule
    </p>
  </div>

  {/* 4. Fulfillment */}
  <div>
    <label>Fulfillment Options</label>
    <select name="fulfillmentType">
      <option value="both">Pickup & Delivery</option>
      <option value="pickup">Pickup Only</option>
      <option value="delivery">Delivery Only</option>
    </select>
  </div>

  {/* 5. Optional Special Price */}
  <div>
    <label>Pre-Order Price (Optional)</label>
    <input 
      type="number" 
      name="preOrderPrice"
      placeholder="Leave empty for regular price"
    />
  </div>

  {/* 6. Notes */}
  <textarea 
    name="specialNotes"
    placeholder="E.g., 'Fresh for Sunday lunch', 'Party catering'"
  />

  <button type="submit">Create Schedule</button>
</form>
```

---

### Customer: Product Card with Pre-Order

```jsx
{/* BEFORE (Regular Product) */}
<div className="product-card">
  <img src={product.image} />
  <h3>Jollof Rice</h3>
  <p>₦2,500</p>
  <span className="badge green">
    15 Available
  </span>
  <button>Add to Cart</button>
</div>

{/* AFTER (Pre-Order Product) */}
<div className="product-card">
  <img src={product.image} />
  <span className="badge blue">
    📅 Pre-Order for Oct 13
  </span>
  <h3>Jollof Rice Party Pack</h3>
  <p>₦2,500</p>
  
  {/* Pre-Order Info Box */}
  <div className="bg-blue-50 p-3 rounded-lg">
    <p className="text-xs text-blue-700">
      🕐 Closes: Oct 12, 6pm
    </p>
    <p className="text-xs text-blue-600">
      35 slots left
    </p>
  </div>
  
  <button className="btn-primary">
    Pre-Order Now
  </button>
</div>
```

---

### Customer: Pre-Order Detail View

```jsx
<div className="pre-order-detail">
  
  {/* Schedule Card */}
  <div className="card bg-blue-50 p-6">
    <h3 className="font-bold text-blue-800">
      📅 Scheduled Pre-Order
    </h3>
    
    <div className="space-y-3 mt-4">
      <div className="flex justify-between">
        <span>Available:</span>
        <strong>Sunday, Oct 13 at 2:00 PM</strong>
      </div>
      <div className="flex justify-between">
        <span>Pre-order closes:</span>
        <strong>Saturday, Oct 12 at 6:00 PM</strong>
      </div>
      <div className="flex justify-between">
        <span>Remaining slots:</span>
        <strong className="text-orange-600">35 / 50</strong>
      </div>
      <div className="flex justify-between">
        <span>Options:</span>
        <strong>Pickup & Delivery</strong>
      </div>
    </div>

    {/* Countdown Timer */}
    <div className="mt-4 p-3 bg-white rounded-lg text-center">
      <p className="text-xs text-brand-muted">
        Pre-order closes in
      </p>
      <div className="text-2xl font-bold text-blue-700">
        2d 14h 23m
      </div>
    </div>
  </div>

  {/* Quantity Selector */}
  <div className="mt-6">
    <label>Quantity (Max: 35)</label>
    <input type="number" min="1" max="35" value="2" />
  </div>

  {/* Pre-Order Button */}
  <button className="btn-primary w-full py-4 text-lg">
    Pre-Order 2 for Oct 13 • ₦5,000
  </button>
</div>
```

---

## 🔄 KEY WORKFLOWS

### Vendor: Creating a Schedule

```
1. Go to "Scheduled Pre-Orders"
2. Click "Schedule Product"
3. Select product: "Birthday Cake (12")"
4. Set available date: "Saturday, Oct 19 at 3pm"
5. Set pre-order window: "Oct 12-18"
6. Set stock: 10 cakes
7. Choose: "Pickup Only"
8. Add note: "Custom messages available"
9. Save schedule
10. Schedule goes live
11. Customers can now pre-order
```

---

### Customer: Placing Pre-Order

```
1. Browse products
2. See "Pre-Order for Oct 19" badge
3. Click product
4. View schedule details
5. See countdown: "2 days left"
6. Select quantity: 1 cake
7. Choose pickup time: "3pm-4pm"
8. Click "Pre-Order Now"
9. Enter pickup name & phone
10. Pay ₦15,000
11. Receive confirmation: "PO-2023-001"
12. Get reminder on Oct 19
13. Pick up cake at 3pm
```

---

## 🚦 VALIDATION LOGIC

### Schedule Creation
```typescript
// Validate dates
if (preOrderEndTime >= availableDate) {
  throw "Deadline must be before available date";
}

if (preOrderStartTime >= preOrderEndTime) {
  throw "Start time must be before end time";
}

if (availableDate <= new Date()) {
  throw "Available date must be in future";
}

// Validate stock
if (scheduledStock <= 0) {
  throw "Stock must be greater than 0";
}
```

### Pre-Order Placement
```typescript
// Check if schedule is active
if (!schedule.isActive) {
  throw "This schedule is no longer active";
}

// Check pre-order window
const now = new Date();
if (now < schedule.preOrderStartTime) {
  throw "Pre-orders haven't opened yet";
}
if (now > schedule.preOrderEndTime) {
  throw "Pre-order deadline has passed";
}

// Check stock
if (quantity > schedule.remainingStock) {
  throw `Only ${schedule.remainingStock} available`;
}

// Check fulfillment method
if (fulfillmentMethod === "pickup" && schedule.fulfillmentType === "delivery") {
  throw "This schedule is delivery-only";
}
```

---

## 📊 DATABASE QUERIES

### Get Active Pre-Order Schedules
```sql
SELECT * FROM pre_order_schedules
WHERE is_active = TRUE
  AND pre_order_start_time <= NOW()
  AND pre_order_end_time >= NOW()
  AND (scheduled_stock - sold_quantity) > 0
ORDER BY available_date ASC;
```

### Get Vendor's Upcoming Schedules
```sql
SELECT 
  s.*,
  p.name as product_name,
  p.images as product_images,
  (s.scheduled_stock - s.sold_quantity) as remaining_stock
FROM pre_order_schedules s
JOIN products p ON s.product_id = p.id
WHERE s.vendor_id = ?
  AND s.available_date > NOW()
ORDER BY s.available_date ASC;
```

### Get Customer's Pre-Orders
```sql
SELECT 
  po.*,
  p.name as product_name,
  p.images as product_images,
  s.available_date,
  s.fulfillment_type,
  v.business_name as vendor_name
FROM pre_orders po
JOIN pre_order_schedules s ON po.schedule_id = s.id
JOIN products p ON po.product_id = p.id
JOIN vendors v ON po.vendor_id = v.id
WHERE po.customer_id = ?
ORDER BY s.available_date DESC;
```

---

## 🎯 TESTING CHECKLIST

### Vendor Tests
- [ ] Create schedule with valid dates
- [ ] Try invalid date combinations (should fail)
- [ ] Edit schedule before pre-orders start
- [ ] Cannot edit after pre-orders start
- [ ] View list of pre-orders
- [ ] Cancel schedule (refunds customers)
- [ ] Mark pre-orders as ready
- [ ] See revenue from pre-orders

### Customer Tests
- [ ] Browse products with pre-order badges
- [ ] View schedule details
- [ ] Place pre-order (valid quantity)
- [ ] Try ordering more than available (should fail)
- [ ] Try ordering after deadline (should fail)
- [ ] View my pre-orders
- [ ] Cancel pre-order before deadline
- [ ] Cannot cancel after deadline
- [ ] Receive notifications

### System Tests
- [ ] Stock decrements correctly
- [ ] Stock restores on cancellation
- [ ] Payment integration works
- [ ] Real-time updates work
- [ ] Existing order system unaffected
- [ ] Performance acceptable

---

## ✅ SUCCESS METRICS

### Phase 1 (Backend)
- [ ] All entities created
- [ ] All endpoints working
- [ ] Validation logic complete
- [ ] Tests passing

### Phase 2 (Vendor)
- [ ] Vendors can create schedules
- [ ] Vendors can manage pre-orders
- [ ] Dashboard updated
- [ ] Notifications working

### Phase 3 (Customer)
- [ ] Customers can browse schedules
- [ ] Customers can pre-order
- [ ] Checkout flow works
- [ ] Tracking works

---

## 🚀 DEPLOYMENT STRATEGY

### Step 1: Deploy Backend
```bash
# Add new tables
npm run migration:run

# Deploy API updates
git push production
```

### Step 2: Feature Flag (Optional)
```typescript
// In config
ENABLE_PRE_ORDERS=true

// In code
if (process.env.ENABLE_PRE_ORDERS === 'true') {
  // Show pre-order features
}
```

### Step 3: Gradual Rollout
```
Week 1: Beta vendors only
Week 2: All vendors, hidden from customers
Week 3: Full launch
```

---

## 📞 NEXT STEPS

### To Start Implementation:

1. **Review Design Document**: `PRE_ORDER_SYSTEM_DESIGN.md`
2. **Create Backend Entities**: PreOrderSchedule, PreOrder
3. **Build API Endpoints**: Controllers & services
4. **Create Vendor UI**: Schedule management
5. **Build Customer UI**: Pre-order flow
6. **Test Thoroughly**: All scenarios
7. **Deploy**: Gradual rollout

---

**Ready to implement?** The design is complete and non-breaking. We can start with Phase 1 (backend) whenever you're ready!

**Estimated Timeline**:
- Phase 1 (Backend): 5 days
- Phase 2 (Vendor UI): 5 days
- Phase 3 (Customer UI): 6 days
- Total: **2-3 weeks**

---

**Status**: ✅ Design Complete & Ready for Implementation  
**Risk Level**: 🟢 LOW (Non-breaking, additive)  
**Impact**: 🟢 HIGH (Major feature, competitive advantage)
