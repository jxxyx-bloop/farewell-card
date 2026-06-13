# Farewell Card

A collaborative farewell card where your whole team can pin sticky-note goodbyes on a shared board — synced live for everyone, and deployable on free hosting in minutes.

<p>
  <a href="https://farewell-card.jiayilee.workers.dev/"><img alt="Live demo" src="https://img.shields.io/badge/Live_demo-Open-1f2937?style=flat-square"></a>
  <img alt="No build framework" src="https://img.shields.io/badge/Build_framework-None_required-1f2937?style=flat-square">
  <img alt="Hosting" src="https://img.shields.io/badge/Hosting-Free_tier-1f2937?style=flat-square">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/License-Apache_2.0-1f2937?style=flat-square"></a>
</p>

### [**Try the live demo →**](https://farewell-card.jiayilee.workers.dev/)

See a real deployed card in action before you make your own.

> **If this helps you say a thoughtful goodbye, please star the repo.** It's the simplest way to say thanks, and it helps other teams find the project.

**Original theme**
![Farewell Card — original theme, with notes pinned](docs/screenshot.png)

**Beach theme**
![Farewell Card — beach theme, with notes pinned](docs/screenshot-beach.png)

<sub>Switch between the two built-in themes at any time using the toggle in the corner.</sub>

---

## Before you begin — what you'll need

You don't need to be a developer to build this card, but you **do** need three free accounts. Each one plays a specific role, and you can create all three in your browser in a few minutes. None of them require a credit card to get started.

