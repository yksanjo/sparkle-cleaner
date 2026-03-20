import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import express from 'express';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const TOKENS_FILE = new URL('../utils/tokens.json', import.meta.url).pathname;

// In-memory token store (use database in production)
let validTokens = new Map();

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
              name: 'Mole Cleaner - One-time Cleanup',
              description: 'AI-powered Mac spam cleanup service',
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
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler
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
      
      // Generate a one-time cleanup token
      const tokenId = session.metadata.token_id || uuidv4();
      const cleanupToken = `mole_${tokenId}`;
      
      // Store token with expiration (24 hours)
      validTokens.set(cleanupToken, {
        created: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        used: false,
        sessionId: session.id,
        amountPaid: session.amount_total,
      });
      
      console.log(`🦫 Token generated: ${cleanupToken} for session ${session.id}`);
      
      // In production, you'd send this token via email
      // For now, log it (or integrate with email service)
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
    return res.status(400).json({ valid: false, error: 'Token expired' });
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
  res.json({ success: true });
});

export { validTokens };
