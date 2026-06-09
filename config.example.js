// ══════════════════════════════════════════════════════════════════
// LOCAL DEVELOPMENT — Copy this file to .dev.vars and fill in values.
//
//   cp config.example.js .dev.vars
//   node build.js && wrangler dev   →  http://localhost:8787
//
// .dev.vars is git-ignored. Never commit real credentials.
//
// For production, set these as Worker secrets:
//   wrangler secret put JSONBIN_BIN_ID
//   wrangler secret put JSONBIN_API_KEY
// Or via Cloudflare dashboard → Workers & Pages → Settings → Secrets.
// ══════════════════════════════════════════════════════════════════
JSONBIN_BIN_ID=
JSONBIN_API_KEY=
