# Cloudflare Worker Cache Setup

This guide explains how to deploy and configure the JSONBin caching proxy Worker that was added to this project. After following these steps, all JSONBin reads will be cached at Cloudflare's edge for 30 seconds — shared across all users hitting the same PoP — cutting API calls dramatically.

---

## How it works

```
Browser → GET /api/notes → Cloudflare Worker
                                  ├── Cache HIT  → return cached snapshot (0 JSONBin calls)
                                  └── Cache MISS → fetch JSONBin, cache 30 s, return

Browser → PUT /api/notes → Cloudflare Worker → JSONBin PUT + cache invalidation
```

- The Worker holds `JSONBIN_BIN_ID` and `JSONBIN_API_KEY` as **encrypted secrets** — they never appear in the browser or in source code.
- The browser's `app.js` calls `/api/notes` (same-origin). JSONBin's domain no longer appears in the browser's network tab.

---

## Prerequisites

```bash
# Install wrangler if you haven't already
npm install -g wrangler

# Log in to Cloudflare (opens a browser tab)
wrangler login
```

---

## Step 1 — Set Worker secrets

These replace the environment variables that used to be set in the Cloudflare Pages / Vercel build settings.

```bash
# Run each command; it will prompt you to paste the value, then press Enter.
wrangler secret put JSONBIN_BIN_ID
wrangler secret put JSONBIN_API_KEY
```

You can also set them via the Cloudflare dashboard:

1. Go to **Workers & Pages** → select `farewell-card`
2. Click **Settings** → **Variables and Secrets**
3. Click **Add variable**, set type to **Secret**, enter the name and value
4. Repeat for both `JSONBIN_BIN_ID` and `JSONBIN_API_KEY`
5. Click **Deploy** to apply

> **Important:** After setting secrets via the dashboard, you must click **Deploy** (or trigger a new deployment) for them to take effect.

---

## Step 2 — Remove old build environment variables

The build step (`node build.js`) no longer needs `JSONBIN_BIN_ID` or `JSONBIN_API_KEY`. Remove them from your build environment to avoid confusion:

**Cloudflare Pages build settings:**
1. Go to **Workers & Pages** → `farewell-card` → **Settings** → **Environment Variables**
2. Delete (or leave unset) `JSONBIN_BIN_ID` and `JSONBIN_API_KEY` under **Build variables**
3. The Worker secrets set in Step 1 are separate — keep those

---

## Step 3 — Build and deploy

```bash
# Build the static site into public/
node build.js

# Deploy Worker + static assets to Cloudflare
wrangler deploy
```

Expected output:
```
Total Upload: ~XX KB / gzip: ~XX KB
Worker Startup Time: X ms
Deployed farewell-card triggers:
  https://farewell-card.<your-subdomain>.workers.dev
```

---

## Step 4 — Verify caching is working

Open your deployed URL and watch the browser DevTools → Network tab:

| Request | Expected |
|---|---|
| `GET /api/notes` on first load | 200, `Cache-Control: public, max-age=30` |
| `GET /api/notes` from second tab within 30 s | Same response, served from Cloudflare edge cache (0 JSONBin calls) |
| `PUT /api/notes` after pinning a note | 200, cache invalidated |
| `GET /api/notes` after a PUT | Fresh fetch from JSONBin, cached again |

To confirm from the JSONBin dashboard: open the app in 3–4 browser tabs simultaneously within 30 seconds. You should see only **1** API call recorded in JSONBin (the first tab's miss), not 4.

---

## Step 5 — Local development

To develop locally with the Worker running:

```bash
# Create a .dev.vars file (git-ignored) with your local secrets
cat > .dev.vars <<EOF
JSONBIN_BIN_ID=your-bin-id-here
JSONBIN_API_KEY=your-api-key-here
EOF

# Build first, then start the local dev server
node build.js && wrangler dev
```

The local dev server runs at `http://localhost:8787`. The Worker proxies `/api/notes` to JSONBin using the values from `.dev.vars`.

> If you open `index.html` directly as a file (`file://` URL) without wrangler dev, the app shows mock data — that's the intended fallback.

---

## Cache TTL tuning

The cache duration is set at the top of `src/worker.js`:

```js
const CACHE_TTL = 30; // seconds
```

- **30 s** (current): new notes from other users appear within 30 s. Good balance.
- **60 s**: halves the remaining cache-miss calls; new notes take up to 60 s to appear.
- **10 s**: near-real-time but more misses. Only worth it if you have very high traffic.

Change this value and redeploy (`wrangler deploy`) — no other changes needed.

---

## How the combined savings add up

Before (with 15 s polling, 4 concurrent users):
- Page loads: 4 GETs (one per user)
- Polling: 4 users × 4 polls/min = **16 GET calls/min**

After (with 60 s polling + 30 s Worker cache):
- Page loads within same 30 s window: **1 GET** (cache miss for first user, hit for rest)
- Polling: 4 users × 1 poll/min, but all 4 within same 30 s → **1 GET/min**

Rough reduction: **~20× fewer JSONBin API calls** under normal usage.
