# 🍽️ Sisters Kitchen — Production-Ready Multi-Vendor Food Marketplace

A premium, full-stack food ordering platform with real-time features, analytics, payments, and more.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MySQL / MariaDB running on port 3306

### 1. Backend
```bash
cd backend
npm install
# Edit .env — set DB credentials, Cloudinary, Paystack keys
mysql -u root -h 127.0.0.1 -e "CREATE DATABASE sisters_kitchen;"
npm run seed      # Creates categories + demo accounts
npm run dev       # → http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev       # → http://localhost:5173
```

---

## 🔑 Demo Accounts

| Role     | Email                            | Password       |
|----------|----------------------------------|----------------|
| Admin    | admin@sisterskitchen.ng          | Admin@2024     |
| Vendor   | mama.ngozi@sisterskitchen.ng     | Vendor@2024    |
| Customer | customer@sisterskitchen.ng       | Customer@2024  |

---

## ✅ Completed Features (All 11 Phases)

### Phase 1 — Real-Time Order Management (Socket.IO)
- Live order status updates pushed to customers, vendors, admin
- Vendor dashboard flashes new orders instantly
- Order detail page shows live progress tracker with animated steps
- Admin dashboard updates order counts in real time
- Socket rooms: per-user, per-role, per-order

### Phase 2 — Notification System
- Real-time push notifications via Socket.IO
- In-app notification dropdown (bell icon in Navbar)
- Full notifications page with read/unread states
- Notifications for: order placed, confirmed, preparing, ready, delivered, cancelled, payments
- Vendor notifications: new order received
- Admin notifications: new orders

### Phase 3 — Payment System (Paystack)
- Paystack online payment with redirect flow
- Cash on Delivery option
- Payment verification endpoint
- Payment history page (`/payments`)
- Transaction receipts linked to orders
- Failed payment handling with user notification

### Phase 4 — Reviews & Ratings
- Product reviews with 1–5 star rating
- Vendor reviews on store page
- Rating distribution chart (bar chart per star level)
- Filter reviews by star rating
- Average rating auto-calculated and updated on product/vendor

### Phase 5 — Favorites & Wishlist
- Wishlist stored in Zustand + localStorage (offline-first)
- Favorite toggle on product cards and detail page
- Dedicated wishlist page (`/wishlist`)
- Server-side favorites API (for logged-in users)

### Phase 6 — Advanced Search & Filtering
- Search by product name / description
- Filter by category (pill navigation)
- Filter by price range (min/max)
- Sort by: Latest, Most Popular, Top Rated, Price Asc/Desc
- URL-driven filters (shareable links)
- Debounced vendor search

### Phase 7 — Vendor Store Pages
- Full store page with cover banner + logo
- Business hours + available days display
- Product tabs: All Menu / Featured / Fresh Today
- Vendor stats cards (products, orders, reviews)
- Integrated vendor review form + reviews list
- Store open/closed status badge

### Phase 8 — Analytics Dashboards
- **Vendor:** monthly revenue chart, daily revenue bar chart, top 5 products, order status pie chart, summary KPIs
- **Admin:** platform revenue, user growth chart, top vendors table, orders by status pie, monthly trend

### Phase 9 — Image Management (Cloudinary)
- Product images (up to 5 per product)
- Vendor logo + cover image upload
- Image preview before upload
- Local file cleanup after Cloudinary upload
- Multer file validation (images only, 5MB max)

### Phase 10 — Professional UI/UX
- Warm brand palette: `#FF7A59` primary, `#FFF6EE` background, `#4A2C2A` dark, `#5FA36A` accent
- Poppins + DM Sans typography
- Loading skeletons on all data-fetching views
- Empty states with contextual CTAs
- Framer Motion animations throughout
- Mobile-first responsive design
- Code-split bundles for fast load times

### Phase 11 — Security & Performance
- Rate limiting: 500 req/15min global, 20 req/15min on auth routes
- Input validation with `express-validator` on all mutation endpoints
- JWT access + refresh token rotation
- Role-based route guards (Customer / Vendor / Admin)
- Helmet security headers
- Morgan request logging
- Winston structured logging to files
- Bundle code splitting (9 chunks, largest ~382KB)
- TypeScript strict mode on backend

---

## 🏗 Architecture

```
sisters-kitchen/
├── backend/
│   └── src/
│       ├── config/         database.ts, socket.ts, cloudinary.ts
│       ├── controllers/    auth, vendor, product, category,
│       │                   order, review, favorite, notification,
│       │                   payment, analytics, admin
│       ├── entities/       User, Vendor, Product, Category, Order,
│       │                   OrderItem, Payment, Review, Favorite, Notification
│       ├── middleware/      auth, errorHandler, upload, validate
│       ├── routes/         (one file per module)
│       └── utils/          helpers, logger, seed
│
└── frontend/
    └── src/
        ├── components/
        │   ├── common/     ProductCard, VendorCard, StarRating,
        │   │               LoadingSkeleton, EmptyState, Pagination,
        │   │               NotificationDropdown, OrderStatusTimeline,
        │   │               ProtectedRoute
        │   ├── customer/   HeroSection, CategorySection, FeaturedVendors,
        │   │               FeaturedProducts, HowItWorks, Testimonials, CTASection
        │   └── layout/     Navbar, Footer, MainLayout, DashboardLayout
        ├── pages/
        │   ├── customer/   Home, Products, ProductDetail, Vendors,
        │   │               VendorProfile, Cart, Checkout, Orders,
        │   │               OrderDetail, Wishlist, Notifications,
        │   │               PaymentHistory, PaymentVerify, Profile,
        │   │               Login, Register
        │   ├── vendor/     Dashboard, Products, ProductForm, Orders,
        │   │               Earnings, Reviews, Profile
        │   └── admin/      Dashboard, Vendors, Users, Orders, Analytics
        ├── hooks/          useAuth, useCart, useSocket, useSocketEvent
        ├── services/       api, auth, product, vendor, order, review,
        │                   category, notification, payment, socket
        ├── store/          authStore, cartStore, wishlistStore, notificationStore
        └── utils/          formatters
```

---

## 🌐 API Reference

| Module        | Endpoints                                                |
|---------------|----------------------------------------------------------|
| Auth          | POST /register, POST /login, GET /me, PUT /profile       |
| Products      | GET /, GET /:id, GET /featured, GET /fresh-today         |
| Vendors       | GET /, GET /:id, GET /my-profile, PUT /my-profile        |
| Orders        | POST /, GET /my-orders, GET /vendor-orders, PATCH /:id/status |
| Payments      | POST /initialize, GET /verify/:ref, GET /my-payments     |
| Reviews       | POST /, GET /product/:id, GET /vendor/:id                |
| Favorites     | POST /toggle, GET /                                      |
| Notifications | GET /, PATCH /:id/read, PATCH /read-all                  |
| Analytics     | GET /vendor, GET /admin                                  |
| Admin         | GET /dashboard, GET /users, GET /vendors                 |

---

## ⚙️ Environment Variables

### backend/.env
```
PORT=5000
DB_HOST=127.0.0.1 | DB_PORT=3306 | DB_USERNAME=root | DB_PASSWORD= | DB_NAME=sisters_kitchen
JWT_SECRET=... | JWT_REFRESH_SECRET=...
CLOUDINARY_CLOUD_NAME=... | CLOUDINARY_API_KEY=... | CLOUDINARY_API_SECRET=...
PAYSTACK_SECRET_KEY=... | PAYSTACK_PUBLIC_KEY=...
FRONTEND_URL=http://localhost:5173
```

### frontend/.env
```
VITE_API_URL=http://localhost:5000/api
```
