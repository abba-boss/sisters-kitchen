# 📧 Email Service Setup Guide for Sisters Kitchen

## Why This is Critical

Currently, your application uses **Ethereal Email** (a test service). This means:
- ❌ Customers DON'T receive order confirmations
- ❌ Vendors DON'T receive new order alerts
- ❌ NO status update emails are sent
- ❌ Password reset emails don't work

**This guide will fix that in 15 minutes.**

---

## Choose Your Email Provider

### Option 1: SendGrid (Recommended - Easiest) ⭐

**Why**: Industry standard, free forever tier, excellent documentation

**Free Tier**: 100 emails/day (3,000/month) - Perfect for starting out  
**Paid Tier**: $19.95/month for 50,000 emails (when you grow)

#### Setup Steps:

1. **Sign up**: Go to [https://sendgrid.com/free](https://sendgrid.com/free)
   - Use your business email
   - Verify your email address

2. **Verify Sender**:
   - Go to Settings > Sender Authentication
   - Click "Verify a Single Sender"
   - Enter your email (the one customers will see emails from)
   - Check your inbox and verify

3. **Create API Key**:
   - Go to Settings > API Keys
   - Click "Create API Key"
   - Name it: "Sisters Kitchen Production"
   - Choose "Full Access"
   - Copy the key (YOU'LL ONLY SEE IT ONCE!)

4. **Update `backend/.env`**:
```bash
# SendGrid Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM="Sisters Kitchen <your-verified-email@example.com>"

# Remove or comment out these test email settings:
# ETHEREAL_USER=
# ETHEREAL_PASS=
```

5. **Restart backend**:
```bash
cd backend
npm run dev
```

6. **Test**:
   - Place a test order
   - Check your email inbox
   - ✅ You should receive order confirmation!

---

### Option 2: Resend (Modern Alternative) 🚀

**Why**: Developer-friendly, modern UI, great for transactional emails

**Free Tier**: 3,000 emails/month + 100 emails/day  
**Paid Tier**: $20/month for 50,000 emails

#### Setup Steps:

1. **Sign up**: Go to [https://resend.com](https://resend.com)
   - Use GitHub or email

2. **Get API Key**:
   - Dashboard shows your API key immediately
   - Or go to API Keys > Create API Key
   - Copy the key (starts with "re_")

3. **Update `backend/.env`**:
```bash
# Resend Configuration
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM="Sisters Kitchen <onboarding@resend.dev>"

# For custom domain (recommended):
# SMTP_FROM="Sisters Kitchen <noreply@sisterskitchen.ng>"
```

4. **Verify Domain** (Optional but recommended):
   - Go to Domains > Add Domain
   - Enter: sisterskitchen.ng
   - Add DNS records to your domain
   - Verify ownership

5. **Restart backend** and test (same as SendGrid)

---

### Option 3: AWS SES (Most Scalable) ☁️

**Why**: Cheapest at scale, highly reliable, integrates with AWS

**Free Tier**: 62,000 emails/month (when sending from EC2)  
**Paid Tier**: $0.10 per 1,000 emails (extremely cheap)

#### Setup Steps:

1. **Create AWS Account**: [https://aws.amazon.com](https://aws.amazon.com)
   - Requires credit card (but won't charge for free tier)

2. **Enable SES**:
   - Go to AWS Console > SES (Simple Email Service)
   - Choose a region (e.g., us-east-1)

3. **Verify Email**:
   - SES > Verified identities > Create identity
   - Choose "Email address"
   - Enter your sender email
   - Verify through email link

4. **Request Production Access** (Important!):
   - By default, SES is in "sandbox mode" (can only send to verified emails)
   - Go to SES > Account dashboard
   - Click "Request production access"
   - Fill out the form (usually approved in 24 hours)

5. **Create SMTP Credentials**:
   - SES > SMTP Settings
   - Click "Create SMTP credentials"
   - Save the username and password

6. **Update `backend/.env`**:
```bash
# AWS SES Configuration
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
SMTP_FROM="Sisters Kitchen <noreply@sisterskitchen.ng>"
```

7. **Restart backend** and test

---

## Testing Your Email Setup

### 1. Check Backend Logs

Start your backend and look for:
```
📧 Using development email transport (Ethereal)  ← BAD (test mode)
OR
✅ Email sent: <message-id> to customer@example.com  ← GOOD (production)
```

### 2. Place a Test Order

```bash
# 1. Start backend
cd backend
npm run dev

# 2. Start frontend (new terminal)
cd frontend
npm run dev

# 3. Open browser: http://localhost:5173
# 4. Register as customer
# 5. Add items to cart
# 6. Place order

# 7. Check your email inbox (and spam folder!)
```

### 3. What Emails to Expect

**Customer receives**:
- ✅ Order confirmation (immediately after placing order)
- ✅ Order status updates (when vendor accepts, starts preparing, etc.)
- ✅ Order ready for pickup (if pickup order)
- ✅ Order delivered confirmation

**Vendor receives**:
- ✅ New order notification (immediately when customer orders)
- ✅ Reminder after 10 minutes (if order not accepted)

### 4. Test Email Templates

Open the template in browser:
```bash
cd backend
node -e "
const { emailTemplates } = require('./src/config/email');
const template = emailTemplates.orderConfirmation('ORD-123', 'John', 5000);
console.log(template.html);
" > test-email.html

# Open test-email.html in browser
```

---

## Troubleshooting

### Emails Not Sending?

#### 1. Check SMTP Credentials
```bash
# Test connection manually
cd backend
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: 'SG.your_key_here'
  }
});
transporter.verify((error, success) => {
  if (error) console.log('❌ Error:', error);
  else console.log('✅ Server is ready');
});
"
```

#### 2. Check Environment Variables
```bash
cd backend
node -e "
require('dotenv').config();
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_USER:', process.env.SMTP_USER ? '✅ Set' : '❌ Not set');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ Set' : '❌ Not set');
console.log('SMTP_FROM:', process.env.SMTP_FROM);
"
```

#### 3. Check Sender Verification

**SendGrid**:
- Settings > Sender Authentication
- Must show "Verified" status

**Resend**:
- Domains > Your domain > DNS records verified

**AWS SES**:
- Verified identities > Your email > Status: Verified
- Account dashboard > Production access: Enabled

#### 4. Check Spam Folder

Many email providers mark new senders as spam initially. Check:
- Gmail: Spam folder
- Outlook: Junk folder
- Yahoo: Spam folder

To improve deliverability:
- Verify your domain (don't use Gmail/Yahoo as sender)
- Set up SPF, DKIM records
- Use consistent "From" address

### Emails Going to Spam?

**Immediate fixes**:
1. Use SendGrid's verified sender (already configured correctly)
2. Don't use words like "FREE", "WINNER", "CLICK HERE" in subject lines
3. Include physical address in footer
4. Add unsubscribe link

**Long-term fixes**:
1. Verify your custom domain (sisterskitchen.ng)
2. Set up SPF record:
   ```
   v=spf1 include:sendgrid.net ~all
   ```
3. Set up DKIM (SendGrid does this automatically when you verify domain)
4. Monitor bounce rates and complaints

### Rate Limits Exceeded?

**SendGrid Free Tier**: 100 emails/day
- Upgrade to Essentials ($19.95/mo) for 50,000 emails/month

**Resend Free Tier**: 3,000 emails/month, 100 emails/day
- Upgrade to Pro ($20/mo) for 50,000 emails/month

**AWS SES**: No real limit on free tier
- But be careful of bounce rate >5% or complaint rate >0.1%

---

## Production Checklist

Before going live:

### Email Service
- [ ] Configured production SMTP (not Ethereal)
- [ ] Sender email verified
- [ ] Test emails received successfully
- [ ] Tested all email templates (order confirmation, status updates, etc.)
- [ ] Checked spam folder (emails not marked as spam)
- [ ] Set up monitoring/alerts for email failures

### Domain & Branding
- [ ] Using custom domain for sender (e.g., noreply@sisterskitchen.ng)
- [ ] Email templates show correct branding/colors
- [ ] Links in emails point to production URL
- [ ] Unsubscribe link added (if doing marketing emails)

### Compliance
- [ ] Privacy policy mentions email usage
- [ ] Terms of service covers transactional emails
- [ ] GDPR-compliant (if serving EU customers)
- [ ] CAN-SPAM compliant (if in US)

### Monitoring
- [ ] Set up email delivery monitoring (SendGrid has this built-in)
- [ ] Alert if bounce rate > 5%
- [ ] Alert if spam complaint rate > 0.1%
- [ ] Track open rates (optional, for marketing emails)

---

## Email Best Practices

### Subject Lines
✅ Good:
- "Order #ORD-123 Confirmed - Sisters Kitchen"
- "Your order is being prepared 👩‍🍳"
- "Order #ORD-123 Ready for Pickup"

❌ Bad:
- "YOU WON!!!" (spam trigger)
- "Click here NOW" (spam trigger)
- "Free food" (spam trigger)

### Email Content
✅ Good:
- Clear, concise information
- Prominent call-to-action button
- Mobile-responsive HTML
- Plain text alternative
- Company name and address in footer

❌ Bad:
- All images, no text (spam filters hate this)
- Too many links
- Misleading subject line
- No physical address

### Timing
✅ Good:
- Order confirmation: Immediately (< 1 second)
- Status updates: Immediately when status changes
- Reminders: 10 minutes after pending

❌ Bad:
- Sending emails at 3 AM (except order confirmations)
- Too many reminder emails (1 is enough)
- Emails days after the event

---

## Cost Comparison

### Monthly Cost by Volume

| Emails/Month | SendGrid | Resend | AWS SES |
|--------------|----------|--------|---------|
| 3,000        | $0       | $0     | $0      |
| 10,000       | $19.95   | $20    | $1      |
| 50,000       | $19.95   | $20    | $5      |
| 100,000      | $89.95   | $70    | $10     |
| 500,000      | $249     | $250   | $50     |

**Recommendation**:
- **Start**: SendGrid (easiest setup)
- **Scale**: AWS SES (cheapest at scale)
- **Developer-friendly**: Resend (best UI/UX)

---

## Next Steps

1. ✅ Choose a provider (SendGrid recommended)
2. ✅ Follow setup steps above (15 minutes)
3. ✅ Update backend/.env file
4. ✅ Restart backend server
5. ✅ Place a test order
6. ✅ Check your email inbox
7. ✅ Celebrate! 🎉

You're now production-ready with professional email notifications!

---

## Need Help?

**Email not working?**
- Check logs: `cd backend && npm run dev` (look for email errors)
- Verify credentials: Make sure API key is correct
- Check spam: Emails might be in junk folder
- Test connection: Use the nodemailer test script above

**Want to customize templates?**
- Edit: `backend/src/config/email.ts`
- Templates use inline CSS for maximum compatibility
- Test in multiple email clients (Gmail, Outlook, Apple Mail)

**Questions?**
Just ask! I'm here to help. 🚀
