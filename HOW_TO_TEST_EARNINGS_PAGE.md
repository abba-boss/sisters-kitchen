# How to Test the New Earnings & Analytics Page 🧪

## 🌐 Access URLs

### Local Access:
```
http://localhost:5174
```

### Network Access (Phone/iPad):
```
http://192.168.1.75:5174
```

---

## 👤 Login Credentials

Use the **Vendor** account:
```
Email: mama.ngozi@sisterskitchen.ng
Password: Vendor@2024
```

---

## 🗺️ Navigation Path

1. Open browser → `http://localhost:5174`
2. Click **"Sign In"** (top right)
3. Enter vendor credentials above
4. Click **"Earnings"** in the sidebar
   - Or navigate to: `/vendor/earnings`

---

## ✅ What to Test

### 1. **Page Load** (5 seconds)
- [ ] Page loads without errors
- [ ] All 8 stat cards appear
- [ ] Date filter shows at top
- [ ] Chart renders properly
- [ ] Tables display with data

**Expected Result:**
```
✓ 4 Earnings cards (Blue, Orange, Green, Accent)
✓ 4 Performance cards (Purple, Indigo, Yellow, Pink)
✓ Revenue chart with gradient
✓ Transaction table with 5 rows
✓ Withdrawal history with 3 entries
```

---

### 2. **Date Range Filter** (2 minutes)

#### Test: Click "Today"
- [ ] All cards update
- [ ] Chart switches to "Daily Revenue"
- [ ] No errors in console

#### Test: Click "Last 7 Days"
- [ ] Cards show weekly data
- [ ] Chart shows daily bars (7 days)
- [ ] Smooth transition

#### Test: Click "Last 30 Days"
- [ ] Cards update
- [ ] Chart shows daily data (30 days)

#### Test: Click "All Time"
- [ ] Returns to default view
- [ ] Chart shows "Monthly Revenue"
- [ ] All historical data visible

#### Test: Click "Custom Range"
- [ ] Date pickers appear with animation
- [ ] Can select start date
- [ ] Can select end date
- [ ] Data filters when both dates selected

**Expected Behavior:**
```
Today/Week → Chart shows "Daily Revenue"
Month → Chart shows "Daily Revenue"  
All Time → Chart shows "Monthly Revenue"
```

---

### 3. **Earnings Cards** (1 minute)

Check the 4 main cards:

#### Card 1: Gross Earnings
- [ ] Shows total amount (e.g., ₦245,000)
- [ ] Has blue background icon (💰)
- [ ] Shows "+12%" trend with ↗ arrow
- [ ] Says "Total from orders" below

#### Card 2: Platform Fee
- [ ] Shows 10% of gross (e.g., ₦24,500)
- [ ] Has orange background icon (%)
- [ ] Says "10% commission" below
- [ ] No trend indicator

#### Card 3: Net Earnings
- [ ] Shows gross minus fee (e.g., ₦220,500)
- [ ] Has green background icon (📈)
- [ ] Shows "+15%" trend with ↗ arrow
- [ ] Says "After commission" below

#### Card 4: Available Balance
- [ ] Shows 80% of net (e.g., ₦180,000)
- [ ] Has accent/orange background icon (💳)
- [ ] Says "Ready to withdraw" below
- [ ] Shows pending amount at bottom

**Math Check:**
```
Gross: ₦245,000
Fee (10%): ₦24,500
Net: ₦220,500
Available (80%): ₦176,400
Pending (20%): ₦44,100
```

---

### 4. **Performance Cards** (1 minute)

Check the 4 insight cards:

#### Card 1: Items Sold
- [ ] Shows number (e.g., 342 items)
- [ ] Purple background icon (📦)
- [ ] Says "Total quantity"

#### Card 2: Avg Order Value
- [ ] Shows calculated amount (Total ÷ Orders)
- [ ] Indigo background icon (🛒)
- [ ] Says "Per order"

#### Card 3: Best Day
- [ ] Shows day name or date
- [ ] Yellow background icon (👑)
- [ ] Shows revenue for that day

#### Card 4: Top Product
- [ ] Shows product name (truncated if long)
- [ ] Pink background icon (📈)
- [ ] Shows quantity sold

---

### 5. **Revenue Chart** (2 minutes)

#### Visual Check:
- [ ] Chart has gradient fill (orange/red)
- [ ] X-axis shows dates/months clearly
- [ ] Y-axis shows ₦ amounts (e.g., ₦120k)
- [ ] Two lines: Revenue (orange) + Orders (green)
- [ ] Hover shows tooltip with exact values
- [ ] Legend at bottom shows both metrics

#### Interaction:
- [ ] Hover over data points
- [ ] Tooltip appears with:
  - Date/Month
  - Revenue: ₦X,XXX
  - Orders: X

