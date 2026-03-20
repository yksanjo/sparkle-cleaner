# 🦫 Mole Cleaner

**AI-Powered Mac Cleanup Service** - $3 terminal-based spam cleaner for macOS

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Price](https://img.shields.io/badge/price-$3-green.svg)

> 🦫 *"Digging through your caches so you don't have to!"*

A friendly, AI-powered cleanup tool that safely identifies and removes spam, caches, and unnecessary files from your Mac. Built for the terminal, powered by Claude AI.

---

## ✨ Features

- 🤖 **AI-Powered**: Uses Claude API to intelligently identify what's safe to delete
- 🔒 **Safe First**: Never deletes important user files (Documents, Photos, etc.)
- 💰 **Pay-Per-Use**: One-time $3 payment, no subscriptions
- 📟 **Terminal Native**: No app installation, just run a script
- 🎯 **Targeted Cleanup**: Focuses on caches, logs, and temporary files
- 📊 **Transparent Reports**: See exactly what will be deleted before approval

---

## 🚀 Quick Start (For Users)

### 1. Purchase Your Cleanup Token

Visit [mole-cleaner.com](https://mole-cleaner.com) and pay $3 via Stripe.

### 2. Download & Run

```bash
# Download the script
curl -O https://raw.githubusercontent.com/yourusername/mole-cleaner/main/scripts/mole.sh

# Make it executable
chmod +x mole.sh

# Run with your token
./mole.sh mole_your_token_here
```

### 3. Watch the Magic 🪄

Mole will:
1. Validate your token
2. Scan your system for spam
3. Report what can be safely cleaned
4. Ask for your approval before deleting

---

## 🛠️ Self-Host Setup (For Developers)

Want to run your own Mole Cleaner service? Here's how!

### Prerequisites

- Node.js 18+
- Stripe account
- Anthropic API key (Claude)
- macOS (for testing)

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/mole-cleaner.git
cd mole-cleaner

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Anthropic (Claude API)
ANTHROPIC_API_KEY=sk-ant-...

# Server
PORT=3000
FRONTEND_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000

# Optional: For the script
MOLE_API_URL=http://localhost:3000
```

### Run the Server

```bash
# Development
npm run dev

# Production
npm start
```

### Setup Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`
4. Copy the signing secret to `.env`

### Test the Script

```bash
cd scripts
./mole.sh mole_test_token
```

---

## 📁 What Gets Cleaned

Mole safely targets:

| Location | Description | Safe to Delete |
|----------|-------------|----------------|
| `~/Library/Caches/*` | User application caches | ✅ Yes |
| `/Library/Caches/*` | System caches | ✅ Yes |
| `~/Library/Logs/*` | User log files | ✅ Yes |
| `/tmp/*` | Temporary files | ✅ Yes |
| Browser Caches | Chrome, Safari, Firefox | ✅ Yes |
| `~/Downloads` | Old downloads | ⚠️ Ask first |
| Xcode Derived Data | Build artifacts | ✅ Yes (if dev) |
| `__pycache__/` | Python cache | ✅ Yes |

**NEVER deletes:**
- Documents
- Photos
- Music
- Videos
- Desktop files
- Application data

---

## 🎨 Branding & Customization

Mole is designed with a friendly, approachable personality:

- **Mascot**: Mole the gopher (🦫)
- **Tone**: Friendly, helpful, transparent
- **Colors**: Purple/Cyan theme (terminal colors)

Feel free to customize:
- Logo in `scripts/mole.sh`
- System prompt in `backend/api/claude.js`
- Colors and messages throughout

---

## 📊 Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   User      │────▶│  Stripe      │────▶│  Your       │
│   (Mac)     │     │  Payment     │     │  Server     │
└─────────────┘     └──────────────┘     └─────────────┘
       │                                       │
       │                                       ▼
       │                              ┌─────────────┐
       │◀─────────────────────────────│  Claude     │
       │   Token + Script             │  API        │
       │                              └─────────────┘
       ▼
┌─────────────┐
│  mole.sh    │───▶ Scans & Cleans
└─────────────┘
```

---

## 🔒 Security

- One-time tokens (24hr expiration)
- Tokens marked as used after cleanup
- No persistent storage of user data
- All actions logged for liability
- User approval required before deletions

---

## 📝 License

MIT License - feel free to fork and customize!

---

## 💡 Ideas for Improvement

- [ ] Email token delivery
- [ ] Dashboard for live progress
- [ ] Before/after storage reports
- [ ] Scheduled cleanups (subscription)
- [ ] Windows/Linux support
- [ ] GUI version (Tauri/Electron)
- [ ] Mobile app for remote monitoring

---

## 🙋 FAQ

**Q: Is this safe?**  
A: Yes! Mole only targets cache and temporary files. It never deletes personal files without explicit approval.

**Q: What if something goes wrong?**  
A: All actions are logged. Contact support at support@mole-cleaner.com

**Q: Can I use this on multiple Macs?**  
A: Each token is single-use. Purchase a new token for each Mac.

**Q: How long does cleanup take?**  
A: Usually 5-10 minutes depending on your system.

---

Made with 💜 by the Mole Team 🦫
