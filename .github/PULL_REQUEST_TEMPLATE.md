<!-- Thanks for improving Farewell Card! Keep changes focused. -->

## What changed
<!-- A short summary of the change. -->

## Why
<!-- The problem this solves or the motivation. Link any related issue (#123). -->

## Checklist
- [ ] No secrets committed — checked `git diff --staged` for `.dev.vars`, API keys, or tokens
- [ ] User-supplied text stays escaped (`escapeHtml()`); no `innerHTML` for untrusted content
- [ ] Security headers in `src/worker.js` unchanged or strengthened (HSTS, CSP, `X-Frame-Options`, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`)
- [ ] Still a no-build vanilla HTML/CSS/JS project (no frameworks/bundlers added)
- [ ] `node build.js` runs cleanly
- [ ] Commits are focused — style and logic changes not mixed