#### Adaptive Behavior:
- [ ] "All Time" → Shows months (e.g., 2024-01, 2024-02)
- [ ] "Last 7 Days" → Shows days (e.g., 01-20, 01-21)
- [ ] Title changes: "Daily Revenue" vs "Monthly Revenue"

---

### 6. **Recent Transactions Table** (1 minute)

Check the table has:

#### Columns:
- [ ] Date (left aligned)
- [ ] Order # (e.g., SK-2024-1234)
- [ ] Gross (right aligned)
- [ ] Fee (right aligned, in orange/red)
- [ ] Net (right aligned, in green)
- [ ] Status (centered badge)

#### Rows:
- [ ] Shows 5 transactions
- [ ] Hover changes background (light orange)
- [ ] Status badges colored:
  - Green = completed
  - Yellow = pending

#### Top Right:
- [ ] "View All" link with → arrow
- [ ] Hover shows underline

---

### 7. **Withdrawal History** (1 minute)

Check the cards show:

#### Each Card:
- [ ] Icon: Credit card in green circle
- [ ] Amount: ₦XXX,XXX (bold)
- [ ] Bank: GTBank ***1234
- [ ] Status: Green badge "completed"
- [ ] Date: YYYY-MM-DD (gray text)
- [ ] Hover changes background to light orange

#### Layout:
- [ ] 3 withdrawal entries visible
- [ ] "View All" link at top
- [ ] Cards stacked vertically

---

### 8. **Withdraw Button** (1 minute)

#### Top Right Corner:
- [ ] Button says "Withdraw Funds"
- [ ] Has credit card icon (💳)
- [ ] Primary orange color

#### Click the Button:
- [ ] Button text changes to "Processing..."
- [ ] Button disabled during processing
- [ ] After 1.5 seconds:
  - [ ] Toast notification appears (green)
  - [ ] Says: "Withdrawal request submitted! You will receive payment within 2-3 business days."
  - [ ] Button returns to "Withdraw Funds"

#### Edge Case:
- If balance < ₦1,000:
  - [ ] Button is disabled
  - [ ] Grayed out appearance
  - [ ] Can't click

---

### 9. **Animations** (30 seconds)

#### On Page Load:
- [ ] Cards appear one by one (staggered)
- [ ] Smooth fade-in effect (0.08s delay between cards)

#### Date Filter Custom:
- [ ] Date pickers slide in from left
- [ ] Smooth transition

#### Hover Effects:
- [ ] Transaction rows highlight
- [ ] Withdrawal cards highlight
- [ ] Buttons show hover state

---

### 10. **Responsive Design** (2 minutes)

#### Desktop (> 1024px):
- [ ] 4 columns for earnings cards (single row)
- [ ] 4 columns for insight cards (single row)
- [ ] Full table visible
- [ ] Date filter horizontal

#### Tablet (640px - 1024px):
- [ ] 2 columns for all cards
- [ ] Table visible without scroll
- [ ] Comfortable spacing

#### Mobile (< 640px):
- [ ] 2 columns for cards
- [ ] Date buttons stack vertically
- [ ] Table scrolls horizontally
- [ ] Compact padding

**To Test:**
1. Press F12 (open DevTools)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Test different sizes:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1440px)

---

## 🐛 Console Errors Check

### Open Browser Console:
1. Press **F12**
2. Click **Console** tab
3. Look for errors (red text)

### Expected:
```
✓ No errors
✓ Maybe some warnings (acceptable)
✓ Hot reload messages (normal)
```

### If You See Errors:
Take a screenshot and note:
- Error message
- File name
- Line number

---

## 📊 Data Accuracy Tests

### Math Verification:

1. **Commission Check:**
   ```
   Platform Fee should = Gross × 0.10
   Example: ₦245,000 × 0.10 = ₦24,500 ✓
   ```

2. **Net Earnings Check:**
   ```
   Net should = Gross - Platform Fee
   Example: ₦245,000 - ₦24,500 = ₦220,500 ✓
   ```

3. **Balance Split:**
   ```
   Available + Pending should = Net
   Example: ₦176,400 + ₦44,100 = ₦220,500 ✓
   ```

4. **Average Order Value:**
   ```
   Should = Gross ÷ Total Orders
   Example: ₦245,000 ÷ 156 = ₦1,570.51 ✓
   ```

---

## 📸 Screenshot Checklist

Take screenshots of:

1. **Full Page View** (desktop)
2. **Earnings Cards** (all 4 visible)
3. **Performance Cards** (all 4 visible)
4. **Revenue Chart** (with tooltip)
5. **Transaction Table**
6. **Withdrawal History**
7. **Date Filter Active** (custom dates shown)
8. **Mobile View** (responsive layout)

