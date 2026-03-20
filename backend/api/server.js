import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { routes } from './routes/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Stripe webhook needs raw body, so we handle it separately
app.use('/webhook/stripe', express.json({ type: 'application/json' }));
app.use(express.json());
app.use(cors());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: '🦫 Mole is ready!' });
});

// API routes
app.use('/api', routes);

// Serve frontend
app.use('/', express.static(join(__dirname, '../../frontend')));
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`🦫 Mole Cleaner API running on port ${PORT}`);
  console.log(`   Frontend: http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
});
