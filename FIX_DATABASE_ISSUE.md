# Fix: Products Not Fetching - Database Migration Required

## Problem
The backend is trying to query new fields (`pickupLatitude`, `pickupLongitude`, `pickupInstructions`) that don't exist in your database yet.

**Error**: `Unknown column 'Story__Story_vendor.pickupLatitude' in 'field list'`

## Solution: Run Database Migration

### Option 1: Using MySQL Command Line (Recommended)

```bash
# 1. Make sure MySQL is running
sudo systemctl start mysql
# OR on some systems:
sudo service mysql start

# 2. Run the migration file
mysql -u root sisters_kitchen < MIGRATION_SELF_PICKUP.sql

# If you have a password:
mysql -u root -p sisters_kitchen < MIGRATION_SELF_PICKUP.sql
```

### Option 2: Using phpMyAdmin or MySQL Workbench

1. Open phpMyAdmin or MySQL Workbench
2. Select database: `sisters_kitchen`
3. Go to SQL tab
4. Copy and paste this:

```sql
-- Add pickup location fields to vendors table
ALTER TABLE vendors 
ADD COLUMN pickupLatitude DECIMAL(10,7) NULL,
ADD COLUMN pickupLongitude DECIMAL(10,7) NULL,
ADD COLUMN pickupInstructions TEXT NULL;

-- Add fulfillment type and pickup fields to orders table
ALTER TABLE orders
ADD COLUMN fulfillmentType ENUM('delivery', 'pickup') DEFAULT 'delivery' NOT NULL,
ADD COLUMN pickupToken VARCHAR(255) NULL UNIQUE,
ADD COLUMN pickupVerifiedAt TIMESTAMP NULL,
ADD COLUMN pickupVerifiedBy VARCHAR(255) NULL;
```

5. Click "Execute" or "Run"

### Option 3: Let TypeORM Auto-Sync (Easiest)

If your backend has `synchronize: true` in TypeORM config:

```bash
# Just restart the backend
cd backend
npm start
```

TypeORM will automatically add the missing columns!

---

## After Migration

### 1. Restart Backend
```bash
cd backend
npm start
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Test It
- Open browser: `http://localhost:5173`
- Products should load now! ✅
- Stories should work ✅
- Everything should be back to normal ✅

---

## Quick Check

To verify the migration worked:

```bash
mysql -u root sisters_kitchen -e "DESCRIBE vendors;"
```

You should see the new columns:
- `pickupLatitude`
- `pickupLongitude`
- `pickupInstructions`

```bash
mysql -u root sisters_kitchen -e "DESCRIBE orders;"
```

You should see:
- `fulfillmentType`
- `pickupToken`
- `pickupVerifiedAt`
- `pickupVerifiedBy`

---

## Why This Happened

When I added the self-pickup feature, I updated the TypeScript entity files (Vendor.ts and Order.ts) but the database still has the old schema. The migration adds the missing columns so everything works.

---

## Need Help?

If MySQL won't start:
```bash
# Check MySQL status
sudo systemctl status mysql

# Start MySQL
sudo systemctl start mysql

# Enable MySQL to start on boot
sudo systemctl enable mysql
```

If you get "Access Denied":
```bash
# Try with sudo
sudo mysql sisters_kitchen < MIGRATION_SELF_PICKUP.sql
```

---

## What's Next?

After the migration:
1. ✅ Products will load
2. ✅ All pages will work
3. ✅ Self-pickup feature ready to test
4. Follow [SELF_PICKUP_QUICK_START.md](./SELF_PICKUP_QUICK_START.md) for testing
