import express from 'express';
import { cleanupMac } from '../api/claude.js';

export const cleanupRouter = express.Router();

// Start cleanup process
cleanupRouter.post('/start', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }
  
  try {
    // Validate token first
    const validationRes = await fetch(`${process.env.API_BASE_URL}/api/stripe/validate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    
    const validation = await validationRes.json();
    
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error || 'Invalid token' });
    }
    
    // Start the cleanup process
    const result = await cleanupMac(token);
    
    res.json(result);
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Cleanup failed', details: error.message });
  }
});

// Get cleanup status
cleanupRouter.get('/status/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  
  // Return session status (implement with proper session tracking)
  res.json({ sessionId, status: 'completed' });
});
