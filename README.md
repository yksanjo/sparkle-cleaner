# Sparkle Cleaner

> **The average Mac shows 22 GB of hidden junk on its very first scan — even if you only use it for shopping, email, and browsing.**

Every time you scroll Amazon, browse Etsy, or pin something on Pinterest, your Mac quietly caches every product image, thumbnail, and page asset it loads. A single hour of online shopping adds roughly 100 MB of cached data. Do that a few times a week and within a year you're looking at 47 GB of files your Mac is holding onto for no reason — slowing things down, triggering low storage warnings, and sitting invisible in folders most people never open.

Sparkle scans those folders, shows you exactly what it found, and asks before touching anything.

**Scan is free. $1 to execute — that's the Anthropic API cost, nothing more.**

**Everything this script does is visible in this repo. Read it before running it.**

---

### What's actually building up on your Mac

| What you do | What your Mac stores without telling you |
|-------------|------------------------------------------|
| Browse Amazon or Etsy | Every product photo cached locally — 3–10 MB per page |
| Scroll Pinterest or Instagram | Hundreds of image thumbnails, cached per session |
| Watch YouTube or Netflix | Video buffer files in temporary storage |
| Shop on multiple sites in one session | 60–200 MB of new cache per 30-minute session |
| Use any app at all | App logs, crash reports, and update files that never self-delete |

Safari alone can accumulate up to **16 GB** of browser cache. Most people have never cleared it.

---

## How it works

1. Download and run `sparkle.sh` — no payment needed yet
2. It scans your Mac and shows you exactly what it found
3. Before deleting anything, it prints each command and asks for your confirmation
4. If you decide to proceed, pay $1 via Stripe to unlock execution
5. Cleanup runs with your approval at every step

The $1 charge exists solely to cover the Anthropic API cost (~$0.10/run). I'm not trying to make money from this.

---

## What it touches

| Location | What it is |
|----------|-----------|
| `~/Library/Caches/*` | App caches |
| `/Library/Caches/*` | System caches |
| `~/Library/Logs/*` | Log files |
| `/tmp/*` | Temporary files |
| Browser caches | Chrome, Safari, Firefox |
| Xcode Derived Data | Build artifacts |
| `__pycache__/` | Python bytecode |
| `~/Downloads` | Old files — asks you first |

**Never touches:** Documents, Photos, Music, Videos, Desktop, application data.

---

## Usage

```bash
# Download the script
curl -O https://raw.githubusercontent.com/yksanjo/sparkle-cleaner/master/scripts/sparkle.sh
chmod +x sparkle.sh

# Run the free scan
./sparkle.sh

# If you want to proceed, run with your token
./sparkle.sh sparkle_your_token_here
```

The script will show you output like this before doing anything:

```
Found 2.1 GB of cache files.

Planned actions:
  [1] rm -rf ~/Library/Caches/com.google.Chrome
  [2] rm -rf ~/Library/Caches/com.apple.Safari
  [3] rm -rf ~/Library/Logs/DiagnosticReports

Approve action [1]? [y/N]
```

Nothing runs without a `y`.

---

## Why the terminal?

No app install means no persistent process on your machine and nothing that needs updating. The script runs once, does its job, and is gone. You can read every line of it at `scripts/sparkle.sh`.

---

## Self-hosting

If you'd rather run this yourself without paying anything, the full backend is here.

### Requirements

- Node.js 18+
- Stripe account (for payment handling)
- Anthropic API key

### Setup

```bash
git clone https://github.com/yksanjo/sparkle-cleaner.git
cd sparkle-cleaner
npm install
cp .env.example .env
# Fill in your keys
npm run dev
```

### Environment variables

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_SECRET=your_admin_secret_here
PORT=3000
FRONTEND_URL=http://localhost:3000
```

### Stripe webhook

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Event: `checkout.session.completed`
4. Copy signing secret to `.env`

---

## Architecture

```
sparkle.sh
  └── free scan (no token needed)
  └── paid execution (token from Stripe)
        └── validates token against backend
        └── calls Claude API to analyze findings
        └── prints each rm command, waits for y/N
        └── marks token as used
```

Backend is Node.js/Express. Token store is file-based (`data/tokens.json`) — good enough for personal use, swap for a database if you scale.

---

## Security

- Tokens expire after 24 hours
- Each token is single-use
- Stripe webhook signature verified on every request
- Admin endpoint requires `ADMIN_SECRET` header
- No user data is stored beyond the cleanup session

---

## Built by

[Yoshi Kondo](https://github.com/yksanjo) — I built this because I kept running the same manual cache cleanup commands. Powered by [Anthropic's Claude](https://anthropic.com).

MIT License.
