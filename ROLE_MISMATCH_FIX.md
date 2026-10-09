# Access Denied Error - Role Mismatch Fix 🔒

## Problem
You're getting `{success: false, message: "Access denied"}` error.

## Cause
You're logged in as a **Customer** but trying to access **Vendor-only** pages like:
- `/vendor/dashboard`
- `/vendor/profile`
- `/vendor/products`
- etc.

---

## Solutions

### **Solution 1: Login as Vendor** ✅

#### Steps:
1. **Logout** from your current account
2. **Register a new vendor account:**
   - Go to `/register`
   - Select "Vendor" role
   - Fill in business details
   - Submit registration

3. **Wait for admin approval** (or manually approve in database)
4. **Login** with your vendor credentials
5. Access vendor pages

---

### **Solution 2: Check Your Current Role** 🔍

Open browser console and check:
```javascript
// Check localStorage
console.log(JSON.parse(localStorage.getItem('user')));

// Should show something like:
// { role: 'customer', ... } or { role: 'vendor', ... }
```

---

### **Solution 3: Create Test Vendor Account via Database** 💻

If you need quick access for testing:

```sql
-- 1. Find your user ID
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';

-- 2. Update role to vendor
UPDATE users SET role = 'vendor' WHERE email = 'your-email@example.com';

-- 3. Create vendor profile
INSERT INTO vendors (userId, businessName, status, isOpen) 
VALUES ('your-user-id', 'Test Kitchen', 'approved', true);
```

Then **logout and login again** to refresh your token.

---

### **Solution 4: Change Role in Frontend (Temporary)** ⚠️

**WARNING: This only changes the UI, backend will still block you!**

This is NOT a real fix but helps you see the UI:

```javascript
// In browser console
const user = JSON.parse(localStorage.getItem('user'));
user.role = 'vendor';
localStorage.setItem('user', JSON.stringify(user));
window.location.reload();
```

**Note:** Backend will still return "Access denied" - this is just for UI testing.

---

## How to Test Vendor Features Properly

### **1. Register as Vendor**
1. Go to homepage
2. Click "Become a Vendor" in sidebar (if logged in as customer)
3. Or go directly to `/register?role=vendor`
4. Fill vendor registration form
5. Submit

### **2. Admin Approval**
Your vendor account needs admin approval. Two options:

**Option A: Auto-approve in code (for development)**
Update `backend/src/controllers/authController.ts`:
```typescript
// In register function
const newVendor = vendorRepo.create({
  user: newUser,
  businessName: body.businessName,
  status: 'approved', // Change from 'pending' to 'approved'
  // ...
});
```

**Option B: Manually approve in database**
```sql
UPDATE vendors SET status = 'approved' WHERE id = 'vendor-id';
```

### **3. Login and Test**
- Logout
- Login with vendor credentials
- Access `/vendor/dashboard`
- Should work! ✅

---

## Understanding User Roles

### **Customer Role**
Can access:
- ✅ Browse products
- ✅ View vendors
- ✅ Add to cart
- ✅ Place orders
- ✅ Write reviews
- ✅ View feed
- ✅ Profile settings

Cannot access:
- ❌ Vendor dashboard
- ❌ Vendor profile settings
- ❌ Product management
- ❌ Order management (vendor side)
- ❌ Earnings page

### **Vendor Role**
Can access:
- ✅ All customer features PLUS
- ✅ Vendor dashboard
- ✅ Product management
- ✅ Order management
- ✅ Vendor profile settings
- ✅ Earnings tracking
- ✅ Reviews management
- ✅ Posts management

Cannot access:
- ❌ Admin dashboard
- ❌ Admin features

### **Admin Role**
Can access:
- ✅ Everything
- ✅ Admin dashboard
- ✅ User management
- ✅ Vendor approval
- ✅ System analytics

---

## Quick Test Account Creation

### **Create Test Vendor via API**

Using Postman or curl:

```bash
# 1. Register vendor
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Vendor",
    "email": "vendor@test.com",
    "password": "password123",
    "phone": "+234 800 000 0000",
    "role": "vendor",
    "businessName": "Test Kitchen"
  }'

# 2. Approve vendor in database
# (or update auto-approve setting)

# 3. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendor@test.com",
    "password": "password123"
  }'
```

---

## Fixing Auto-Approve for Development

To speed up testing, make vendors auto-approved:

### **Update Auth Controller**

File: `backend/src/controllers/authController.ts`

```typescript
// Around line 80-90, in the register function
if (role === "vendor") {
  const vendorRepo = AppDataSource.getRepository(Vendor);
  const newVendor = vendorRepo.create({
    user: newUser,
    businessName: body.businessName,
    description: body.description,
    address: body.address,
    phone: body.phone,
    status: "approved", // ⬅️ CHANGE THIS from 'pending' to 'approved'
    isOpen: true,
  });
  await vendorRepo.save(newVendor);
}
```

Rebuild backend:
```bash
cd backend
npm run build
npm start
```

Now all new vendors are automatically approved! 🎉

---

## Current State Check

Run this in your browser console to see what's happening:

```javascript
// Check if you're logged in
const token = localStorage.getItem('token');
console.log('Token:', token ? 'Present ✅' : 'Missing ❌');

// Check your role
const user = JSON.parse(localStorage.getItem('user'));
console.log('Role:', user?.role || 'Not logged in');
console.log('Email:', user?.email || 'N/A');

// Check which page you're on
console.log('Current page:', window.location.pathname);
```

---

## Status: ℹ️ INFO

**The error is expected behavior!** It's protecting vendor-only routes from unauthorized access.

**To fix:** Login with a vendor account or create one following the steps above.

**For development:** Enable auto-approve for faster testing.
