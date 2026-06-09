# Security Policy

## How credentials are handled

This project is designed so that **secrets never live in source control or reach the browser**:

- The JSONBin credentials (`JSONBIN_BIN_ID`, `JSONBIN_API_KEY`) are stored as **encrypted Cloudflare Worker secrets**, set via `wrangler secret put` or the Cloudflare dashboard.
- For local development, they go in a **`.dev.vars`** file, which is **git-ignored** (see `.gitignore`). Use `config.example.js` as a reference — it contains placeholders only.
- The browser only ever calls the same-origin Worker endpoint `/api/notes`; it never sees the JSONBin keys.

**Never commit real credentials.** Before pushing, double-check `git diff --staged` for any `.dev.vars`, API keys, or tokens.

## Other protections

- All user-supplied text (author names, messages, reactions) is escaped with `escapeHtml()` before rendering — no `innerHTML` for untrusted content.
- The Worker attaches hardened HTTP security headers (HSTS, CSP, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`) to every response. Do not weaken these.
- The Content-Security-Policy denies by default and does not allow external connections — the Worker proxies JSONBin server-side.

## Reporting a vulnerability

If you discover a security issue, please **do not open a public issue**. Instead, report it privately via [GitHub Security Advisories](https://github.com/jxxyx-bloop/farewell-card/security/advisories/new) (or open a minimal issue asking a maintainer to contact you, without disclosing details).

We'll acknowledge your report as soon as we can and keep you updated on a fix.
