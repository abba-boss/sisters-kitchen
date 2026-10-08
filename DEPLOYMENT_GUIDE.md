# 🚀 Sisters Kitchen - Deployment Guide

**Last Updated:** October 7, 2026  
**App Status:** 99% Production Ready

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:
- [ ] All code committed to Git
- [ ] Environment variables documented
- [ ] Database schema finalized
- [ ] API endpoints tested
- [ ] Frontend builds successfully
- [ ] Backend builds successfully

---

## 🏗️ Architecture Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │────────>│   Backend   │────────>│   Database  │
│  (React)    │         │  (Express)  │         │   (MySQL)   │
│  Vercel/    │         │  Railway/   │         │  PlanetScale│
│  Netlify    │         │  Heroku     │         │  /AWS RDS   │
└─────────────┘         └─────────────┘         └─────────────┘
       │                       │
       │                       │
       ├───────────────────────┤
       │    Cloudinary (Images)│
       └───────────────────────┘
```

---

## 1️⃣ Database Deployment

### Option A: PlanetScale (Recommended)

**Why PlanetScale:**
- Free tier available
- Serverless MySQL
- Auto-scaling
- No cold starts

**Setup:**
```bash
# 1. Sign up at https://planetscale.com

# 2. Create database
planetscale database create sisters-kitchen --region us-east

# 3. Get connection string
planetscale connect sisters-kitchen main --execute "SELECT 1"

# 4. Update .env with connection details
DB_HOST=xxx.planetscale.com
DB_USERNAME=xxx
DB_PASSWORD=xxx
DB_NAME=sisters-kitchen
```

### Option B: Railway MySQL
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Create MySQL instance
railway up
railway add mysql

# 3. Get credentials
railway variables
```

### Option C: AWS RDS
```bash
# 1. Create RDS MySQL instance
# 2. Configure security groups
# 3. Get connection string
# 4. Update .env
```

---

## 2️⃣ Backend Deployment

### Option A: Railway (Recommended)

**Why Railway:**
- Easy deployment
- Free tier
- Auto-deploy from Git
- Environment variables UI

**Steps:**
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Navigate to backend
cd backend

# 4. Initialize
railway init

# 5. Link to project
railway link

# 6. Add environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-secret-key
railway variables set DB_HOST=your-db-host
railway variables set DB_USERNAME=your-db-user
railway variables set DB_PASSWORD=your-db-password
railway variables set DB_NAME=sisters-kitchen
railway variables set CLOUDINARY_CLOUD_NAME=your-cloud
railway variables set CLOUDINARY_API_KEY=your-key
railway variables set CLOUDINARY_API_SECRET=your-secret
railway variables set PAYSTACK_SECRET_KEY=your-paystack-key
railway variables set FRONTEND_URL=https://your-frontend.vercel.app

# 7. Deploy
railway up

# 8. Get URL
railway domain
```

**Railway Dashboard:**
- Go to https://railway.app
- View logs
- Monitor usage
- Update environment variables

---

### Option B: Heroku

**Steps:**
```bash
# 1. Install Heroku CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Create app
cd backend
heroku create sisters-kitchen-api

# 4. Add buildpack
heroku buildpacks:set heroku/nodejs

# 5. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
# ... all other env vars

# 6. Deploy
git push heroku main

# 7. Check logs
heroku logs --tail
```

---

### Option C: Render

**Steps:**
1. Go to https://render.com
2. Connect GitHub repo
3. Select backend folder
4. Set build command: `npm install && npm run build`
5. Set start command: `npm start`
6. Add environment variables in dashboard
7. Deploy

---

## 3️⃣ Frontend Deployment

### Option A: Vercel (Recommended)

**Why Vercel:**
- Optimized for React
- Free tier
- Auto-deploy from Git
- Fast global CDN
- Environment variables UI
- Perfect for lazy-loaded apps

**Steps:**
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to frontend
cd frontend

# 3. Login
vercel login

# 4. Deploy
vercel

# 5. Set environment variable
vercel env add VITE_API_URL production
# Enter: https://your-backend-url.railway.app/api

# 6. Deploy to production
vercel --prod
```

**Vercel Dashboard:**
- Go to https://vercel.com
- View deployments
- Monitor analytics
- Update environment variables
- Custom domain setup

