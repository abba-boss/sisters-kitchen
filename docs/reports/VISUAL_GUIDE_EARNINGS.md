# Visual Guide - New Earnings Page 🎨

## 📐 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER                                                          │
│ ┌─────────────────────────────┐  ┌────────────────────────┐   │
│ │ Earnings & Analytics        │  │ [💳 Withdraw Funds]   │   │
│ │ Track your revenue and      │  └────────────────────────┘   │
│ │ performance                 │                                │
│ └─────────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ DATE RANGE FILTER                                               │
│ 📅 Date Range:  [All Time] [Today] [Week] [Month] [Custom]    │
└─────────────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┐
│ 💰 GROSS │ % PLATFORM│ 📈 NET   │ 💳 AVAIL │
│ EARNINGS │ FEE      │ EARNINGS │ BALANCE  │
│ ₦245,000 │ ₦24,500  │ ₦220,500 │ ₦180,000 │
│ +12% ↗   │ 10% comm │ +15% ↗   │ Withdraw │
│ Blue     │ Orange   │ Green    │ Accent   │
└──────────┴──────────┴──────────┴──────────┘

┌──────────┬──────────┬──────────┬──────────┐
│ 📦 ITEMS │ 🛒 AVG   │ 👑 BEST  │ 📈 TOP   │
│ SOLD     │ ORDER    │ DAY      │ PRODUCT  │
│ 342 items│ ₦1,571   │ Saturday │ Jollof   │
│ Purple   │ Indigo   │ Yellow   │ Pink     │
└──────────┴──────────┴──────────┴──────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 📈 MONTHLY REVENUE                              [Export] ↓     │
│                                                                 │
│    ┌─ ₦150k ────────────────────────────●──────────────┐      │
│    │                                    ╱  ╲            │      │
│    │                         ●─────────╱    ╲           │      │
│    │              ●─────────╱                ╲●         │      │
│ ₦  │   ●─────────╱                            ╲        │      │
│    │  ╱                                        ╲       │      │
│    │ ╱ Revenue (Orange) ─────  Orders (Green) ──────  │      │
│    └───────────────────────────────────────────────────┘      │
│      Jan    Feb    Mar    Apr    May    Jun                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 💳 RECENT TRANSACTIONS                          View All →      │
│                                                                 │
│ Date       Order#         Gross    Fee      Net      Status    │
│ ─────────────────────────────────────────────────────────────  │
│ 2024-01-20 SK-2024-1234  ₦5,400  -₦540   ₦4,860   ✓ completed│
│ 2024-01-19 SK-2024-1233  ₦3,200  -₦320   ₦2,880   ✓ completed│
│ 2024-01-18 SK-2024-1232  ₦8,900  -₦890   ₦8,010   ✓ completed│
│ 2024-01-17 SK-2024-1231  ₦2,100  -₦210   ₦1,890   ⏳ pending │
│ 2024-01-16 SK-2024-1230  ₦6,700  -₦670   ₦6,030   ✓ completed│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🏦 WITHDRAWAL HISTORY                           View All →      │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ 💳  ₦125,000                              ✓ completed     │ │
│ │     GTBank ***1234                        2024-01-15      │ │
│ └───────────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ 💳  ₦98,000                               ✓ completed     │ │
│ │     GTBank ***1234                        2024-01-01      │ │
│ └───────────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ 💳  ₦156,000                              ✓ completed     │ │
│ │     GTBank ***1234                        2023-12-15      │ │
│ └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Scheme

### Earnings Cards Row:
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   💰 Blue   │  │  % Orange   │  │  📈 Green   │  │ 💳 Accent  │
│             │  │             │  │             │  │             │
│ Gross       │  │ Platform    │  │ Net         │  │ Available   │
│ Earnings    │  │ Fee         │  │ Earnings    │  │ Balance     │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
  #3B82F6         #FB923C          #10B981         #FF7A59
  (Primary $)     (Deduction)      (Your Money)    (Action)
```

### Performance Cards Row:
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  📦 Purple  │  │ 🛒 Indigo   │  │  👑 Yellow  │  │  📈 Pink    │
│             │  │             │  │             │  │             │
│ Items       │  │ Avg Order   │  │ Best        │  │ Top         │
│ Sold        │  │ Value       │  │ Day         │  │ Product     │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
  #A855F7         #6366F1          #EAB308         #EC4899
  (Quantity)      (Average)        (Peak)          (Winner)
```

---

## 📊 Data Flow Visual

```
ORDER RECEIVED
      │
      ↓
GROSS EARNINGS: ₦5,400 💰
      │
      ├─→ PLATFORM FEE: -₦540 (10%) 🏢
      │
      ↓
NET EARNINGS: ₦4,860 📈
      │
      ├─→ 80% = AVAILABLE: ₦3,888 (Can withdraw) ✅
      │
      └─→ 20% = PENDING: ₦972 (Locked until delivery) ⏳
```

