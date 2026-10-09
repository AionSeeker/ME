# Contact Form Backend (Cloudflare Worker + reCAPTCHA v3)

A small serverless endpoint that receives the contact form submission, verifies
Google reCAPTCHA v3 server-side, and forwards the message as an email via the
[Resend](https://resend.com) API. No redirects — the user stays on your
portfolio the whole time. Resend's free tier lets you send from
`onboarding@resend.dev` without needing your own verified domain, which is
perfect while you don't have one yet.

## Files

- `index.js` — Worker entrypoint (no dependencies)
- `wrangler.toml` — Cloudflare deployment config
- `package.json` — Wrangler devDependency only

## Setup

### 1. Get reCAPTCHA v3 keys

1. Go to https://www.google.com/recaptcha/admin
2. Click **+** to create a new site.
3. Label: anything (e.g. "Portfolio").
4. reCAPTCHA type: **reCAPTCHA v3**.
5. Domains: add `localhost` (for testing) and `aionseeker.github.io` (the deployed portfolio domain).
6. Copy the **Site key** and **Secret key**.

### 2. Get a Resend API key

1. Sign up at https://resend.com (free — no credit card, 3000 emails/month).
2. Go to https://resend.com/api-keys → **Create API Key** → name it "portfolio" → copy the key.
3. While you don't have a verified domain, emails will be sent from `onboarding@resend.dev` (Resend's default). When you get a domain later, verify it at https://resend.com/domains and set `FROM_EMAIL` to your own address.

### 3. Set up the Worker

```bash
cd worker
npm install                  # installs wrangler
npx wrangler login           # opens browser to authenticate with Cloudflare
```

Set the secrets (paste values when prompted):

```bash
npx wrangler secret put RECAPTCHA_SECRET      # paste reCAPTCHA secret key
npx wrangler secret put RESEND_API_KEY        # paste Resend API key
```

The production site is https://aionseeker.github.io/ME/. Its browser origin,
`https://aionseeker.github.io`, is checked into `wrangler.toml` as `PUBLIC_ORIGIN`.
Do not include `/ME/` or a trailing slash in the origin. The existing
`ALLOWED_ORIGIN` secret remains supported for additional local origins; it does
not replace the production origin. An empty configuration allows no origins.

Optional overrides:

```bash
npx wrangler secret put ALLOWED_ORIGIN # optional, e.g. http://localhost:8000
npx wrangler secret put TO_EMAIL      # defaults to ammar...@gmail.com
npx wrangler secret put FROM_EMAIL    # defaults to onboarding@resend.dev
```

### 4. Deploy

```bash
npx wrangler deploy
```

Pushing to GitHub updates the portfolio source; run this deploy command to update
the live Cloudflare Worker too. Existing API-key secrets are preserved.

This prints a URL like:

```
Published contact-form
  https://contact-form.<your-subdomain>.workers.dev
```

Copy this URL — you'll paste it into `main.js` as `WORKER_URL`.

### 5. Wire up the frontend

Open `../main.js` and set:

```js
const RECAPTCHA_SITE_KEY = "your-site-key-here";
const WORKER_URL         = "https://contact-form.<your-subdomain>.workers.dev";
```

## Local development

Run the portfolio locally:

```bash
cd ..
python3 -m http.server 8000
```

Open http://localhost:8000 — the reCAPTCHA badge appears in the bottom-right.
Submit the form; you should see the inline thank-you message and receive the
email at `TO_EMAIL`.

To run the Worker locally with hot reload:

```bash
cd worker
npx wrangler dev
```

The dev server gives you a `http://localhost:8787` URL — point `WORKER_URL` to
that while developing.

## How it works

1. Browser loads `https://www.google.com/recaptcha/api.js?render=SITE_KEY`.
2. On form submit, JS calls `grecaptcha.execute(SITE_KEY, {action: 'submit'})`
   which returns a one-time token.
3. JS POSTs `{ name, email, message, token }` to the Worker as JSON.
4. Worker:
   - Verifies `Origin` matches `PUBLIC_ORIGIN` or an additional `ALLOWED_ORIGIN` entry.
   - POSTs the token to Google's `siteverify` endpoint.
   - Rejects if `success !== true` or `score < 0.5`.
   - Otherwise POSTs the email to Resend's `/emails` endpoint.
5. Worker returns `{ ok: true }` on success, `{ error }` otherwise.
6. JS shows the inline thank-you message, or an inline error if rejected.

## Troubleshooting

- **`403 forbidden_origin`** — the page's origin is absent from `PUBLIC_ORIGIN` and
  the optional `ALLOWED_ORIGIN` secret. For local dev, set it to `http://localhost:8000`.
- **`403 captcha_failed`** — token invalid or score below 0.5. Check that the
  site key in `main.js` matches the secret key's pair, and that the current
  origin is in the reCAPTCHA admin's allowed domains list.
- **No email arrives** — check the Worker logs with `npx wrangler tail`. The
  `Resend error NNN: ...` message will tell you what went wrong. Common cause:
  the API key is wrong or revoked.