**Custom Domain:**
```bash
# Add domain
vercel domains add your-domain.com

# DNS Settings (at your domain registrar):
A Record:  @ → 76.76.21.21
CNAME:     www → cname.vercel-dns.com
```

---

### Option B: Netlify

**Steps:**
```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Navigate to frontend
cd frontend

# 3. Build
npm run build

# 4. Deploy
netlify deploy --prod --dir=dist

# 5. Set environment variable
netlify env:set VITE_API_URL https://your-backend-url.railway.app/api
```

---

### Option C: GitHub Pages + Cloudflare

**Steps:**
1. Build frontend: `npm run build`
2. Deploy dist folder to GitHub Pages
3. Add Cloudflare CDN for speed
4. Configure environment variables

---

## 4️⃣ Environment Variables

### Backend (.env)

**Required:**
```bash
# Server
NODE_ENV=production
PORT=5000

# Database
DB_HOST=your-db-host.planetscale.com
DB_PORT=3306
DB_USERNAME=your-username
DB_PASSWORD=your-strong-password
DB_NAME=sisters_kitchen

# JWT Authentication
JWT_SECRET=your-very-long-random-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Paystack (Payment)
PAYSTACK_SECRET_KEY=sk_live_your-paystack-secret-key
PAYSTACK_PUBLIC_KEY=pk_live_your-paystack-public-key

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend.vercel.app
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### Frontend (.env)

**Required:**
```bash
# API URL
VITE_API_URL=https://your-backend-url.railway.app/api

# Paystack Public Key
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your-paystack-public-key
```

---

## 5️⃣ Database Migration

**Before first deploy, run migrations:**

```bash
# Option 1: TypeORM CLI
npm run typeorm migration:run

# Option 2: SQL file
mysql -h your-db-host -u your-user -p sisters_kitchen < schema.sql

# Option 3: Manual (in production database)
# Run all entity creation manually
```

**Seed Initial Data:**
```bash
# Run seed script
npm run seed

# Or manually insert:
# - Admin user
# - Categories
# - Sample vendors (optional)
```

---

## 6️⃣ Cloudinary Setup

**Get Credentials:**
1. Sign up at https://cloudinary.com
2. Go to Dashboard
3. Copy:
   - Cloud Name
   - API Key
   - API Secret
4. Add to backend environment variables

**Settings:**
- Enable unsigned uploads: No (use signed)
- Auto backup: Yes
- Optimization: Auto
- Format: Auto

---

## 7️⃣ Paystack Setup

**Get Credentials:**
1. Sign up at https://paystack.com
2. Go to Settings → API Keys
3. Copy:
   - Public Key (for frontend)
   - Secret Key (for backend)
4. Add to environment variables

**Test Mode:**
- Use test keys for staging
- Use live keys for production

**Webhook URL:**
```
https://your-backend-url.railway.app/api/payments/webhook
```

---

## 8️⃣ Post-Deployment Checklist

### Backend Health Check:
- [ ] Visit `https://your-backend.railway.app/health`
- [ ] Should return: `{"status":"ok"}`

### Database Check:
- [ ] Connect to database
- [ ] Verify tables created
- [ ] Check admin user exists

### API Test:
```bash
# Test authentication
curl https://your-backend.railway.app/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password"}'
```

### Frontend Check:
- [ ] Visit homepage
- [ ] Check console for errors
- [ ] Test login
- [ ] Test product browsing
- [ ] Test cart
- [ ] Test checkout

---

## 9️⃣ Monitoring Setup

### Backend Monitoring:

**Railway:**
- Built-in logs
- Resource usage
- Deployment history

**Optional: Sentry**
```bash
npm install @sentry/node

# In backend/src/index.ts
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: "your-sentry-dsn" });
```

### Frontend Monitoring:

**Vercel Analytics:**
- Enabled by default
- Web Vitals
- Pageview tracking

