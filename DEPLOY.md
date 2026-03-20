# 🚀 Sparkle Cleaner - Deployment Guide

by Yoshi Kondo

## Quick Deploy (5 minutes)

### Option 1: Railway (Recommended - Easiest)

1. **Go to** https://railway.app
2. **Click** "New Project" → "Deploy from GitHub repo"
3. **Select** `yksanjo/sparkle-cleaner`
4. **Add Environment Variables**:
   ```
   STRIPE_SECRET_KEY=sk_live_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
   FRONTEND_URL=https://your-project.railway.app
   API_BASE_URL=https://your-project.railway.app
   SPARKLE_API_URL=https://your-project.railway.app
   ```
5. **Deploy!** Railway will give you a URL like: `https://sparkle-cleaner-production.up.railway.app`

### Option 2: Render

1. **Go to** https://render.com
2. **Create** "Web Service"
3. **Connect** GitHub repo: `yksanjo/sparkle-cleaner`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. **Add Environment Variables** (same as above)
7. **Deploy!**

### Option 3: VPS (DigitalOcean, Linode, etc.)

```bash
# SSH into your server
ssh root@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs npm

# Clone repo
git clone https://github.com/yksanjo/sparkle-cleaner.git
cd sparkle-cleaner

# Install dependencies
npm install --production

# Create .env file
nano .env
# Add your keys

# Install PM2
sudo npm install -g pm2

# Start server
pm2 start npm --name "sparkle" -- start
pm2 startup
pm2 save

# Install Nginx
sudo apt-get install nginx

# Configure Nginx (see nginx.conf example)
```

---

## Stripe Webhook Setup (Production)

### 1. Get Your Production URL

After deploying, you'll have a URL like:
- Railway: `https://your-project.railway.app`
- Render: `https://your-project.onrender.com`
- VPS: `https://sparkle-cleaner.com`

### 2. Create Stripe Webhook

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://your-url.com/api/stripe/webhook`
4. **Events**: Select `checkout.session.completed`
5. Click **"Add endpoint"**
6. **Copy the Signing Secret** (`whsec_...`)
7. **Add to your environment variables** on your hosting platform

---

## Update Script for Production

Users will download the script with your production URL:

```bash
# Download script
curl -O https://raw.githubusercontent.com/yksanjo/sparkle-cleaner/main/scripts/sparkle.sh
chmod +x sparkle.sh

# Run with production API
SPARKLE_API_URL=https://your-production-url.com ./sparkle.sh sparkle_your_token
```

Or update the default in `sparkle.sh`:
```bash
API_URL="${SPARKLE_API_URL:-https://your-production-url.com}"
```

---

## Domain Setup (Optional but Recommended)

### Buy a Domain
- Namecheap: https://namecheap.com
- Google Domains: https://domains.google
- Cost: ~$10-15/year

### Point to Your Hosting

**Railway/Render:**
1. Buy domain: `sparkle-cleaner.com`
2. Add custom domain in Railway/Render dashboard
3. Update DNS records as instructed
4. Enable HTTPS (automatic)

---

## Post-Deployment Checklist

- [ ] Server is running (visit your URL)
- [ ] Health check works: `https://your-url.com/health`
- [ ] Stripe webhook is configured
- [ ] Test payment flow with test card: `4242 4242 4242 4242`
- [ ] Token generation works (check logs)
- [ ] Script can connect to API
- [ ] HTTPS is enabled
- [ ] Error logging is set up

---

## Monitoring & Logs

### Railway
```bash
railway logs
# or in dashboard: View Logs
```

### Render
```bash
# In dashboard: Logs tab
```

### PM2 (VPS)
```bash
pm2 logs sparkle
pm2 status
pm2 monit
```

---

## Scaling

When you get lots of users:

1. **Database**: Switch from file-based tokens to PostgreSQL
2. **Email**: Add SendGrid/Postmark for token delivery
3. **CDN**: Serve script from CloudFront/Cloudflare
4. **Rate Limiting**: Add express-rate-limit
5. **Analytics**: Add Google Analytics to frontend

---

## Cost Estimate

| Service | Free Tier | Paid |
|---------|-----------|------|
| Railway | 500 hrs/month | $5/mo |
| Render | 750 hrs/month | $7/mo |
| Stripe | 2.9% + 30¢ per transaction | Same |
| Anthropic | ~$5 free credit | ~$0.01 per cleanup |
| Domain | - | $12/year |

**Break-even**: ~2-3 cleanings covers monthly costs!

---

## Support

Issues? Check:
- Server logs
- Stripe dashboard (payments)
- Anthropic dashboard (API usage)

GitHub Issues: https://github.com/yksanjo/sparkle-cleaner/issues

---

Good luck! ✨
