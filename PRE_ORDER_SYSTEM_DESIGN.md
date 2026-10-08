# 🎯 SCHEDULED PRE-ORDER SYSTEM - DESIGN DOCUMENT
**Sisters Kitchen - Feature Integration Plan**

---

## 📋 EXECUTIVE SUMMARY

**Feature**: Scheduled Pre-Order System  
**Goal**: Allow vendors to schedule products for future dates/times with pre-order capability  
**Scope**: New entity + existing system integration  
**Approach**: Non-breaking, additive architecture

---

## 🏗️ ARCHITECTURE ANALYSIS

### Current System Structure

```
Product (Regular Listing)
    ↓
Available immediately
Stock-based availability
Normal checkout flow
```

### Proposed Pre-Order Structure

```
Product (Regular Listing)
    ↓
    ├─ Normal Product (existing)
    │    ↓
    │  Available immediately
    │  Stock-based
    │
    └─ Scheduled Product (NEW)
         ↓
       PreOrderSchedule (NEW entity)
         ↓
       Available date/time
       Pre-order windows
       Dedicated stock
```

---

## 🗄️ DATABASE DESIGN

### NEW ENTITY: PreOrderSchedule

```typescript
@Entity("pre_order_schedules")
export class PreOrderSchedule {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // ── Product Relationship ──────────────────────────
  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn()
  product: Product;

  @ManyToOne(() => Vendor, { onDelete: "CASCADE" })
  @JoinColumn()
  vendor: Vendor;

  // ── Schedule Timing ───────────────────────────────
  @Column({ type: "timestamp" })
  availableDate: Date;  // When product is ready/available

  @Column({ type: "timestamp" })
  preOrderStartTime: Date;  // When pre-orders open

  @Column({ type: "timestamp" })
  preOrderEndTime: Date;  // Pre-order deadline

  // ── Inventory & Fulfillment ──────────────────────
  @Column({ type: "int", default: 0 })
  scheduledStock: number;  // Dedicated stock for this schedule

  @Column({ type: "int", default: 0 })
  soldQuantity: number;  // How many pre-ordered

  @Column({ 
    type: "enum", 
    enum: ["pickup", "delivery", "both"],
    default: "both" 
  })
  fulfillmentType: string;

  // ── Status & Settings ─────────────────────────────
  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "text", nullable: true })
  specialNotes: string;  // E.g., "For Sunday lunch", "Party pack"

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  preOrderPrice: number;  // Optional special pre-order price

  @Column({ type: "int", nullable: true })
  minOrderQuantity: number;  // E.g., "Minimum 5 for catering"

  @Column({ type: "int", nullable: true })
  maxOrderQuantity: number;  // Per customer limit

  // ── Computed Fields ───────────────────────────────
  get remainingStock(): number {
    return this.scheduledStock - this.soldQuantity;
  }

  get isSoldOut(): boolean {
    return this.soldQuantity >= this.scheduledStock;
  }

  get isPreOrderOpen(): boolean {
    const now = new Date();
    return now >= this.preOrderStartTime && now <= this.preOrderEndTime;
  }

  get isPast(): boolean {
    return new Date() > this.availableDate;
  }

  // ── Relations ─────────────────────────────────────
  @OneToMany(() => PreOrder, (preOrder) => preOrder.schedule)
  preOrders: PreOrder[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

### NEW ENTITY: PreOrder

```typescript
@Entity("pre_orders")
export class PreOrder {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  preOrderNumber: string;  // PO-20261007-XXXX

  // ── Relationships ─────────────────────────────────
  @ManyToOne(() => PreOrderSchedule, { onDelete: "CASCADE" })
  @JoinColumn()
  schedule: PreOrderSchedule;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn()
  customer: User;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn()
  product: Product;

  @ManyToOne(() => Vendor, { onDelete: "CASCADE" })
  @JoinColumn()
  vendor: Vendor;

