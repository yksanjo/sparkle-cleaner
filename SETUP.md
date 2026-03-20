# 🦫 Mole Cleaner - Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd mole-cleaner
npm install
```

### 2. Get Your API Keys

#### Stripe
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers → API Keys**
3. Copy your **Secret key** (`sk_test_...`)
4. For webhooks:
   - Go to **Developers → Webhooks**
   - Click **Add endpoint**
   - URL: `http://localhost:3000/api/stripe/webhook`
   - Events: `checkout.session.completed`
   - Copy the **Signing secret** (`whsec_...`)

#### Anthropic (Claude API)
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Navigate to **Settings → API Keys**
3. Create a new key
4. Copy your **API key** (`sk-ant-...`)

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
ANTHROPIC_API_KEY=sk-ant-api03_your_key_here
PORT=3000
FRONTEND_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000
MOLE_API_URL=http://localhost:3000
```

### 4. Start the Server

```bash
npm run dev
```

You should see:
```
🦫 Mole Cleaner API running on port 3000
   Frontend: http://localhost:3000
   API: http://localhost:3000/api
```

### 5. Test the Payment Flow

1. Open http://localhost:3000
2. Click "Get Clean Token"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete checkout
5. Token will be generated (check server logs)

### 6. Test the Mole Script

```bash
cd scripts
./mole.sh mole_your_test_token
```

---

## Production Deployment

### Environment Variables for Production

```bash
FRONTEND_URL=https://mole-cleaner.com
API_BASE_URL=https://api.mole-cleaner.com
MOLE_API_URL=https://api.mole-cleaner.com
```

### Deploy Options

#### Option 1: Vercel/Netlify (Frontend) + Railway/Render (Backend)

**Backend (Railway/Render):**
```yaml
# railway.toml or render.yaml
build: npm install
start: npm start
env:
  STRIPE_SECRET_KEY: $STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET: $STRIPE_WEBHOOK_SECRET
  ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY
```

**Webhook URL:** `https://your-backend.railway.app/api/stripe/webhook`

#### Option 2: VPS (DigitalOcean, Linode, etc.)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone https://github.com/yourusername/mole-cleaner.git
cd mole-cleaner
npm install --production

# PM2 for process management
npm install -g pm2
pm2 start npm --name "mole" -- start
pm2 startup
pm2 save

# Nginx reverse proxy
sudo apt-get install nginx
# Configure nginx to proxy_pass to localhost:3000
```

#### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t mole-cleaner .
docker run -p 3000:3000 --env-file .env mole-cleaner
```

---

## Stripe Testing

### Test Cards

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 9995 | Declined (insufficient funds) |
| 4000 0000 0000 0341 | Declined (lost card) |

### Test Webhook Locally

Use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Troubleshooting

### "Invalid token" error
- Check if token format is `mole_xxxxx`
- Verify token hasn't expired (24hr limit)
- Check server logs for token generation

### Stripe webhook not firing
- Verify webhook URL is correct in Stripe dashboard
- Check webhook secret matches
- Use Stripe CLI to test locally

### Claude API errors
- Verify API key is correct
- Check API quota/limits
- Ensure model name is correct

### Script permission denied
```bash
chmod +x scripts/mole.sh
```

---

## Next Steps

1. ✅ Set up email delivery for tokens (SendGrid, Postmark)
2. ✅ Add user dashboard for cleanup progress
3. ✅ Implement actual file cleanup (with user approval)
4. ✅ Add before/after storage reports
5. ✅ Create landing page with pricing
6. ✅ Set up analytics and logging

---

Need help? Open an issue on GitHub! 🦫
