# The Asking Company

Two halves, one site:

- **The company** (`/`, `/prospectus`, `/filings`, `/careers`, `/legal`, `/contact`, `/shop`): the joke. Paper, banknote frames, one spot ink per page.
- **The Library** (`/writing`): the quiet half. A lit bookcase with filters and full-text search, and essays set for reading.

Built with [Astro](https://astro.build) as a static site and deployed as a Cloudflare Worker with static assets. The few dynamic parts (payments, the live counter and ledger, the mailing list, link previews) are small handlers in `functions/`, routed by `src/worker.js`, backed by a Cloudflare D1 database.

## Adding a piece of writing

Add one Markdown file to `src/content/writing/`. The filename becomes the URL: `the-fourth-house.md` → `/writing/the-fourth-house`.

```markdown
---
title: The fourth house.
dek: On the things people buy once the obvious things are bought.
date: 2026-10-14
series: succession          # a shelf id from src/data/series.js
tags: [money, houses]
company: false              # true = written for the company, in its voice
spine: '#7a2e1d'            # optional cloth colour; otherwise one is picked for you
spineInk: '#f6e9df'         # optional text colour on the spine
height: 220                 # optional spine height, 160–250
draft: false                # true = only visible in `npm run dev`
---

Write here. ## Headings, > pull quotes, *italics*, footnotes[^1], --- for a section break.

[^1]: Like this.
```

The rest is automatic: the spine's thickness follows the word count, and the book appears on its shelf, the home page, the RSS feed, the sitemap, and in the filters.

- **Shelves** live in `src/data/series.js`. Add a new one there. A shelf only appears once it holds a written volume; planned titles on an empty shelf wait with it.
- **Link previews.** Every essay gets its own preview image (`/og/<slug>.png`), drawn on the edge from the book's cover by `functions/og/[slug].js`. Nothing to do per essay.
- **Unwritten books** (dashed outlines) are the `PLANNED` list in the same file. Delete an entry once the real piece exists.

## Reading features

Every essay page has a floating **Listen · Aa · Share** pill.

- **Aa** opens the reading settings: typeface (Newsreader, Inter, Atkinson Hyperlegible, OpenDyslexic), size, spacing, width, theme (paper / sepia / night) and a focus mode that dims everything but the paragraph you are on. Settings are remembered in the browser and applied before the page paints.
- **Listen** reads the essay aloud with the browser's own voice and highlights the paragraph being read.
- **The rail** on the right shows progress with a tick for every section: hover for the name, click to jump.
- The page remembers where you stopped and offers to resume. Selecting text offers *Copy quote*. ← and → move between essays.
- Clicking a book lifts it off the shelf, turns it to face you, opens the cover onto blank pages, and brings the open book toward you until the page is the screen; the essay then settles onto it piece by piece. Leaving (any Library link, or Escape) runs it in reverse: the text fades, the page shrinks back into the book, the cover closes, and the book flies home to its slot on the shelf. (With "reduce motion" on, it just navigates.)
- Each shelf has a **Follow this shelf** form; the address is stored with the shelf's id in the `series` column of `subscribers`, so you can email only the people who follow a series. The form at the bottom of the Library subscribes to everything.

## Search

Search in the Library reads the essays themselves, not only titles. [Pagefind](https://pagefind.app) builds the index after each `npm run build` (that is the `pagefind --site dist` in the build script) and splits it into small chunks, so the browser only downloads the pieces a query touches — it stays fast with hundreds of essays. Results show the matching passage with the words highlighted and link straight to the section. In `npm run dev` the index does not exist, so search falls back to titles and summaries.

## Running it locally

```sh
npm install
npm run dev            # site only, at http://localhost:4321 (payments show "not switched on")
```

To run the backend too:

```sh
npx wrangler d1 migrations apply asking-company --local
npm run build && npm run preview      # the Worker, at http://localhost:8787
```

Put local secrets in `.dev.vars` (git-ignored):

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Going live

You need three things: a Cloudflare account (free), your Stripe account, and the domain at GoDaddy.

### 1. Cloudflare

1. Create a free account at cloudflare.com.
2. **Workers & Pages → Create application → Import a repository** → pick this repo. Production branch `main`, build command `npm run build`, deploy command `npx wrangler deploy` (the defaults). Every push to `main` then builds and deploys.
3. **The database.** Storage & Databases → D1 → Create → name `asking-company`. Open it → Console → paste `migrations/ALL.sql` → Execute. Copy its Database ID into `wrangler.toml` (uncomment the `[[d1_databases]]` block) and push.
4. **Custom domain.** Open the Worker → Settings → Domains & Routes → Add → Custom domain → `askingcompany.com` (and `www`).

### 2. The domain (GoDaddy → Cloudflare)

1. In Cloudflare, use **Add a domain**, enter `askingcompany.com` and choose the Free plan. Cloudflare shows you two nameservers.
2. In GoDaddy, go to **My Products → the domain → DNS → Nameservers → Change → "I'll use my own nameservers"** and paste Cloudflare's two.
   This takes anywhere from minutes to a few hours.
3. Then add the custom domain to the Worker (step 1.4 above).

The domain stays registered (and billed) at GoDaddy. Only the DNS moves.

### 3. Stripe

1. **Activate the account.** Stripe will check the website, which already has what it looks for: what you sell (the Certificate of Nothing), the price, a contact email, and the refund policy at `/terms`.
   - Product description to give Stripe: *"Digital novelty certificate delivered instantly on screen after purchase (from US$1)."*
   - Statement descriptor: `ASKINGCOMPANY`.
2. **API key.** In **Developers → API keys**, create a restricted key with write access to *Checkout Sessions* only, or use the secret key.
3. **Webhook.** In **Developers → Webhooks → Add endpoint**:
   - URL: `https://askingcompany.com/api/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.created`
   - Copy the signing secret (`whsec_…`).
4. **Secrets.** Open the Worker → **Settings → Variables and Secrets** and add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` as *secrets*.
5. **Card testing.** A $1 checkout is exactly what people with stolen cards use to test them, and each dispute costs ~$15. Stripe Checkout runs Radar automatically. In **Radar → Rules**, also turn on *"Block if :risk_level: = 'elevated'"*. If you see a burst of failed $1 payments, add a Cloudflare rate-limiting rule on `/api/checkout`.

Test first with `sk_test_…` keys and card `4242 4242 4242 4242`. Then switch to live keys.

### How a payment flows

1. "Give me one dollar" → confirm modal (with an optional ledger name).
2. `POST /api/checkout` creates a Stripe Checkout Session for one *Certificate of Nothing* at $1, or $2, $4, … on the doubling ladder.
3. Stripe takes the payment (cards, Apple Pay, Google Pay) and returns to `/thanks?session_id=…`.
4. `/thanks` asks `/api/session`, which confirms with Stripe directly, records the gift, and returns the giver number. The page draws the certificate, which can be downloaded as a PNG.
5. The webhook records the same gift independently (idempotent, so it is never counted twice) and marks refunds and disputes so they leave the total.

## Analytics

Cloudflare Web Analytics is free and uses no cookies. In the dashboard go to **Analytics & Logs → Web Analytics → Add a site**, copy the token, and put it in `analyticsToken` in `src/site.config.js`. Leave it empty to run with no analytics at all.

## Running the ledger

Names are public. Anything with a link or @handle becomes "Anonymous" automatically. To also block words, put them comma-separated in `BLOCKED_WORDS` in `wrangler.toml` (or the dashboard).

To take a name off the ledger (the money stays counted):

```sh
npx wrangler d1 execute asking-company --remote --command "UPDATE gifts SET hidden = 1 WHERE name LIKE '%something%'"
```

Mailing-list addresses go into the `subscribers` table. To export them:

```sh
npx wrangler d1 execute asking-company --remote --command "SELECT email, writings, billion FROM subscribers" --json
```

## Where things live

| What | Where |
| --- | --- |
| Domain, contact email | `src/site.config.js` |
| Essays | `src/content/writing/*.md` |
| Shelves and unwritten books | `src/data/series.js` |
| The ask in 112 languages | `src/data/langs.js` |
| Company pages | `src/pages/*.astro` |
| Library styles / book 3D | `src/styles/library.css`, `src/styles/book.css` |
| Shelf motion and filters | `src/scripts/library.js` |
| Payment flow (client) | `src/scripts/ask.js`, `src/pages/thanks.astro` |
| Payment backend | `functions/api/*.js`, routed by `src/worker.js` |
| Database schema | `migrations/` |
