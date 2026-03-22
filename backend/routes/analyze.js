import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const analyzeRouter = express.Router();

analyzeRouter.post('/', async (req, res) => {
  const { findings, token } = req.body;
  if (!findings) return res.status(400).json({ error: 'findings required' });
  if (!token)    return res.status(400).json({ error: 'token required' });

  const findingsList = findings
    .map(f => `- ${f.label}: ${f.size}`)
    .join('\n');

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are Sparkle, a friendly Mac cleanup assistant. A user just scanned their Mac and found the following:

${findingsList}

Write a short, warm, plain-English summary (3-4 sentences max) explaining:
1. What the biggest items are and why they build up
2. Whether it's safe to delete them
3. How much space they could free up total

Be friendly and specific. No bullet points, no headers. Just natural prose like a knowledgeable friend explaining it.`,
      }],
    });

    res.json({ analysis: message.content[0].text });
  } catch (err) {
    console.error('Claude error:', err.message);
    // Don't fail the whole flow if Claude errors — just skip analysis
    res.json({ analysis: null });
  }
});
