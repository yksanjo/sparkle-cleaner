import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import { Redis } from '@upstash/redis';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});
const TOKEN_TTL = 60 * 60 * 24; // 24 hours in seconds

export const stripeRouter = express.Router();

// Stripe webhook — generates token after confirmed payment
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (session.payment_status !== 'paid') return res.json({ received: true });

    const tokenId = session.metadata.token_id || uuidv4();
    const cleanupToken = `sparkle_${tokenId}`;
    const email = session.customer_details?.email || null;

    await redis.set(cleanupToken, {
      created: Date.now(),
      used: false,
      sessionId: session.id,
      amountPaid: session.amount_total,
      paymentStatus: 'paid',
      customerEmail: email,
    }, { ex: TOKEN_TTL });

    console.log(`✨ Token generated for ${email} (session: ${session.id})`);

    if (email) {
      await resend.emails.send({
        from: 'Sparkle Cleaner <onboarding@resend.dev>',
        to: email,
        subject: '✨ Your Sparkle Cleaner token',
        html: `
          <p>Hi,</p>
          <p>Thanks for purchasing Sparkle Cleaner. Here's your one-time cleanup token:</p>
          <p style="font-size:18px;font-family:monospace;background:#f4f4f4;padding:12px;border-radius:6px;">
            ${cleanupToken}
          </p>
          <p>Run this in your terminal:</p>
          <pre style="background:#1a1a1a;color:#fff;padding:12px;border-radius:6px;">./sparkle.sh ${cleanupToken}</pre>
          <p>Token expires in 24 hours and is single-use.</p>
          <p>— Yoshi Kondo</p>
        `,
      });
      console.log(`📧 Token emailed to ${email}`);
    }
  }

  res.json({ received: true });
});

// Validate token
stripeRouter.post('/validate-token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ valid: false, error: 'Token required' });

  const data = await redis.get(token);
  if (!data)        return res.status(400).json({ valid: false, error: 'Invalid token' });
  if (data.used)    return res.status(400).json({ valid: false, error: 'Token already used' });
  if (data.paymentStatus !== 'paid') return res.status(400).json({ valid: false, error: 'Payment not completed' });

  res.json({ valid: true });
});

// Consume token (mark as used)
stripeRouter.post('/consume-token', async (req, res) => {
  const { token } = req.body;
  const data = await redis.get(token);
  if (!data) return res.status(400).json({ success: false, error: 'Invalid token' });

  await redis.set(token, { ...data, used: true }, { ex: TOKEN_TTL });
  res.json({ success: true });
});

// Admin: list tokens
stripeRouter.get('/tokens', async (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // KV doesn't support listing all keys easily — return a placeholder
  res.json({ message: 'Use Vercel KV dashboard to inspect tokens.' });
});
