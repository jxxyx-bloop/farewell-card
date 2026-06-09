# Contributing

Thanks for your interest in improving Farewell Card! 💌

> Just want your own card? You don't need to contribute — use the **“Use this template”** button (see the [README](README.md#-make-your-own-card-getting-started)). This guide is for improving the **template itself**.

## Running locally

```bash
cp config.example.js .dev.vars      # fill in JSONBIN_BIN_ID and JSONBIN_API_KEY
node build.js && wrangler dev       # → http://localhost:8787
```

You can also open `public/index.html` after a build to preview with mock data (no backend needed).

## Workflow

1. Fork the repo and create a branch off `main` (e.g. `feature/short-description` or `fix/short-description`).
2. Make your change. Keep commits focused — don't mix unrelated style and logic changes.
3. Open a pull request describing **what** changed and **why**. Link any related issue.

## Code style

This is intentionally a **no-build, vanilla HTML/CSS/JS** project — please keep it that way (no frameworks or bundlers).

Please also:

- **Never commit secrets.** Credentials belong in `.dev.vars` (git-ignored) or Worker secrets — never in source. Check `git diff --staged` before committing.
- **Keep output safe.** Escape all user-supplied text with `escapeHtml()`; don't introduce `innerHTML` for untrusted content.
- **Don't weaken security headers** in `src/worker.js` (HSTS, CSP, `X-Frame-Options`, `Referrer-Policy`, etc.).
- Match the existing formatting and naming of the surrounding code.
- Leave the code at least as tidy as you found it — no leftover `TODO`/`FIXME` without a linked issue, no commented-out blocks.

## Reporting bugs & ideas

Use the [issue templates](.github/ISSUE_TEMPLATE) for bug reports and feature requests. For security issues, see [SECURITY.md](SECURITY.md) — please don't file those publicly.
