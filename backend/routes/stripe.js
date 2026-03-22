import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import { Redis } from '@upstash/redis';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});
const TOKEN_TTL = 60 * 60 * 24; // 24 hours

export const stripeRouter = express.Router();

// Webhook — generate token after payment, index by session_id
stripeRouter.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status !== 'paid') return res.json({ received: true });

    const cleanupToken = `sparkle_${uuidv4()}`;
    const tokenData = {
      created: Date.now(),
      used: false,
      sessionId: session.id,
      amountPaid: session.amount_total,
      paymentStatus: 'paid',
      customerEmail: session.customer_details?.email || null,
    };

    // Store by token AND by session_id so success page can look it up
    await redis.set(cleanupToken, tokenData, { ex: TOKEN_TTL });
    await redis.set(`session:${session.id}`, cleanupToken, { ex: TOKEN_TTL });

    console.log(`✨ Token generated for session ${session.id}`);
  }

  res.json({ received: true });
});

// Success page calls this with session_id to get the token
stripeRouter.get('/get-token', async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });

  const token = await redis.get(`session:${session_id}`);
  if (!token) return res.status(404).json({ error: 'Token not found — try refreshing in a few seconds.' });

  res.json({ token });
});

// Validate token
stripeRouter.post('/validate-token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ valid: false, error: 'Token required' });

  const data = await redis.get(token);
  if (!data)     return res.status(400).json({ valid: false, error: 'Invalid token' });
  if (data.used) return res.status(400).json({ valid: false, error: 'Token already used' });
  if (data.paymentStatus !== 'paid') return res.status(400).json({ valid: false, error: 'Payment not completed' });

  res.json({ valid: true });
});

// Consume token
stripeRouter.post('/consume-token', async (req, res) => {
  const { token } = req.body;
  const data = await redis.get(token);
  if (!data) return res.status(400).json({ success: false, error: 'Invalid token' });

  await redis.set(token, { ...data, used: true }, { ex: TOKEN_TTL });
  res.json({ success: true });
});