  // ── Order Details ─────────────────────────────────
  @Column({ type: "int" })
  quantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  pricePerUnit: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ 
    type: "enum", 
    enum: ["pickup", "delivery"] 
  })
  fulfillmentMethod: string;

  @Column({ type: "text", nullable: true })
  deliveryAddress: string;

  @Column({ nullable: true })
  deliveryPhone: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  // ── Status & Payment ──────────────────────────────
  @Column({
    type: "enum",
    enum: ["pending_payment", "paid", "confirmed", "ready", "completed", "cancelled"],
    default: "pending_payment"
  })
  status: string;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ nullable: true })
  paymentId: string;  // Link to Payment entity

  @Column({ nullable: true })
  pickupTime: string;  // For pickup orders

  @Column({ type: "timestamp", nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  cancellationReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## 🔄 INTEGRATION STRATEGY

### 1. Product Entity - NO BREAKING CHANGES ✅

**Add optional relationship** (non-breaking):
```typescript
@Entity("products")
export class Product {
  // ... existing fields remain unchanged ...

  // NEW (optional)
  @OneToMany(() => PreOrderSchedule, (schedule) => schedule.product)
  preOrderSchedules?: PreOrderSchedule[];
}
```

**Result**: Existing products work as-is. Products can optionally have schedules.

---

### 2. Order Flow - Parallel Systems

```
CURRENT FLOW (Unchanged):
Product → Cart → Checkout → Order → Payment → Delivered

NEW PRE-ORDER FLOW (Parallel):
Product → PreOrderSchedule → PreOrder → Payment → Ready on Date → Pickup/Delivery
```

**Key**: Regular orders and pre-orders are separate entities, no conflicts.

---

## 🎨 FRONTEND UI DESIGN

### Vendor: Product Form Enhancement

```jsx
// In ProductForm.jsx - Add Pre-Order Section

<div className="card p-5">
  <div className="flex items-center justify-between mb-3">
    <h2 className="font-semibold text-brand-dark">
      📅 Scheduled Pre-Orders (Optional)
    </h2>
    <button 
      type="button" 
      onClick={() => navigate('/vendor/pre-orders/new')}
      className="btn-secondary text-xs"
    >
      Schedule This Product
    </button>
  </div>
  
  {/* Show existing schedules */}
  {product.preOrderSchedules?.length > 0 && (
    <div className="space-y-2">
      {product.preOrderSchedules.map(schedule => (
        <div key={schedule.id} className="p-3 bg-blue-50 rounded-xl">
          <p className="text-sm font-semibold text-blue-700">
            📅 {formatDate(schedule.availableDate)}
          </p>
          <p className="text-xs text-blue-600">
            {schedule.soldQuantity}/{schedule.scheduledStock} pre-ordered
          </p>
        </div>
      ))}
    </div>
  )}
</div>
```

---

### NEW PAGE: VendorPreOrders.jsx

```jsx
// List all scheduled products with management
<DashboardLayout>
  <div className="flex items-center justify-between mb-6">
    <h1>Scheduled Pre-Orders</h1>
    <Link to="/vendor/pre-orders/new" className="btn-primary">
      + Schedule Product
    </Link>
  </div>

  {/* Tabs */}
  <div className="flex gap-2 mb-6">
    <button>Upcoming</button>
    <button>Open for Pre-Order</button>
    <button>Closed</button>
    <button>Past</button>
  </div>

  {/* Schedule Cards */}
  {schedules.map(schedule => (
    <ScheduleCard key={schedule.id} schedule={schedule} />
  ))}
</DashboardLayout>
```

---

### NEW PAGE: PreOrderForm.jsx

```jsx
// Vendor creates a pre-order schedule
<form onSubmit={handleCreateSchedule}>
  
  {/* 1. Select Product */}
  <select name="productId">
    {products.map(p => (
      <option value={p.id}>{p.name}</option>
    ))}
  </select>

  {/* 2. Available Date/Time */}
  <input 
    type="datetime-local" 
    name="availableDate"
    label="When will this be ready?"
  />

  {/* 3. Pre-Order Window */}
  <input 
    type="datetime-local" 
    name="preOrderStartTime"
    label="Pre-orders open"
  />
  <input 
    type="datetime-local" 
    name="preOrderEndTime"
    label="Pre-order deadline"
  />

  {/* 4. Scheduled Stock */}
  <input 
    type="number" 
    name="scheduledStock"
    label="How many available?"
  />

  {/* 5. Fulfillment Type */}
  <select name="fulfillmentType">
    <option value="both">Pickup & Delivery</option>
    <option value="pickup">Pickup Only</option>
    <option value="delivery">Delivery Only</option>
  </select>

  {/* 6. Optional: Special Pricing */}
  <input 
    type="number" 
    name="preOrderPrice"
    label="Pre-order price (optional)"
    placeholder="Leave empty to use regular price"
  />

  {/* 7. Special Notes */}
  <textarea 
    name="specialNotes"
    placeholder="E.g., 'Fresh for Sunday lunch'"
  />

  <button type="submit">Schedule Product</button>
</form>
```

---

### Customer: Product Card Enhancement

```jsx
// In ProductCard.jsx - Show pre-order badge

export default function ProductCard({ product }) {
  const activeSchedule = product.preOrderSchedules?.find(
    s => s.isActive && s.isPreOrderOpen && !s.isSoldOut
  );

  return (
    <motion.div className="card">
      <div className="relative">
        <img src={product.images[0]} />
        
        {/* REGULAR STOCK (existing) */}
        {!activeSchedule && product.stock > 0 && (
          <span className="badge bg-accent">
            {product.stock} Available
          </span>
        )}

        {/* PRE-ORDER BADGE (new) */}
        {activeSchedule && (
          <span className="badge bg-blue-500">
            📅 Pre-Order for {formatDate(activeSchedule.availableDate)}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3>{product.name}</h3>
        <p>{formatPrice(product.price)}</p>

        {/* Pre-order info */}
        {activeSchedule && (
          <div className="mt-2 p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              🕐 Pre-order closes: {formatDate(activeSchedule.preOrderEndTime)}
            </p>
            <p className="text-xs text-blue-600">
              {activeSchedule.remainingStock} slots left
            </p>
          </div>
        )}

        <button onClick={handleAddToCart}>
          {activeSchedule ? 'Pre-Order Now' : 'Add to Cart'}
        </button>
      </div>
    </motion.div>
  );
}
```

---

### NEW PAGE: PreOrderDetailPage.jsx

```jsx
// Customer views product with pre-order schedule

<MainLayout>
  <div className="max-w-4xl mx-auto py-10">
    
    {/* Product Info */}
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <img src={product.images[0]} />
      </div>

      <div>
        <h1>{product.name}</h1>
        <p>{product.description}</p>

        {/* PRE-ORDER SCHEDULE */}
        <div className="card p-5 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-3">
            📅 Scheduled Pre-Order
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Available:</span>
              <strong>{formatDateTime(schedule.availableDate)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Pre-order closes:</span>
              <strong>{formatDateTime(schedule.preOrderEndTime)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Remaining slots:</span>
              <strong className="text-orange-600">
                {schedule.remainingStock}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Fulfillment:</span>
              <strong>{schedule.fulfillmentType}</strong>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="mt-4 p-3 bg-white rounded-lg text-center">
            <p className="text-xs text-brand-muted mb-1">
              Pre-order closes in
            </p>
            <CountdownTimer targetDate={schedule.preOrderEndTime} />
          </div>
        </div>

        {/* Quantity & Pre-Order Button */}
        <div className="mt-5">
          <label>Quantity</label>
          <input type="number" min="1" max={schedule.remainingStock} />

          <button className="btn-primary w-full mt-3">
            Pre-Order for {formatDate(schedule.availableDate)}
          </button>
        </div>
      </div>
    </div>
  </div>
</MainLayout>
```

---

## 🔄 WORKFLOW DIAGRAMS

### Vendor Workflow

```
1. Create Product (normal process)
        ↓
2. Go to "Schedule Pre-Order"
        ↓
3. Select Product
        ↓
4. Set Available Date: "Sunday, Oct 13, 2pm"
        ↓
5. Set Pre-Order Window: "Oct 7-12"
        ↓
6. Set Stock: 50 portions
        ↓
7. Choose Fulfillment: Pickup & Delivery
        ↓
8. Save Schedule
        ↓
9. Schedule appears in "Scheduled Pre-Orders"
        ↓
10. Customers can now pre-order
        ↓
11. Vendor sees pre-orders coming in
        ↓
12. Pre-order deadline passes
        ↓
13. Vendor prepares food
        ↓
14. Available date arrives
        ↓
15. Customers pick up or receive delivery
```

---

### Customer Workflow

```
1. Browse products
        ↓
2. See product with "Pre-Order" badge
        ↓
3. Click to view details
        ↓
4. See schedule:
   - Available: Sunday 2pm
   - Pre-order closes: Saturday 6pm
   - 35 slots left
        ↓
5. Select quantity
        ↓
6. Click "Pre-Order Now"
        ↓
7. Choose: Pickup or Delivery
        ↓
8. Enter details (if delivery)
        ↓
9. Pay now
        ↓
10. Receive confirmation:
    "Pre-order #PO-001 confirmed for Sunday 2pm"
        ↓
11. Track pre-order status
        ↓
12. Get notification when ready
        ↓
13. Pick up or receive delivery
```

---

## 🚦 API ENDPOINTS

### Vendor Endpoints

```typescript
// Create pre-order schedule
POST /api/pre-orders/schedules
Body: {
  productId, availableDate, preOrderStartTime, 
  preOrderEndTime, scheduledStock, fulfillmentType,
  preOrderPrice?, specialNotes?
}

// Get vendor's schedules
GET /api/pre-orders/schedules/my-schedules
Query: ?status=upcoming|open|closed|past

// Update schedule
PATCH /api/pre-orders/schedules/:id
Body: { scheduledStock, isActive, ... }

// Get pre-orders for a schedule
GET /api/pre-orders/schedules/:scheduleId/orders

// Cancel schedule
DELETE /api/pre-orders/schedules/:id
```

---

### Customer Endpoints

```typescript
// Browse pre-orderable products
GET /api/pre-orders/available
Query: ?category=&vendorId=&date=

// Get schedule details
GET /api/pre-orders/schedules/:id

// Place pre-order
POST /api/pre-orders
Body: {
  scheduleId, quantity, fulfillmentMethod,
  deliveryAddress?, notes?
}

// Get my pre-orders
GET /api/pre-orders/my-orders
Query: ?status=pending|confirmed|completed

// Get pre-order details
GET /api/pre-orders/:preOrderId

// Cancel pre-order
DELETE /api/pre-orders/:preOrderId
```

---

## 🎯 FEATURE FLAGS & ROLLOUT

### Phase 1: Backend Foundation
- [ ] Create PreOrderSchedule entity
- [ ] Create PreOrder entity
- [ ] Add controllers
- [ ] Add validation logic
- [ ] Test API endpoints

### Phase 2: Vendor Interface
- [ ] VendorPreOrders list page
- [ ] PreOrderForm (schedule creation)
- [ ] PreOrderScheduleCard component
- [ ] Pre-order management dashboard
- [ ] Notifications for new pre-orders

### Phase 3: Customer Interface
- [ ] Pre-order badges on ProductCard
- [ ] PreOrderDetailPage
- [ ] CountdownTimer component
- [ ] Pre-order checkout flow
- [ ] My Pre-Orders page
- [ ] Pre-order tracking

### Phase 4: Polish & Launch
- [ ] Email notifications
- [ ] SMS reminders (optional)
- [ ] Analytics dashboard
- [ ] Documentation
- [ ] Testing & QA

---

## 📊 DATABASE MIGRATIONS

### Migration 1: Create pre_order_schedules

```sql
CREATE TABLE pre_order_schedules (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  vendor_id VARCHAR(36) NOT NULL,
  available_date TIMESTAMP NOT NULL,
  pre_order_start_time TIMESTAMP NOT NULL,
  pre_order_end_time TIMESTAMP NOT NULL,
  scheduled_stock INT DEFAULT 0,
  sold_quantity INT DEFAULT 0,
  fulfillment_type ENUM('pickup', 'delivery', 'both') DEFAULT 'both',
  is_active BOOLEAN DEFAULT TRUE,
  special_notes TEXT,
  pre_order_price DECIMAL(10,2),
  min_order_quantity INT,
  max_order_quantity INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  
  INDEX idx_available_date (available_date),
  INDEX idx_pre_order_window (pre_order_start_time, pre_order_end_time),
  INDEX idx_vendor (vendor_id),
  INDEX idx_product (product_id)
);
```

### Migration 2: Create pre_orders

```sql
CREATE TABLE pre_orders (
  id VARCHAR(36) PRIMARY KEY,
  pre_order_number VARCHAR(50) UNIQUE NOT NULL,
  schedule_id VARCHAR(36) NOT NULL,
  customer_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  vendor_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  fulfillment_method ENUM('pickup', 'delivery') NOT NULL,
  delivery_address TEXT,
  delivery_phone VARCHAR(20),
  notes TEXT,
  status ENUM('pending_payment', 'paid', 'confirmed', 'ready', 'completed', 'cancelled') DEFAULT 'pending_payment',
  is_paid BOOLEAN DEFAULT FALSE,
  payment_id VARCHAR(36),
  pickup_time VARCHAR(50),
  completed_at TIMESTAMP,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (schedule_id) REFERENCES pre_order_schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  
  INDEX idx_customer (customer_id),
  INDEX idx_schedule (schedule_id),
  INDEX idx_vendor (vendor_id),
  INDEX idx_status (status)
);
```

---

## ✅ VALIDATION RULES

### Schedule Creation
- `preOrderStartTime` < `preOrderEndTime` < `availableDate`
- `scheduledStock` > 0
- `availableDate` must be in future
- Product must exist and belong to vendor

### Pre-Order Placement
- Schedule must be active
- Current time within pre-order window
- Requested quantity ≤ remaining stock
- Fulfillment method must be allowed

### Stock Management
- Decrement `remainingStock` on pre-order
- Increment `soldQuantity`
- Mark as sold out when `soldQuantity >= scheduledStock`
- Restore stock on cancellation (if before deadline)

---

## 🎨 UI/UX CONSIDERATIONS

### Visual Differentiation
- **Regular Products**: Green "Available" badge
- **Pre-Order Products**: Blue "Pre-Order" badge with date
- **Past Schedules**: Gray badge

### User Clarity
- Clear date/time display
- Countdown timer for urgency
- Remaining slots indicator
- Fulfillment method icons

### Mobile Optimization
- Touch-friendly date pickers
- Swipeable schedule cards
- Sticky pre-order button

---

## 📈 ANALYTICS & METRICS

### Vendor Metrics
- Pre-orders per schedule
- Revenue from pre-orders
- Popular pre-order dates
- Fulfillment method preferences

### Platform Metrics
- Total pre-orders placed
- Pre-order conversion rate
- Average pre-order value
- Customer repeat pre-orders

---

## ✅ SUCCESS CRITERIA

### Technical
- [ ] No breaking changes to existing system
- [ ] All existing tests pass
- [ ] Pre-order system isolated
- [ ] Performance maintained

### Business
- [ ] Vendors can schedule products
- [ ] Customers can pre-order
- [ ] Stock management accurate
- [ ] Payment flow works

### User Experience
- [ ] Intuitive for vendors
- [ ] Clear for customers
- [ ] Mobile-friendly
- [ ] Fast & responsive

---

**Status**: Design Complete - Ready for Implementation  
**Impact**: HIGH - Major feature addition  
**Risk**: LOW - Non-breaking, additive architecture  
**Estimated Dev Time**: 2-3 weeks (all phases)
