# 🦫 Mole Cleaner - How Payment & Security Works

## Payment Flow (Secure)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   User      │────▶│  Stripe      │────▶│  Your       │
│   (Mac)     │ $3  │  Checkout    │     │  Server     │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                    │
                           │ webhook            │ Generate token
                           ▼                    │ (only after payment)
                    ┌──────────────┐            │
                    │ Payment      │◀───────────┘
                    │ Confirmed    │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Email token  │
                    │ to user      │
                    └──────────────┘
```

## Security Measures

### 1. Token Generation (Server-Side Only)

```javascript
// ✅ GOOD: Token created ONLY after Stripe webhook confirms payment
case 'checkout.session.completed':
  if (session.payment_status !== 'paid') break; // Security check
  const token = `mole_${uuidv4()}`;
  validTokens.set(token, { paymentStatus: 'paid', ... });
```

```javascript
// ❌ BAD: Never generate token before payment
app.post('/get-token', (req, res) => {
  res.json({ token: 'mole_xxx' }); // WRONG! No payment check!
});
```

### 2. Token Validation (Every Request)

```javascript
// Every cleanup request validates:
// - Token exists in database
// - Payment status = 'paid'
// - Token not expired (24hr)
// - Token not already used
```

### 3. Cleanup Logic (Server-Side)

```bash
# ✅ GOOD: Script only collects info, server does the work
# mole.sh - Read-only system scan
curl server/api/cleanup/start  # Server executes cleanup

# ❌ BAD: Don't put cleanup logic in user's hands
# rm -rf ~/Library/Caches  # WRONG! User can see/modify
```

### 4. Token Delivery (Email Only)

```
✅ Send token via email AFTER payment
✅ Token never shown in browser URL
✅ Token never in frontend JavaScript
✅ One-time use, expires in 24 hours
```

## What Users Can't Steal

| What | Where | Can User Steal? |
|------|-------|-----------------|
| Cleanup logic | Your server | ❌ No |
| Claude API calls | Your server | ❌ No |
| AI prompts | Your server | ❌ No |
| Token validation | Your server | ❌ No |
| mole.sh script | User's machine | ✅ Yes (but read-only) |

## What Users CAN See

- `mole.sh` script (but it's read-only, no cleanup logic)
- Their own system info (they already have access)
- Cleanup results (output from your server)

## Preventing Common Attacks

### Attack 1: Fake Token
```bash
# User tries: ./mole.sh mole_fake_token
# Server validates against database → Rejected ❌
```

### Attack 2: Reused Token
```bash
# User tries same token twice
# Server marks token as 'used' after first run → Rejected ❌
```

### Attack 3: Expired Token
```bash
# User tries token after 24 hours
# Server checks expiration → Rejected ❌
```

### Attack 4: Script Modification
```bash
# User modifies mole.sh to skip validation
# Server still validates token on every request → Still protected ✅
```

### Attack 5: Direct API Call
```bash
# User tries: curl server/api/cleanup/start without token
# Server requires valid token → Rejected ❌
```

## Production Recommendations

### 1. Use a Database
```javascript
// Replace in-memory Map with PostgreSQL/MongoDB
// Prevents token loss on server restart
```

### 2. Add Rate Limiting
```javascript
// Prevent brute force token guessing
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests
}));
```

### 3. Email Delivery
```javascript
// Use SendGrid, Postmark, or AWS SES
// Send token immediately after payment
await sendEmail({
  to: session.customer_details.email,
  subject: 'Your Mole Cleaner Token',
  text: `Your cleanup token: ${token}`
});
```

### 4. HTTPS Only
```bash
# Never run over HTTP in production
# Use Let's Encrypt for free SSL
```

### 5. Admin Dashboard
```javascript
// Add authentication to view all tokens
// Monitor for fraud/abuse
```

### 6. Webhook Signature Verification
```javascript
// Already implemented! ✅
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

## Testing the Security

### Test Invalid Token
```bash
cd scripts
./mole.sh mole_fake_token
# Should fail with "Invalid token"
```

### Test Without Token
```bash
./mole.sh
# Should fail with "Missing cleanup token"
```

### Test Token Expiration
```javascript
// Manually set token expiration to past
// Should fail with "Token expired"
```

---

**Bottom Line:** Users pay $3 → get token via email → token validated on every request → cleanup runs on your server → they can't steal the AI logic! 🦫🔒
