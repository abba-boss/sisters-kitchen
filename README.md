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

- Vendor-authored posts with photos, tags, location, comments, likes, saves, and sharing.
- Vendor story rail with a full-screen story viewer.
- Following feed backed by the Follower relationship.
- Search across post captions, tags, kitchen names, and linked dish names.
- Vendor post composer with optional dish attachment and image uploads.
- Follow kitchens, save stories, comment, and review dishes.
- Contextual ordering from a post, kitchen profile, or dish page.
- Real-time order and post events through Socket.IO.
- Vendor and admin workspaces for menus, posts, stories, orders, earnings, and reviews.
- Kitchen Coins ledger and rewards history.

## Safety and deployment notes

- `.env` files are ignored. Never commit credentials.
- Rotate any Cloudinary, JWT, database, or Paystack credentials that were previously committed or shared.
- Set `DEBUG_OTP=true` only for local development. Production password-reset flows must use a real mail provider.
- `DB_SYNC` and `synchronize` are development conveniences. Use reviewed migrations for production schema changes.
- Socket.IO CORS uses `FRONTEND_URL` in addition to local development origins.
- Public post DTOs are sanitized, and public vendor queries only expose approved kitchens.

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
│       └── utils/          helpers, logger, mail, seeds
└── frontend/
    └── src/
        ├── components/
        │   ├── common/     auth, loading, cards, dialogs, notifications
        │   ├── customer/   catalog, kitchen profile, cart, checkout
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
cd backend && npm run build

# Frontend
cd frontend && npm run build
cd frontend && npm run lint
```

The frontend production build and backend TypeScript build are the required local release checks.

## Recovery branches

The recovery work is preserved on separate branches so `main` is never overwritten blindly:

- `next/social-feed-v2` — recovered `d2eb1d7` plus the social-first redesign and hardening.
- `recover/d6ead70` — the earlier complete feature implementation.
- `recovery/orphaned-feature-fixes` — later feature-fix commits rescued from the reflog.
- `backup/before-restore` — pre-restore working tree snapshot.

Open a pull request from `next/social-feed-v2` when you are ready to promote it.