| What to create | Why it's needed | Where to sign up |
|---|---|---|
| **1. A GitHub account** | This is where your copy of the card lives, and where you'll make every edit. Everything starts here. | [github.com](https://github.com/signup) |
| **2. A JSONBin account** | This is the **database** that quietly stores every note your team leaves on the card. | [jsonbin.io](https://jsonbin.io) |
| **3. A Cloudflare account** | This is the **web host** that publishes your card to a real, shareable link. | [cloudflare.com](https://dash.cloudflare.com/sign-up) |

A little more on each:

- **GitHub — your starting point.** GitHub is where the project is stored and shared. If you've just opened this page from a link someone sent you, **the very first thing to do is create your own free GitHub account.** Once you're signed in, you can make your own copy of this card with a single click (Step 1 below).

- **JSONBin — your database.** Every card needs somewhere to keep the notes people write. We use [JSONBin.io](https://jsonbin.io) for this: it's a simple, free place to store data online, so you don't have to set up or run a database yourself. The free tier is more than enough for a farewell card.

- **Cloudflare — your web host.** Writing the card isn't enough; it needs to live somewhere on the internet so your team can open it. We recommend [Cloudflare](https://dash.cloudflare.com/sign-up) because it's free, fast worldwide, keeps your data secure, and — importantly for cross-region teams — tends to stay reachable for colleagues based in mainland China. The full reasoning is in [Hosting: why Cloudflare](#hosting-why-cloudflare).

> Once you have these three accounts, you're ready. The steps below walk you through the rest.

---

## Why you'll love this

This isn't just a card — it's a **complete, deployable full-stack app you can own end-to-end**:

- **A polished frontend** — vanilla HTML/CSS/JS with theming, handwriting fonts, emoji reactions, replies, confetti, and milestone toasts. No build framework to learn.
- **A real backend** — an edge function that proxies storage, caches reads, and keeps your API keys server-side, never in the browser.
- **Free web hosting** — HTTPS and hardened security headers out of the box.

You can use it two ways:

1. **Send a heartfelt goodbye** your whole team can sign in seconds.
2. **Learn full-stack by shipping something real** — it's roughly 600 lines of approachable code that shows how *frontend → API → storage → deploy* fit together. A great first deployed project, minus the boilerplate.

You can build and deploy the whole thing **from your web browser** — no terminal required.

---

## Make your own card

> **Never used a terminal?** You don't need one. The numbered steps below are all done in your browser. Command-line shortcuts are tucked into the *"Prefer the command line?"* boxes for those who want them.

<details>
<summary><strong>Publishing this as a template for your team?</strong> (one-time maintainer setup)</summary>

<br>

If you're the person sharing this repo so colleagues can make their own cards:

1. **Create a public repo** on GitHub (**New repository** → name it, e.g. `farewell-card` → **Public** → **Create**), then add this project to it.
2. **Turn on the template flag** so everyone sees a green **"Use this template"** button: open the repo's **Settings** and tick **"Template repository"**.
3. *(Optional)* Add a repo **description** and **topics** (`farewell`, `template`, `cloudflare-workers`) so it's easy to find.

That's it — colleagues now follow the numbered steps below to spin up their own copy.

<details>
<summary>Prefer the command line?</summary>

```bash
gh repo edit <owner>/farewell-card --template
```
</details>

</details>

### Step 1 — Get your own copy

Click the green **"Use this template" → "Create a new repository"** button at the top of this repo, give it a name, and click **Create**. You'll get your own independent copy with a clean history.

> Only *fork* the repo if you intend to improve the template itself and open a pull request back here.

<details>
<summary>Prefer the command line?</summary>

```bash
git clone https://github.com/jxxyx-bloop/farewell-card.git
```
</details>

### Step 2 — Personalize

`config.js` is the **only file you need to edit** for basic use. In your new repo on GitHub, open `config.js`, click the pencil (edit) icon, change the values, then **Commit changes**:

```js
window.CARD_CONFIG = {
  recipientName: "Alex",                          // who it's for
  subtitle: "A board full of love from your team",
  composePrompt: "Leave a note for",              // → "Leave a note for Alex"
};
```

### Step 3 — Set up your storage (your database)

Notes are stored in [JSONBin.io](https://jsonbin.io), and the free tier is plenty. All of this is done in your browser:

1. **Sign up** at jsonbin.io.
2. **Create a Bin**, set its content to exactly `{"notes":[]}`, then **Save**.
3. Copy the **Bin ID** (shown in the bin's URL and header).
4. Open **Account → API Keys** and copy your **X-Access-Key**.

Keep those two values handy for the next step.

### Step 4 — Publish it (deploy to Cloudflare)

See [Hosting: why Cloudflare](#hosting-why-cloudflare) below for the reasoning. The result is a public link you can share with your team.

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and choose **Workers & Pages → Create → Workers**.
2. Choose **Connect to Git** and pick your repo.
3. After it deploys, open the worker's **Settings → Variables and Secrets** and add two **encrypted secrets**:
   - `JSONBIN_BIN_ID` — your Bin ID from Step 3
   - `JSONBIN_API_KEY` — your X-Access-Key from Step 3
4. Redeploy.

<details>
<summary>Prefer the command line? (Wrangler)</summary>

```bash
npm install -g wrangler
wrangler login
wrangler secret put JSONBIN_BIN_ID     # paste your Bin ID
wrangler secret put JSONBIN_API_KEY    # paste your X-Access-Key
node build.js && wrangler deploy
```
</details>

### Step 5 — Share

Send the public link to your team, and watch the notes roll in.

---

## Run it locally

This section is for developers who want to preview changes on their own machine. It's entirely optional — you can build and deploy the whole card from your browser without it.

<details>
<summary>Show local development steps</summary>

```bash
cp config.example.js .dev.vars      # create your local secrets file (git-ignored)
# edit .dev.vars and fill in JSONBIN_BIN_ID and JSONBIN_API_KEY
node build.js && wrangler dev       # → http://localhost:8787
```

Opening `index.html` directly as a `file://` URL shows **mock data** (there's no backend in that context) — handy for previewing the look without any setup.

</details>

---

## Hosting: why Cloudflare

**Cloudflare Workers is the recommended host**, and the choice is deliberate:

- **Reachable for China-based colleagues.** Cloudflare's global edge network typically serves mainland-China visitors via its Hong Kong point of presence, so the deployed card tends to stay accessible for teammates in China — where many Western-hosted sites are not. For a cross-region team, this is the headline advantage.
- **Your keys stay server-side.** The Worker holds your JSONBin credentials as encrypted secrets — they never reach the browser or get committed to git.
- **Edge caching.** Reads are cached for 30 seconds at the edge, so a flood of simultaneous signers costs roughly *one* JSONBin API call.
- **Free tier with HTTPS** and hardened security headers built in.

<details>
<summary><strong>Prefer Vercel? It works too.</strong></summary>

<br>

You can host on Vercel by swapping the Cloudflare Worker for a Vercel **Serverless Function**:

1. **Add `api/notes.js`** — a Vercel function that mirrors [`src/worker.js`](src/worker.js): handle `GET`/`PUT` on `/api/notes`, proxy to JSONBin with the `X-Access-Key` header, and read the keys from `process.env`.
2. In the Vercel dashboard: [vercel.com](https://vercel.com) → **Add New → Project → Import** your GitHub repo → under **Settings → Environment Variables** add `JSONBIN_BIN_ID` and `JSONBIN_API_KEY` (never in source) → **Deploy**.
3. **Add a `vercel.json`** that serves the static files and **includes the same security headers** as the Worker (`Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`). Don't ship weaker headers.
4. For caching, set `Cache-Control: public, max-age=30` on the function's GET response.

> **Trade-off:** Vercel is simple and popular, but **verify reachability for any China-based recipients before relying on it** — that's exactly why Cloudflare is the default here.

</details>

---

## Customize further

Everything is yours to rebrand — mascots, colours, copy, even the team name. Here's a variation one team built from this template, with their own characters and branding:

![A team's customized variation of the farewell card](docs/variation-shopee.png)

> *The mascots and branding in the example above belong to their respective owners and are **not** part of this template — they're just a showcase of what you can build on top of it. The template ships with the red-panda mascot set.*

| Want to change… | Edit… |
|---|---|
| Recipient name, subtitle, prompt | `config.js` |
| Note colors, emoji set, fonts | the `STICKY_COLORS` / `EMOJIS` / `FONTS` arrays in `app.js` |
| Themes, layout, animations | `style.css` |
| Mascot illustrations | swap the art in `assets/` — see [`assets/README.md`](assets/README.md). The original theme uses the bundled `mascot-*.png` red-panda set; the beach theme uses the bundled `prawn-*.png` set. A missing mascot is hidden automatically, so partial sets are fine. |

---

## Architecture

```text
config.js            Your card settings (recipient name, subtitle, prompt)
index.html           HTML structure only; no inline CSS or JS
style.css            Layout, animations, and responsive styles
app.js               Application logic, sync, rendering, and interactions
src/worker.js        Cloudflare Worker — caches JSONBin reads, keeps secrets server-side
build.js             Copies source files into public/ (no env vars needed)
package.json         Build script + project metadata
wrangler.jsonc       Cloudflare Worker + static assets configuration
config.example.js    Reference for local development secrets (copy to .dev.vars)
```

The browser talks to the Worker at `/api/notes`. The Worker holds the JSONBin credentials as encrypted secrets and caches read responses for 30 seconds, so multiple simultaneous page loads cost only one JSONBin API call.

## Features

- Pin sticky notes with messages and author names
- Random pastel colors and handwriting fonts per note
- Two built-in themes (original and beach) with a toggle in the sync status pill
- Emoji reactions and short replies on notes
- Multi-user sync — the board refreshes every 60 seconds
- Edit and delete notes created from the same browser session
- Keyboard shortcut: Cmd/Ctrl+Enter to pin a note
- Confetti animation and milestone toasts

## Security

| Concern | Mitigation |
|---|---|
| API keys in source control | Credentials are Cloudflare Worker secrets — never committed to git or sent to browsers. |
| XSS via message or author | All user text is escaped with `escapeHtml()` before rendering. |
| Style injection | Rotation values are cast to numbers before use in inline styles. |
| Security headers | Served by the Worker on every response (HSTS, CSP, X-Frame-Options, etc.). |

See [SECURITY.md](SECURITY.md) for details and how to report a vulnerability.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[Apache License 2.0](LICENSE).
