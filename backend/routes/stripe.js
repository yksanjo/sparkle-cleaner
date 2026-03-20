import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import { writeFileSync, readFileSync, existsSync } from 'fs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const TOKENS_FILE = new URL('../data/tokens.json', import.meta.url).pathname;

// Persistent token store (file-based for now, use DB in production)
let validTokens = new Map();

// Load tokens from file on startup
function loadTokens() {
  try {
    if (existsSync(TOKENS_FILE)) {
      const data = readFileSync(TOKENS_FILE, 'utf8');
      const tokens = JSON.parse(data);
      validTokens = new Map(Object.entries(tokens));
      console.log(`✨ Loaded ${validTokens.size} tokens from storage`);
    }
  } catch (error) {
    console.error('Error loading tokens:', error.message);
  }
}

// Save tokens to file
function saveTokens() {
  try {
    const data = Object.fromEntries(validTokens);
    writeFileSync(TOKENS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving tokens:', error.message);
  }
}

loadTokens();
setInterval(saveTokens, 10000); // Auto-save every 10 seconds

export const stripeRouter = express.Router();

// Create a Stripe checkout session
stripeRouter.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Sparkle Cleaner - One-time Cleanup',
              description: 'AI-powered Mac spam cleanup service by Yoshi Kondo',
            },
            unit_amount: 300, // $3.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        token_id: uuidv4(),
      },
      // IMPORTANT: Don't let user specify their own token
      client_reference_id: uuidv4(),
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler - THIS IS WHERE TOKENS ARE GENERATED
stripeRouter.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;

      // SECURITY: Only generate token after payment is confirmed
      if (session.payment_status !== 'paid') {
        console.error(`⚠️ Payment not completed for session: ${session.id}`);
        break;
      }

      // Generate a one-time cleanup token
      const tokenId = session.metadata.token_id || uuidv4();
      const cleanupToken = `sparkle_${tokenId}`;

      // Store token with expiration (24 hours)
      validTokens.set(cleanupToken, {
        created: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        used: false,
        sessionId: session.id,
        amountPaid: session.amount_total,
        paymentStatus: 'paid',
        customerEmail: session.customer_details?.email || null,
      });

      saveTokens();
      console.log(`✨ Token generated: ${cleanupToken} for session ${session.id}`);

      // TODO: Send token via email (use SendGrid, Postmark, etc.)
      // For now, it's logged - you'll need to set up email delivery
      console.log(`📧 Email to ${validTokens.get(cleanupToken).customerEmail}: Your token is ${cleanupToken}`);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Validate a cleanup token
stripeRouter.post('/validate-token', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ valid: false, error: 'Token required' });
  }

  const tokenData = validTokens.get(token);

  if (!tokenData) {
    return res.status(400).json({ valid: false, error: 'Invalid token' });
  }

  if (tokenData.used) {
    return res.status(400).json({ valid: false, error: 'Token already used' });
  }

  if (Date.now() > tokenData.expires) {
    validTokens.delete(token);
    saveTokens();
    return res.status(400).json({ valid: false, error: 'Token expired' });
  }

  if (tokenData.paymentStatus !== 'paid') {
    return res.status(400).json({ valid: false, error: 'Payment not completed' });
  }

  res.json({ valid: true });
});

// Mark token as used
stripeRouter.post('/consume-token', async (req, res) => {
  const { token } = req.body;

  const tokenData = validTokens.get(token);

  if (!tokenData) {
    return res.status(400).json({ success: false, error: 'Invalid token' });
  }

  validTokens.set(token, { ...tokenData, used: true });
  saveTokens();
  res.json({ success: true });
});

// Admin: List all tokens (for debugging)
stripeRouter.get('/tokens', (req, res) => {
  // In production, add admin authentication here!
  const tokens = Array.from(validTokens.entries()).map(([token, data]) => ({
    token: token.substring(0, 10) + '...', // Hide full token
    ...data,
  }));
  res.json({ tokens });
});

export { validTokens, saveTokens };