---

## 🔢 Example Numbers Explained

### Sample Vendor (Mama Ngozi):

```
📊 PERIOD: Last 30 Days

REVENUE BREAKDOWN:
┌────────────────────────────────┐
│ Total Orders: 156 orders       │
│ Items Sold: 342 items          │
│ Avg: 2.19 items/order          │
└────────────────────────────────┘

EARNINGS FLOW:
┌────────────────────────────────┐
│ Gross Earnings:   ₦245,000.00 │  100%
│ Platform Fee:    -₦24,500.00  │  -10%
│ ─────────────────────────────  │
│ Net Earnings:     ₦220,500.00 │   90%
└────────────────────────────────┘

BALANCE SPLIT:
┌────────────────────────────────┐
│ Available Now:    ₦176,400.00 │   80% ✅ (Can withdraw)
│ Pending:          ₦44,100.00  │   20% ⏳ (Processing orders)
│ ─────────────────────────────  │
│ Total Net:        ₦220,500.00 │  100%
└────────────────────────────────┘

INSIGHTS:
┌────────────────────────────────┐
│ Avg Order Value: ₦1,570.51     │  (₦245k ÷ 156)
│ Best Day: Saturday (₦15,000)   │
│ Top Product: Jollof Rice       │
│ Total Withdrawn: ₦125,000      │
└────────────────────────────────┘
```

---

## 📱 Responsive Views

### Desktop (1440px):
```
┌─────┬─────┬─────┬─────┐  ← 4 columns (Earnings)
┌─────┬─────┬─────┬─────┐  ← 4 columns (Insights)
┌───────────────────────┐  ← Full width chart
┌───────────────────────┐  ← Full width table
```

### Tablet (768px):
```
┌─────┬─────┐  ← 2 columns
┌─────┬─────┐  ← 2 columns
┌─────┬─────┐  ← 2 columns
┌─────┬─────┐  ← 2 columns
┌─────────────┐  ← Chart
┌─────────────┐  ← Table
```

### Mobile (375px):
```
┌─────┬─────┐  ← 2 columns
┌─────┬─────┐
┌─────┬─────┐
┌─────┬─────┐
┌───────────┐  ← Chart (scrollable)
┌───────────┐  ← Table (horizontal scroll)
```

---

## 🎭 Interactive Elements

### Date Filter Buttons:
```
INACTIVE:               ACTIVE:
┌─────────┐            ┌─────────┐
│ All Time│ (gray)     │ All Time│ (orange)
└─────────┘            └─────────┘
```

### Withdraw Button States:
```
READY:                 DISABLED:              PROCESSING:
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│💳 Withdraw   │      │💳 Withdraw   │      │⏳ Processing │
│   Funds      │      │   Funds      │      │   ...        │
└──────────────┘      └──────────────┘      └──────────────┘
(Orange, clickable)   (Gray, can't click)   (Gray, loading)
```

### Transaction Row Hover:
```
NORMAL:
│ 2024-01-20  SK-2024-1234  ₦5,400  -₦540  ₦4,860  ✓ completed │

HOVER:
│ 2024-01-20  SK-2024-1234  ₦5,400  -₦540  ₦4,860  ✓ completed │
└─────────────────────────────────────────────────────────────────┘
(Light orange background)
```

---

## 💡 Visual Cues Guide

### Icons Meaning:
```
💰 = Money in (Revenue)
% = Fee/Commission (Deduction)
📈 = Profit (What you keep)
💳 = Action (Withdraw)
📦 = Inventory (Items sold)
🛒 = Transaction (Order value)
👑 = Achievement (Best performance)
📊 = Analytics (Top item)
✓ = Success (Completed)
⏳ = Waiting (Pending)
❌ = Failed (Error)
↗ = Growth (Positive trend)
↘ = Decline (Negative trend)
```

### Color Meaning:
```
🔵 Blue     = Primary information (Gross earnings)
🟠 Orange   = Deductions/Fees (Platform commission)
🟢 Green    = Profit/Success (Net earnings, completed)
🟡 Yellow   = Warning/Pending (Processing status)
🔴 Red      = Error/Negative (Failed, loss)
🟣 Purple   = Secondary info (Quantity)
🔷 Indigo   = Metrics (Averages)
🩷 Pink     = Highlights (Top items)
```

---

## 🎯 Visual Hierarchy

```
LEVEL 1: Page Header
└─ "Earnings & Analytics" (2xl, bold)

LEVEL 2: Date Filter
└─ Prominent card with buttons

LEVEL 3: Primary Cards (Earnings)
└─ Larger, bolder numbers
└─ Clear visual separation

LEVEL 4: Secondary Cards (Insights)
└─ Slightly smaller
└─ Different color palette

LEVEL 5: Chart
└─ Medium height (280px)
└─ Gradients for visual appeal

LEVEL 6: Tables
└─ Dense information
└─ Smaller text
└─ Hover effects
```

