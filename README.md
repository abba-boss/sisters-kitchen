# 🍽️ Sisters Kitchen

A social-first food community for home kitchens. Customers discover food through stories, recipes, and the people cooking it, then order contextually from a kitchen or dish without leaving the conversation.

## Product direction

The public experience is intentionally Feed-first:

- **Feed** (`/`) — stories, kitchen posts, recipes, availability updates, and offers.
- **Discover** (`/discover`) — cuisines, trending dishes, kitchens, and community topics.
- **Kitchens** (`/vendors`) — verified local kitchens and their social storefronts.
- **Dish** (`/products/:id`) — menu detail, reviews, and cart actions.
- **Saved stories** (`/saved`) — saved posts, separate from saved dishes (`/wishlist`).
- **Cart / Checkout / Orders** — contextual commerce surfaces, not top-level destinations.

There is no primary Shop destination. The legacy `/shop` URL redirects to `/products` for compatibility.

## Quick start

### Prerequisites

- Node.js 18+
- MySQL or MariaDB on port 3306

### Backend

```bash
cd backend
cp .env.example .env
# Fill in database, JWT, Cloudinary, and Paystack values.
npm install
mysql -u root -h 127.0.0.1 -e "CREATE DATABASE sisters_kitchen;"
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL and VITE_SOCKET_URL for your environment.
npm install
npm run dev
```

The API runs on `http://localhost:5000` and the Vite app on `http://localhost:5173` by default.

## Social and commerce capabilities

- Vendor-authored posts with photos, short video clips, tags, location, comments, likes, saves, and sharing.
- Vendor story rail with a full-screen story viewer (photo or video).
- Following feed backed by the Follower relationship.
- Search across post captions, tags, kitchen names, and linked dish names.
- Vendor post composer with optional dish attachment, up to 10 photos or videos, and scheduled publishing.
- Follow kitchens, save stories, comment, and review dishes.
- Contextual ordering from a post, kitchen profile, or dish page.
- Real-time order and post events through Socket.IO, including for signed-out visitors on the public feed.
- Vendor and admin workspaces for menus, posts, stories, orders, earnings, and reviews.
- Kitchen Coins ledger: earn on orders, reviews, follows, referrals, and daily check-ins; redeem 10 coins per ₦100 at checkout.
- Cart "save for later" shelf and per-item kitchen instructions that reach the vendor's order.

## Order and money rules

These are enforced server-side so the UI can never promise something the API does not do:

- **Pricing is authoritative on the server.** Item prices are read from the database; the client never sets totals.
- **Stock is reserved on order creation** with a conditional `UPDATE ... WHERE stock >= qty`. A failed reservation rolls the order back.
- **Cancelling restores stock** exactly once, using the stock level captured when the order was created.
- **Status transitions are validated** (`pending → confirmed → preparing → ready → out_for_delivery → delivered`, cancel allowed until delivery).
- **Vendor earnings use the order subtotal**, not the total, so the ₦500 delivery fee is never booked as vendor revenue.
- **Delivering an order** increments product sold counts and credits Kitchen Coins once.
- **Online payment is single-kitchen.** A cart spanning several kitchens falls back to Cash on Delivery instead of silently downgrading a Paystack selection.
- **Partial checkout failure is rolled back** — any order created before the failure is cancelled automatically.
- **One review per customer per dish or kitchen**, and the Kitchen Coins bonus is awarded once.

## Security notes

- `password`, `refreshToken`, password-reset OTP fields, and vendor payout details are `select: false` and never loaded by default.
- Every HTTP and Socket.IO response that crosses a trust boundary goes through `backend/src/utils/serializers.ts`, which strips credentials and bank details.
- Socket order rooms verify ownership before joining; guests may connect but only receive public feed events.
- Rate limiting runs before body parsing: 1000 reads and 200 writes per 15 minutes per IP, with a tighter limit on auth endpoints.
- Image uploads are validated by extension *and* MIME type, and are size-capped per route.
- `GET /api/followers/:vendorId/count` is public; only follow toggles require authentication.

## Safety and deployment notes

- `.env` files are ignored. Never commit credentials. Both `.env.example` files are committed and safe to copy.
- Rotate any Cloudinary, JWT, database, or Paystack credentials that were previously committed or shared.
- `SMTP_*` and `MAIL_FROM` must be set in production, otherwise password-reset codes are only written to the server log. `DEBUG_OTP=true` is for local development only.
- `DB_SYNC` defaults to schema synchronization **off**. Enable it only for local development; use reviewed migrations in production.
- `FRONTEND_URL` accepts a comma-separated list of origins. Paystack callbacks use the first entry.
- `frontend/vercel.json` and `frontend/public/_redirects` provide the SPA rewrite so deep links like `/posts/:id` do not 404 on static hosts.
- Public post DTOs are sanitized, and public vendor queries only expose approved kitchens.
- If `VITE_CLOUDINARY_*` is unset, the browser falls back to the authenticated `POST /api/uploads` endpoint instead of failing.

## Architecture

```text
sisters-kitchen/
├── backend/
│   └── src/
│       ├── config/         database.ts, socket.ts
│       ├── controllers/    auth, vendors, products, orders, payments,
│       │                   posts, stories, followers, rewards, admin
│       ├── entities/       User, Vendor, Product, Post, Story, Order,
│       │                   Follower, SavedPost, RewardWallet
│       ├── middleware/     auth, errorHandler, upload, validate
│       ├── routes/         one module per API domain
│       └── utils/          helpers, logger, mail, serializers, seeds
└── frontend/
    └── src/
        ├── components/
        │   ├── common/     auth, loading, cards, dialogs, notifications
        │   ├── layout/     Navbar, MainLayout, MobileBottomNav, DashboardLayout
        │   └── social/     FeedComposer, PostCard, StoriesBar, comments, follow
        ├── pages/
        │   ├── customer/   Products, ProductDetail, Vendors, Cart, Checkout,
        │   │               Orders, Wishlist, Profile, Rewards, auth pages
        │   ├── social/     FeedPage, DiscoverPage, SavedPostsPage, PostDetail
        │   ├── vendor/     dashboard, products, posts, stories, orders, hub
        │   └── admin/      dashboard, vendors, users, orders, analytics
        ├── hooks/          useAuth, useCart, useSocket
        ├── services/       api, auth, product, vendor, order, post, story,
        │                   follower, reward, payment, socket
        ├── store/          auth, cart, feed, wishlist, reward, notification,
        │                   createPost stores
        └── styles/         globals.css
```

## Useful commands

```bash
# Backend
cd backend && npm run build   # tsc, must be clean

# Frontend
cd frontend && npm run build
cd frontend && npm run lint    # 0 errors expected
```

The frontend production build, the frontend lint, and the backend TypeScript build are the required local release checks.

## Recovery branches

The recovery work is preserved on separate branches so `main` is never overwritten blindly:

- `next/social-feed-v2` — recovered `d2eb1d7` plus the social-first redesign and hardening.
- `recover/d6ead70` — the earlier complete feature implementation.
- `recovery/orphaned-feature-fixes` — later feature-fix commits rescued from the reflog.
- `backup/before-restore` — pre-restore working tree snapshot.

Open a pull request from `next/social-feed-v2` when you are ready to promote it.
