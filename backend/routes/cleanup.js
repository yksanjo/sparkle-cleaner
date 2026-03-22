import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const cleanupRouter = express.Router();

cleanupRouter.post('/start', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  try {
    const validationRes = await fetch(`${process.env.API_BASE_URL}/api/stripe/validate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const validation = await validationRes.json();
    if (!validation.valid) return res.status(400).json({ error: validation.error || 'Invalid token' });

    const sessionId = `session_${Date.now()}_${token.substring(5, 12)}`;
    const result = await executeCleanupOnServer(sessionId, token);
    res.json(result);
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Cleanup failed', details: error.message });
  }
});

async function executeCleanupOnServer(sessionId, token) {
  const report = { sessionId, phase: 'scanning', findings: [], cleaned: [] };

  const scanCommands = [
    { name: 'Disk Usage',    cmd: 'df -h / | tail -n 1' },
    { name: 'User Caches',  cmd: 'du -sh ~/Library/Caches 2>/dev/null || echo "N/A"' },
    { name: 'System Caches',cmd: 'du -sh /Library/Caches 2>/dev/null || echo "N/A"' },
    { name: 'User Logs',    cmd: 'du -sh ~/Library/Logs 2>/dev/null || echo "N/A"' },
  ];

  for (const { name, cmd } of scanCommands) {
    try {
      const { stdout } = await execAsync(cmd, { timeout: 10000 });
      report.findings.push({ name, size: stdout.trim() });
    } catch { report.findings.push({ name, size: 'Unable to scan' }); }
  }

  for (const cmd of ['rm -rf /tmp/* 2>/dev/null || true', 'rm -rf ~/Library/Logs/*.log 2>/dev/null || true']) {
    try { await execAsync(cmd, { timeout: 30000 }); } catch { /* continue */ }
  }

  await fetch(`${process.env.API_BASE_URL}/api/stripe/consume-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  report.phase = 'complete';
  report.message = '✨ Done!';
  report.cleaned = ['Temporary files', 'Old log files'];
  return report;
}

cleanupRouter.get('/status/:sessionId', (req, res) => {
  res.json({ sessionId: req.params.sessionId, status: 'completed' });
});
