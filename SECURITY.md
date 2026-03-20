# 🔒 Security Best Practices for Sparkle Cleaner

by Yoshi Kondo

## 🔐 Protecting Your Keys

### Never Commit Keys
- `.env` is already in `.gitignore` ✅
- Never paste keys in README or code
- Use environment variables in production

### Stripe Keys Explained

| Key Type | Prefix | Purpose | Safe to Share? |
|----------|--------|---------|----------------|
| Publishable (Test) | `pk_test_` | Frontend checkout | ✅ Yes |
| Secret (Test) | `sk_test_` | Backend API | ❌ NO |
| Publishable (Live) | `pk_live_` | Frontend checkout | ✅ Yes |
| Secret (Live) | `sk_live_` | Backend API | ❌ NO |
| Webhook Secret | `whsec_` | Verify webhooks | ❌ NO |

## What You Shared

If you shared `pk_live_...` - this is your **publishable key** which is safe to use in frontend code, but:

1. **Use test keys for development** (`sk_test_...`)
2. **Only use live keys when deploying to production**
3. **Never commit secret keys** (`sk_live_...` or `sk_test_...`)

## Next Steps

### 1. Get Your Test Secret Key
Go to: https://dashboard.stripe.com/test/apikeys
Copy the key starting with `sk_test_...`

### 2. Create Your .env File
```bash
cd sparkle-cleaner
cat > .env << EOF
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
ANTHROPIC_API_KEY=sk-ant-api03_YOUR_KEY
PORT=3000
FRONTEND_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000
SPARKLE_API_URL=http://localhost:3000
EOF
```

### 3. Set Up Webhook (Test Mode)
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Add endpoint: `http://localhost:3000/api/stripe/webhook`
3. Select event: `checkout.session.completed`
4. Copy the signing secret (`whsec_...`)

### 4. If You Already Committed Keys
If you accidentally committed any keys:

```bash
# Rotate your keys immediately in Stripe dashboard
# Then clean git history:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
git push origin --force --all
```

## Production Deployment

When ready for live payments:

1. **Use environment variables** (not .env file)
2. **Deploy to secure hosting** (Railway, Render, Heroku, etc.)
3. **Use HTTPS** for all webhook endpoints
4. **Rotate keys regularly**

---

Stay safe! ✨🔐
