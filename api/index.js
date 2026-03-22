import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { routes } from '../backend/routes/index.js';

dotenv.config();

const app = express();

// Stripe webhook needs raw body for signature verification
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(cors());

app.get('/health', (req, res) => {
  res.json({ status: '✨ Sparkle is ready!' });
});

app.use('/api', routes);

export default app;
