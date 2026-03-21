import Anthropic from '@anthropic-ai/sdk';
import { exec } from 'child_process';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt for Sparkle - defines what to clean
const SPARKLE_SYSTEM_PROMPT = `You are Sparkle, a friendly AI-powered Mac cleanup specialist created by Yoshi Kondo.
Your job is to safely identify and remove spam, cache, and unnecessary files from Mac computers.

GUIDELINES:
- Be thorough but SAFE - never delete important user files
- Focus on: browser caches, system caches, log files, temporary files, old downloads
- NEVER delete: Documents, Photos, Music, Videos, Desktop files, application data
- Always explain what you're doing
- Report back what was cleaned and how much space was freed

COMMON MAC SPAM LOCATIONS:
- ~/Library/Caches/*
- ~/Library/Logs/*
- /Library/Caches/*
- /tmp/*
- ~/Downloads (old files, ask first)
- Browser caches (Chrome, Safari, Firefox)
- Xcode derived data (if exists)
- Node modules cache
- Python __pycache__

Respond with clear JSON structure:
{
  "phase": "scan" | "cleaning" | "complete" | "error",
  "message": "What you're doing",
  "files_found": [],
  "files_cleaned": [],
  "space_freed_bytes": 0,
  "error": null
}`;

export async function cleanupMac(token) {
  const sessionId = `session_${Date.now()}`;
  
  try {
    // Start the conversation with Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: SPARKLE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `A user has paid for a cleanup service. Token: ${token}
          
Please start by scanning the Mac system to identify cleanup opportunities.
Use terminal commands to:
1. Check disk usage
2. Find cache directories
3. Identify log files
4. Look for temporary files

Start with a scan and report what you find.`,
        },
      ],
    });

    return {
      sessionId,
      status: 'started',
      claudeResponse: response.content[0].text,
      message: '✨ Sparkle is starting the cleanup process...',
    };
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error(`AI cleanup failed: ${error.message}`);
  }
}

// Helper to execute commands (for Claude to use via your backend)
export async function executeCommand(command, options = {}) {
  const { timeout = 30000 } = options;
  
  return new Promise((resolve, reject) => {
    exec(command, { timeout }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}