---

## 📐 Spacing System

```
Gap between sections:    24px (6 units)
Gap between cards:       16px (4 units)
Card padding:            20px (5 units)
Text spacing:            4-8px (1-2 units)
Icon size (cards):       18px
Icon size (buttons):     16px
Font sizes:
  - Heading:    24px (2xl)
  - Card value: 20px (xl)
  - Card label: 14px (sm)
  - Table text: 12px (xs)
```

---

## 🌟 Animation Timeline

```
Page Load:
0.0s  → Header appears
0.1s  → Date filter fades in
0.2s  → Card 1 (Gross) slides up
0.28s → Card 2 (Fee) slides up
0.36s → Card 3 (Net) slides up
0.44s → Card 4 (Available) slides up
0.6s  → Card 5 (Items) slides up
0.68s → Card 6 (Avg) slides up
0.76s → Card 7 (Best) slides up
0.84s → Card 8 (Top) slides up
1.0s  → Chart animates in
1.2s  → Tables fade in
```

---

## 🔍 Tooltips & Hints

### Chart Tooltip:
```
┌────────────────────┐
│ 2024-01             │
│ Revenue: ₦125,450  │
│ Orders: 78         │
└────────────────────┘
(Appears on hover)
```

### Card Subtexts:
```
Available Balance
₦180,000
─────────────────
Pending: ₦40,500 ← Shows locked amount
```

---

## 🎨 Complete Color Palette

```
Primary:        #FF7A59 (Orange)
Accent:         #FF7A59 (Same as primary)
Success:        #10B981 (Green)
Warning:        #F59E0B (Yellow)
Error:          #EF4444 (Red)

Card Backgrounds:
- Blue:         #DBEAFE (#3B82F6 icon)
- Orange:       #FED7AA (#FB923C icon)
- Green:        #D1FAE5 (#10B981 icon)
- Accent:       #FFF0E8 (#FF7A59 icon)
- Purple:       #F3E8FF (#A855F7 icon)
- Indigo:       #E0E7FF (#6366F1 icon)
- Yellow:       #FEF3C7 (#EAB308 icon)
- Pink:         #FCE7F3 (#EC4899 icon)

Text Colors:
- Dark:         #4A2C2A (brand-dark)
- Muted:        #8B6361 (brand-muted)
- Light:        #FFF0E8 (brand-bg)
```

---

## 📏 Dimensions Reference

```
CARDS:
- Height: Auto (content-based)
- Border Radius: 16px (rounded-2xl)
- Shadow: Subtle (0 1px 3px)

BUTTONS:
- Height: 40px (py-2.5)
- Border Radius: 24px (rounded-2xl)
- Padding: 16px 24px

TABLE:
- Row Height: 48px (py-3)
- Border: 1px #FFF0E8

CHART:
- Height: 280px
- Margin: 20px (card padding)
```

---

## 🎬 User Journey Visual

```
1. LAND ON PAGE
   ↓
   See: Big header + Withdraw button
   
2. SCAN EARNINGS
   ↓
   4 cards: Gross → Fee → Net → Available
   Understand: "I earned ₦245k, kept ₦220k, can withdraw ₦180k"
   
3. CHECK PERFORMANCE
   ↓
   4 cards: Items, Average, Best Day, Top Product
   Insight: "Sold 342 items, ₦1,571/order, best on Saturday"
   
4. SEE TREND
   ↓
   Chart: Revenue going up over 6 months
   Feeling: "Business is growing! 📈"
   
5. REVIEW TRANSACTIONS
   ↓
   Table: Last 5 orders with fee breakdown
   Note: "10% fee on each order"
   
6. CHECK WITHDRAWALS
   ↓
   History: Last withdrawal was ₦125k on Jan 15
   
7. TAKE ACTION
   ↓
   Click: "Withdraw Funds" button
   Result: Toast notification → Success! 🎉
```

---

## ✨ What Makes It Beautiful

### Visual Polish:
✓ Consistent spacing (everything aligned)
✓ Color harmony (complementary colors)
✓ Clear hierarchy (big → small)
✓ Visual balance (symmetrical layout)
✓ White space (not cluttered)

### Interaction Design:
✓ Hover feedback (things respond)
✓ Loading states (shows progress)
✓ Success notifications (confirms actions)
✓ Smooth animations (feels premium)
✓ Intuitive icons (self-explanatory)

### Information Design:
✓ Clear labels (no confusion)
✓ Logical grouping (related items together)
✓ Visual encoding (colors mean something)
✓ Progressive disclosure (details on demand)
✓ Scannable layout (easy to skim)

---

**This is what you'll see at:** `http://localhost:5174/vendor/earnings`

**Login as:** `mama.ngozi@sisterskitchen.ng` / `Vendor@2024`

🎨 **Enjoy the beautiful new earnings dashboard!**
