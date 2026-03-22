import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { routes } from '../backend/routes/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(cors());

app.get('/health', (req, res) => res.json({ status: '✨ Sparkle is ready!' }));
app.use('/api', routes);

// Serve success page
app.use(express.static(join(__dirname, '../frontend')));
app.get('/success', (req, res) => {
  res.sendFile(join(__dirname, '../frontend/success.html'));
});

export default app;