**Optional: Google Analytics**
```html
<!-- In frontend/index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

---

## 🔟 Domain Setup

### Custom Domain (e.g., sisterskitchen.com)

**Steps:**
1. Buy domain (Namecheap, Google Domains)
2. Add to Vercel/Netlify
3. Update DNS records:

```
Type    Name    Value
A       @       76.76.21.21 (Vercel IP)
CNAME   www     cname.vercel-dns.com
```

4. Wait for DNS propagation (up to 24 hours)
5. Enable SSL (automatic)

---

## 1️⃣1️⃣ SSL/HTTPS

**All recommended hosts provide free SSL:**
- Vercel: Automatic
- Netlify: Automatic
- Railway: Automatic
- Heroku: Automatic

**No configuration needed!** ✅

---

## 1️⃣2️⃣ Scaling Considerations

### When to Scale:

**Database:**
- 100+ concurrent users → Upgrade tier
- 10,000+ products → Optimize queries
- Slow queries → Add indexes

**Backend:**
- High CPU usage → Scale instances
- Memory issues → Upgrade RAM
- API slowness → Add caching (Redis)

**Frontend:**
- Already optimized with lazy loading!
- CDN handles traffic automatically

---

## 1️⃣3️⃣ Backup Strategy

**Database Backups:**
```bash
# Daily backups (automated by PlanetScale)
# Or manual:
mysqldump -h host -u user -p database > backup.sql
```

**Code Backups:**
- Git repository (GitHub/GitLab)
- Automatic with every commit

**Images Backups:**
- Cloudinary handles backups
- Enable auto-backup in settings

---

## 1️⃣4️⃣ Cost Estimation

### Free Tier (Good for MVP/Testing):
```
Database:     PlanetScale Free    →  $0/month
Backend:      Railway Free        →  $0/month (500 hours)
Frontend:     Vercel Free         →  $0/month
Images:       Cloudinary Free     →  $0/month (25GB)
Payments:     Paystack            →  1.5% + ₦100 per transaction

Total Fixed:  $0/month
Per Transaction: ~1.5%
```

### Paid Tier (Production):
```
Database:     PlanetScale Scaler →  $29/month
Backend:      Railway Pro         →  $10/month
Frontend:     Vercel Pro          →  $20/month
Images:       Cloudinary Plus     →  $99/month
Domain:       .com domain         →  $12/year

Total:        ~$160/month
```

---

## 1️⃣5️⃣ Troubleshooting

### Common Issues:

**Backend won't start:**
```bash
# Check logs
railway logs

# Common causes:
# - Missing environment variables
# - Database connection failed
# - Port already in use
```

**Frontend shows "Network Error":**
```bash
# Check:
# 1. VITE_API_URL is correct
# 2. Backend is running
# 3. CORS is configured
# 4. API health check works
```

**Database connection failed:**
```bash
# Check:
# 1. DB credentials are correct
# 2. DB host is reachable
# 3. Whitelist IP (if needed)
# 4. Database exists
```

---

## 1️⃣6️⃣ Deployment Commands Summary

**Quick Deploy (All Services):**
```bash
# Backend (Railway)
cd backend
railway up

# Frontend (Vercel)
cd frontend
vercel --prod
```

**Quick Rollback:**
```bash
# Railway: Use dashboard to redeploy previous version
# Vercel: vercel rollback [deployment-url]
```

---

## ✅ Final Checklist

Before announcing launch:
- [ ] All services deployed
- [ ] Custom domain configured
- [ ] SSL enabled
- [ ] Environment variables set
- [ ] Database migrated
- [ ] Test data seeded
- [ ] Admin user created
- [ ] Payment gateway tested
- [ ] Email notifications working
- [ ] All features tested in production
- [ ] Mobile tested
- [ ] Performance checked
- [ ] SEO verified
- [ ] Analytics setup
- [ ] Monitoring active
- [ ] Backups configured

---

## 🎉 Launch!

**You're ready to launch when:**
✅ Checklist complete
✅ No critical bugs
✅ Performance is good
✅ All features work

**Announce on:**
- Social media
- Product Hunt
- Local communities
- WhatsApp
- Instagram

**Monitor first 24 hours:**
- Check logs frequently
- Watch for errors
- Monitor performance
- Respond to user feedback

---

## 📞 Support Resources

**Documentation:**
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- PlanetScale: https://planetscale.com/docs

**Community:**
- Railway Discord
- Vercel Discord
- Stack Overflow

---

## 🎊 Congratulations!

**Sisters Kitchen is now deployed and live!** 🚀

**You built:**
- Multi-vendor marketplace
- Social commerce platform
- Real-time notifications
- Payment integration
- Admin dashboard
- Vendor management
- And much more!

**You're ready to:**
- Acquire users
- Generate revenue
- Scale the platform
- Build features

**Good luck with your launch!** 🎉

---

**END OF DEPLOYMENT GUIDE**