---

## ⚡ Performance Check

### Page Load Speed:
- [ ] Page loads in < 2 seconds
- [ ] Cards appear in < 3 seconds
- [ ] Chart renders in < 4 seconds

### Interactions:
- [ ] Date filter responds instantly
- [ ] Hover effects are smooth (no lag)
- [ ] No freezing or stuttering

### Network Tab (F12 → Network):
- [ ] Only 1 API call to `/api/analytics/vendor`
- [ ] Response time < 500ms (with backend)
- [ ] No failed requests

---

## 🎯 Success Criteria

### Minimum Requirements:
✅ All 8 sections display
✅ No console errors
✅ Date filter works
✅ Chart shows data
✅ Tables display
✅ Withdraw button functional
✅ Mobile responsive

### Bonus Points:
✅ Animations smooth
✅ Colors vibrant
✅ Math accurate
✅ Fast load times
✅ Professional appearance

---

## 📝 Testing Report Template

```
# Earnings Page Test Report

Date: ___________
Tester: ___________
Browser: ___________ (Chrome/Firefox/Safari)
Device: ___________ (Desktop/Tablet/Mobile)

## Test Results

1. Page Load: ☐ Pass ☐ Fail
   Notes: ___________________________

2. Date Filter: ☐ Pass ☐ Fail
   Notes: ___________________________

3. Earnings Cards: ☐ Pass ☐ Fail
   Notes: ___________________________

4. Performance Cards: ☐ Pass ☐ Fail
   Notes: ___________________________

5. Revenue Chart: ☐ Pass ☐ Fail
   Notes: ___________________________

6. Transaction Table: ☐ Pass ☐ Fail
   Notes: ___________________________

7. Withdrawal History: ☐ Pass ☐ Fail
   Notes: ___________________________

8. Withdraw Button: ☐ Pass ☐ Fail
   Notes: ___________________________

9. Responsive Design: ☐ Pass ☐ Fail
   Notes: ___________________________

10. Performance: ☐ Pass ☐ Fail
    Notes: ___________________________

## Issues Found:
1. ___________________________
2. ___________________________
3. ___________________________

## Overall Status: ☐ Approved ☐ Needs Fixes

## Screenshots Attached: ☐ Yes ☐ No
```

---

## 🚀 Quick Test (2 Minutes)

If you're short on time, test these essentials:

1. ✅ Page loads without errors
2. ✅ All 8 cards visible
3. ✅ Date filter changes data
4. ✅ Chart displays properly
5. ✅ Withdraw button works
6. ✅ Mobile view works

---

## 🆘 Troubleshooting

### Issue: Page is blank
**Solution:**
1. Check browser console (F12)
2. Hard refresh: Ctrl+Shift+R
3. Clear cache and reload

### Issue: Date filter doesn't work
**Solution:**
1. Check console for errors
2. Try clicking "All Time" first
3. Then try other options

### Issue: Chart not showing
**Solution:**
1. Wait 5 seconds (might be loading)
2. Check if there's data
3. Try selecting different date range

### Issue: Withdraw button doesn't work
**Solution:**
1. Check if balance > ₦1,000
2. Look for console errors
3. Wait for toast notification (1.5s delay)

---

## ✨ Expected User Experience

### Vendor Opens Page:
1. Sees welcome header with withdraw button
2. Notices prominent date filter
3. Quickly scans 4 earnings cards
4. Understands: Gross → Fee → Net → Available
5. Sees performance insights below
6. Reviews revenue trend chart
7. Checks recent transaction details
8. Views withdrawal history

### Takes Action:
- Changes date to "Last 7 Days"
- All data updates instantly
- Reviews weekly performance
- Decides to withdraw available balance
- Clicks "Withdraw Funds"
- Sees success notification
- Feels confident and informed

---

## 🎉 What Success Looks Like

When testing is complete, you should see:

✅ **Professional Financial Dashboard**
- Clean, modern design
- Clear information hierarchy
- Easy to understand data

✅ **Functional Features**
- Date filtering works perfectly
- All calculations accurate
- Withdrawal system operational

✅ **Great User Experience**
- Fast and responsive
- Smooth animations
- Intuitive navigation
- Mobile-friendly

✅ **Business Value**
- Vendors understand their earnings
- Clear commission structure
- Easy withdrawal access
- Performance insights available

---

**Ready to Test?** 
Open `http://localhost:5174` and follow the checklist above! 🚀

**Questions During Testing?**
- Check console (F12) for errors
- Note any issues for fixing
- Take screenshots of problems
- Test on multiple browsers/devices

**Happy Testing! 🧪✨**
