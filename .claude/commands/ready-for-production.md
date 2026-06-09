---
description: Run the pre-deploy readiness checklist for the Farewell Card and give a go / no-go verdict.
argument-hint: "[optional: deploy target, e.g. cloudflare | vercel]"
allowed-tools: Bash, Read, Grep, Glob
---

You are doing a **production-readiness review** of this Farewell Card before it
goes live. Deploy target (if given): `$ARGUMENTS` — otherwise assume Cloudflare
Workers (the project default).

Work through every check below. For each, actually inspect the repo (run the
command / read the file) — do **not** assume. Report each as ✅ pass, ⚠️ warning,
or ❌ blocker, with a one-line reason and the fix. End with a clear
**GO / NO-GO** verdict: NO-GO if any ❌ blocker exists.

## 1. Secrets are safe (blockers)
- `git ls-files | grep -E '\.dev\.vars$'` returns nothing (the local secrets file is never committed).
- No JSONBin credentials in tracked files: search for bcrypt-style keys (`\$2[aby]\$`) and filled `JSONBIN_API_KEY=`/`JSONBIN_BIN_ID=` assignments in code/config (Markdown docs may show the empty format — that's fine).
- `.gitignore` still lists `.dev.vars`.
- `config.example.js` keeps the credential values **empty**.

## 2. Backend wiring
- `src/worker.js` reads creds from `env.JSONBIN_BIN_ID` / `env.JSONBIN_API_KEY` (never hardcoded).
- The JSONBin bin has been created and initialized to exactly `{"notes":[]}` (ask the user to confirm — can't be verified from the repo).
- For the chosen target, the two secrets are set: Cloudflare → Worker **encrypted secrets**; Vercel → **Environment Variables**. (Ask the user to confirm.)

## 3. Security headers intact (blocker if weakened)
- `src/worker.js` `withSecurityHeaders` still sets, un-weakened: `Strict-Transport-Security` (max-age ≥ 31536000), `Content-Security-Policy` (no `*`, no `'unsafe-eval'`), `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`.
- CSP `connect-src` is `'self'` (browser never calls JSONBin directly).

## 4. Build & output
- `node build.js` runs clean and produces `public/index.html`, `public/app.js`, `public/config.js`, and `public/assets/`.
- No references to deleted/missing assets: every `src` / `data-original-src` / `data-beach-src` in `index.html` resolves to a file in `assets/` (a missing original-theme mascot is allowed — it hides via `onerror` — but flag it).

## 5. Personalization & polish
- `config.js` has been personalized (recipientName is not still the generic `"Friend"`, unless intended as a public template default).
- README hero image: `docs/screenshot.png` exists (warn if still the placeholder).
- No stray `TODO`/`FIXME`/`console.log` of sensitive data in `app.js`.

## 6. Reachability (warning, not blocker)
- If any recipients are in mainland China, confirm the deploy host is reachable there — Cloudflare (HK PoP) is the project's recommended default; Vercel may be blocked.

## Output format
Print a table of all checks with status + reason, then the **GO / NO-GO** verdict.
For any ❌ or ⚠️, give the exact command or file edit to fix it. Be concise.
