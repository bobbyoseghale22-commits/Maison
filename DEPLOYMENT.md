# Maison Noir — Render Deployment Checklist

## Pre-deployment

### 1. Environment variables

Copy every variable from `.env.example` and set it in Render's
**Environment** tab (Dashboard → your service → Environment).

| Variable | Where to get it | Notes |
|---|---|---|
| `NODE_ENV` | — | Set to `production` |
| `NEXT_PUBLIC_APP_URL` | Your Render URL or custom domain | No trailing slash. Example: `https://maisonoir.com` |
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers | Use `mongodb+srv://…` form; whitelist `0.0.0.0/0` in Atlas Network Access for Render |
| `AUTH_SECRET` | `npx auth secret` | Must be ≥ 32 random chars; **do not** use the placeholder from `.env.example` |
| `AUTH_URL` | Same as `NEXT_PUBLIC_APP_URL` | Required for production callbacks |
| `AUTH_TRUST_HOST` | — | Set to `true` (Render runs behind a proxy) |
| `AUTH_GOOGLE_ID` | Google Cloud Console → OAuth 2.0 | Optional; omit if not using Google sign-in |
| `AUTH_GOOGLE_SECRET` | Google Cloud Console | Optional |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API keys | Use live key `sk_live_…` in production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard | Use live key `pk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → reveal signing secret | See step 4 |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Console → Dashboard | |
| `CLOUDINARY_API_KEY` | Cloudinary Console → API Keys | |
| `CLOUDINARY_API_SECRET` | Cloudinary Console → API Keys | Keep secret; never prefix with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Same as `CLOUDINARY_CLOUD_NAME` | Used by client-side upload widget |
| `CLOUDINARY_UPLOAD_PRESET` | Optional unsigned preset | Leave blank if using signed uploads only |

### 2. MongoDB Atlas configuration

- [ ] Create a **production cluster** (M10+ for real traffic; M0 free tier for staging).
- [ ] In **Network Access**, add `0.0.0.0/0` to allow Render's dynamic IPs, **or** use [Render's static outbound IP feature](https://docs.render.com/static-outbound-ip-addresses) (available on paid plans) to allowlist specific IPs.
- [ ] In **Database Access**, create a dedicated user with `readWrite` on the production database only — no `atlasAdmin`.
- [ ] Enable **Atlas backups** (continuous or daily snapshot).
- [ ] In **Atlas Search** (optional), create an index on the `products` collection for full-text search if you want Atlas Search to replace the Mongoose `$text` index.

### 3. Stripe configuration

- [ ] Switch API keys from test (`sk_test_…`) to live (`sk_live_…`).
- [ ] In the Stripe Dashboard → **Webhooks**, create an endpoint:
  - URL: `https://your-domain.com/api/stripe/webhook`
  - Events to listen for: `checkout.session.completed`
- [ ] Copy the **signing secret** (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.
- [ ] Test the webhook with the Stripe CLI: `stripe trigger checkout.session.completed`

### 4. Cloudinary configuration

- [ ] Create a dedicated **production environment** in Cloudinary (separate from dev).
- [ ] Verify the `maison-noir/products` folder exists (created on first upload).
- [ ] Set up an **Upload Preset** if using unsigned client-side uploads (optional).
- [ ] Enable **Auto-format** and **Auto-quality** on the delivery profile for automatic WebP/AVIF conversion.

---

## Render service setup

### Web Service settings

| Setting | Value |
|---|---|
| **Environment** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node .next/standalone/server.js` |
| **Node Version** | 20 (LTS) |
| **Instance Type** | Standard (512 MB RAM minimum; use 1 GB for production) |
| **Auto-Deploy** | Yes (main branch) |

### `render.yaml` (already in repo)

The `render.yaml` in the project root defines the service. Review it and
confirm the `startCommand` matches the Next.js standalone server entry point.

---

## Post-deploy checklist

### DNS & SSL
- [ ] Point your custom domain to Render (CNAME or A record per [Render docs](https://docs.render.com/custom-domains)).
- [ ] Render provisions a free Let's Encrypt SSL certificate automatically — verify HTTPS is active.
- [ ] Update `NEXT_PUBLIC_APP_URL` to use your custom domain (not the `onrender.com` URL) so OG images and canonical URLs resolve correctly.

### Google Search Console
- [ ] Add your property at [search.google.com/search-console](https://search.google.com/search-console).
- [ ] Verify ownership (HTML tag method: copy the `content` value and add it to `verification.google` in `src/app/layout.tsx`).
- [ ] Submit the sitemap: `https://your-domain.com/sitemap.xml`.

### Stripe live-mode verification
- [ ] Place a real test order (use a real card, refund immediately).
- [ ] Confirm the webhook fires and the order is marked paid in the admin.
- [ ] Confirm Cloudinary images appear in order confirmation emails (if configured).

### Performance baseline
- [ ] Run [PageSpeed Insights](https://pagespeed.web.dev) on the home page and a product page.
- [ ] Verify images are served as WebP or AVIF (check Network tab → filter by `image`).
- [ ] Confirm `Cache-Control: immutable` is set on `/_next/static/` assets.
- [ ] Verify the sitemap returns 200: `curl https://your-domain.com/sitemap.xml`.
- [ ] Verify robots.txt returns 200: `curl https://your-domain.com/robots.txt`.

### Security headers
Run [securityheaders.io](https://securityheaders.io) against your domain and confirm:
- [ ] `X-Frame-Options: SAMEORIGIN` ✓
- [ ] `Content-Security-Policy` ✓
- [ ] `Strict-Transport-Security` ✓
- [ ] `X-Content-Type-Options: nosniff` ✓
- [ ] `Referrer-Policy` ✓
- [ ] `Permissions-Policy` ✓

---

## Ongoing operations

### Keeping secrets rotated
- Rotate `AUTH_SECRET` annually (or immediately on suspected compromise). Existing sessions will be invalidated.
- Rotate Stripe API keys via the Stripe dashboard; update `STRIPE_SECRET_KEY` in Render environment and redeploy.
- Rotate Cloudinary API secret via the Cloudinary console.

### Monitoring
- [ ] Enable **Render service logs** notifications (email or Slack alert on crash).
- [ ] Set up [MongoDB Atlas Alerts](https://www.mongodb.com/docs/atlas/monitoring-alerts/) for connection pool exhaustion and slow queries (>100ms).
- [ ] Optionally add [Sentry](https://sentry.io) for error tracking: `npm install @sentry/nextjs` and follow their Next.js setup guide.

### Database maintenance
- [ ] Schedule a monthly **index review** in MongoDB Atlas Performance Advisor.
- [ ] Enable **Atlas Auto-Scaling** if the catalog grows past 10,000 products.
- [ ] Review Mongoose connection pool size (`maxPoolSize: 10` in `src/lib/db/connect.ts`) once under real load — raise to 20 if Atlas CPU/connections spike.

---

## Environment file summary

```bash
# Copy to Render's Environment tab — do not commit to git
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

MONGODB_URI=mongodb+srv://prod-user:password@cluster.mongodb.net/maison-noir?retryWrites=true&w=majority

AUTH_SECRET=<generate with: npx auth secret>
AUTH_URL=https://your-domain.com
AUTH_TRUST_HOST=true
AUTH_GOOGLE_ID=<from Google Cloud Console>
AUTH_GOOGLE_SECRET=<from Google Cloud Console>

STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```
