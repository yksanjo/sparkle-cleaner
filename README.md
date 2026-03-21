# Sparkle Cleaner ✨

## Your Mac has been collecting junk since the day you bought it — and you've never been told.

Every website you visit, every product you browse on Amazon, every photo you scroll past on Pinterest — your Mac quietly saves a copy of all of it. Not to help you. Just because that's what it does by default.

After a year of normal use, most people have **over 20 GB of hidden files** they don't know about: website caches, app logs, old update files, tracking data from shopping sites, crash reports from apps you deleted months ago.

This stuff doesn't show up in your regular storage view. It sits in hidden system folders and slowly eats your disk space and makes your Mac feel sluggish.

**Sparkle finds it, shows you exactly what it is, and removes it — with your permission at every step.**

---

### Sound familiar?

- Your Mac says storage is full but you don't know why
- It runs slower than it used to, even though you haven't installed anything new
- You get a "Your disk is almost full" warning but can't figure out what to delete
- You shop online a lot and your browser feels heavy

That's what this is for.

---

### What's hiding on your Mac right now

Every time you do this... | Your Mac silently saves...
--- | ---
Browse Amazon, Etsy, or ASOS | A copy of every product image you saw — 3 to 10 MB per page
Scroll Pinterest or Instagram | Hundreds of thumbnail images, saved locally after every session
Watch YouTube or a streaming site | Video buffer files sitting in temporary storage
Use any app, even briefly | Log files, crash reports, and update leftovers that never get cleaned up
Shop online for 30 minutes | Up to 200 MB of new hidden data — every single session

Safari alone can quietly build up to **16 GB** of this data. Most people have never cleared it once.

---

### What Sparkle does

1. **Scans your Mac for free** — no payment, no account, no install
2. **Shows you a plain-English report** of what it found and how much space it's taking
3. **Asks for your approval before removing anything** — you see every action before it happens
4. **Pay $1 only if you want to proceed** — that covers the AI cost, there's no profit here

Nothing gets deleted without you saying yes. You can stop at any point.

---

### How to run it

Open **Terminal** on your Mac (press `Command + Space`, type "Terminal", hit Enter) and paste this:

```bash
curl -O https://raw.githubusercontent.com/yksanjo/sparkle-cleaner/master/scripts/sparkle.sh && chmod +x sparkle.sh && ./sparkle.sh
```

That's it. It will scan and show you what it found. No payment needed for the scan.

**Never used Terminal before?** That's fine. You're just pasting one line. It won't change anything on your Mac until you explicitly say yes.

---

### What you'll see

```
Sparkle found 18.4 GB of hidden files on your Mac.

Here's what I found:
  Safari browser cache .............. 4.2 GB
  Chrome browser cache .............. 2.8 GB
  App logs & crash reports .......... 1.1 GB
  System caches ..................... 6.3 GB
  Old temporary files ............... 4.0 GB

Want to clean this up? Each action will be shown to you first.
Pay $1 to proceed → [link]
```

---

### What it will never touch

- Your photos, videos, music, or documents
- Your Desktop or Downloads (unless you say yes)
- Any app you actively use
- Anything you haven't approved

---

### Why does it cost $1?

This tool uses Claude AI (made by Anthropic) to analyze what's safe to remove. That API call costs roughly $0.10 per scan. The $1 covers that cost and keeps the tool running. There's no subscription, no upsell, and I don't make money from this.

---

### Is this safe? Who made it?

I'm [Yoshi Kondo](https://github.com/yksanjo). I built this because I kept doing the same manual cleanup on my own Mac and wanted something that could do it safely and explain what it was doing.

The entire script is open source — meaning anyone can read exactly what it does before running it. If you're technically inclined, read `scripts/sparkle.sh` line by line. Nothing is hidden.

---

### For developers

Want to self-host this, skip the $1, or run it on your own API key? Full setup instructions below.

<details>
<summary>Self-hosting setup</summary>

**Requirements:** Node.js 18+, Stripe account, Anthropic API key

```bash
git clone https://github.com/yksanjo/sparkle-cleaner.git
cd sparkle-cleaner
npm install
cp .env.example .env
# fill in your keys
npm run dev
```

**Environment variables:**
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_SECRET=your_secret_here
PORT=3000
FRONTEND_URL=http://localhost:3000
```

**Stripe webhook:**
1. Stripe Dashboard → Developers → Webhooks
2. Endpoint: `https://your-domain.com/api/stripe/webhook`
3. Event: `checkout.session.completed`

</details>

---

MIT License · Built by [Yoshi Kondo](https://github.com/yksanjo) · Powered by [Anthropic Claude](https://anthropic.com)
