# Maison Noir — Considered Menswear

A production-ready e-commerce application built with Next.js 15, TypeScript, MongoDB Atlas, Auth.js v5, Stripe, and Cloudinary. Deployed on Render.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, RSC) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + Shadcn UI |
| Database | MongoDB Atlas + Mongoose |
| Auth | Auth.js v5 (Credentials + Google OAuth) |
| Payments | Stripe Checkout Sessions |
| Media | Cloudinary (direct upload) |
| Hosting | Render (Web Service, standalone) |

## Features

**Storefront**
- Home page with hero, featured categories, product rails, newsletter
- Shop with filtering (category, size, color, price), sorting, pagination
- Product detail with gallery, variant selection, inventory status
- Full-text search with typeahead suggestions
- Cart (guest + authenticated, persistent, merge on login)
- Wishlist with move-to-cart picker
- Checkout with address collection, coupon support, Stripe payment
- Order history and detail pages
- Review system with verified purchase badge, ratings, pagination

**Admin**
- Dashboard with revenue/order/customer stats
- Analytics with revenue/orders/customers charts (SVG, no library)
- Product CRUD with variant builder and Cloudinary image upload
- Order management with status updates and Stripe refunds
- Review moderation (approve/reject/delete)
- Category, customer, coupon management pages

**Security**
- IP-based sliding-window rate limiting (auth, checkout, reviews)
- CSRF protection via Origin header validation
- Input sanitization (HTML stripping, regex injection escaping)
- Centralised error handling (no stack traces to clients in production)
- Full security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy)
- Zod validation at every API boundary

**SEO / Performance**
- Dynamic sitemap (`/sitemap.xml`) — all products + categories
- `robots.txt` — blocks admin/checkout/API, AI crawler opt-out
- Default Open Graph image (edge ImageResponse/Satori)
- Product JSON-LD schema.org (Product, AggregateOffer, AggregateRating)
- ISR with `unstable_cache` on home page data (1hr TTL)
- `generateStaticParams` pre-renders top 50 products at build time
- Image optimization: WebP/AVIF, device size breakpoints, 30-day CDN TTL

## Getting Started

### Prerequisites
- Node.js ≥ 20
- MongoDB Atlas cluster
- Stripe account (test mode keys)
- Cloudinary account

### Install

```bash
git clone <this-repo>
cd ecommerce-app
npm install
```

### Configure

```bash
cp .env.example .env.local
```

Fill in `.env.local`. The app validates all variables at boot — see `src/config/env.ts`.

Generate `AUTH_SECRET`:
```bash
npx auth secret
```

### Run

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

Admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin) — requires a user with `role: "admin"` in MongoDB.

### Make yourself an admin

After registering, connect to your MongoDB database and update your user:

```js
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | Run `tsc --noEmit` |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete Render deployment checklist, including:
- All required environment variables and where to get them
- MongoDB Atlas network access configuration
- Stripe webhook setup
- Cloudinary configuration
- Post-deploy verification steps

Quick start:
1. Push to GitHub
2. Render Dashboard → New → Blueprint → point at repo
3. Set environment variables (see `render.yaml` for the full list)
4. Deploy

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # login, register (no header/footer override)
│   ├── (admin)/             # admin panel with sidebar layout
│   ├── (shop)/              # storefront pages
│   │   ├── products/        # shop listing + product detail
│   │   ├── checkout/        # checkout flow + Stripe success/cancel
│   │   ├── orders/          # customer order history + detail
│   │   └── wishlist/        # wishlist page
│   ├── api/                 # Route Handlers
│   │   ├── auth/            # Auth.js handler
│   │   ├── cart/            # cart CRUD
│   │   ├── checkout/        # Stripe session creation + coupon
│   │   ├── stripe/          # webhook handler
│   │   ├── products/        # product + review APIs
│   │   ├── orders/          # customer order API
│   │   ├── wishlist/        # wishlist + move-to-cart
│   │   ├── reviews/         # user review delete
│   │   ├── search/          # typeahead suggestions
│   │   └── admin/           # admin APIs (products, orders, reviews)
│   ├── globals.css          # design tokens (CSS variables)
│   ├── layout.tsx           # root layout + providers
│   ├── page.tsx             # home page
│   ├── sitemap.ts           # dynamic sitemap
│   ├── robots.ts            # robots.txt
│   ├── opengraph-image.tsx  # default OG image
│   ├── not-found.tsx        # global 404
│   └── error.tsx            # global error boundary
├── components/
│   ├── ui/                  # Shadcn UI primitives
│   ├── layout/              # header, footer, navigation
│   ├── sections/            # home page sections
│   ├── shop/                # filter sidebar, product grid, etc.
│   ├── product/             # product detail components
│   ├── cart/                # cart sheet + line items
│   ├── wishlist/            # wishlist sheet + items
│   ├── checkout/            # checkout form + address fields
│   ├── orders/              # order card + status badge
│   ├── search/              # search bar + suggestions
│   └── admin/               # admin tables, forms, charts
├── config/
│   ├── env.ts               # Zod-validated environment variables
│   └── nav.ts               # navigation link data
├── hooks/
│   ├── use-cart.ts          # CartProvider + useCartContext
│   ├── use-wishlist.ts      # WishlistProvider + useWishlistContext
│   └── use-debounced-value.ts
├── lib/
│   ├── actions/             # Server Actions (auth, cart, wishlist, review)
│   ├── auth/                # Auth.js config + guards
│   ├── cart/                # guest cookie utility
│   ├── cloudinary/          # Cloudinary SDK + upload service
│   ├── data/                # data access layer (one file per domain)
│   ├── db/                  # cached Mongoose connection
│   ├── security/            # rate limiting, CSRF, sanitization, errors
│   ├── stripe/              # Stripe SDK + checkout session
│   ├── validations/         # Zod schemas (one file per domain)
│   ├── helpers.ts           # formatCurrency, formatDate, slugify, etc.
│   ├── shop-url.ts          # URL query-string helpers for shop filters
│   └── utils.ts             # cn() Tailwind class merger
├── middleware.ts             # Auth.js route protection + rate limiting
├── models/                  # Mongoose models
│   ├── types.ts             # shared enums and sub-document types
│   ├── User.ts
│   ├── Product.ts
│   ├── Category.ts
│   ├── Order.ts
│   ├── Review.ts
│   ├── Cart.ts
│   ├── Wishlist.ts
│   ├── Coupon.ts
│   └── index.ts             # barrel export
└── types/
    ├── env.d.ts             # process.env type augmentation
    └── next-auth.d.ts       # Auth.js session type augmentation
```

## Path Aliases

| Alias | Resolves to |
|---|---|
| `@/*` | `src/*` |
| `@/components/*` | `src/components/*` |
| `@/lib/*` | `src/lib/*` |
| `@/models/*` | `src/models/*` |
| `@/hooks/*` | `src/hooks/*` |
| `@/config/*` | `src/config/*` |
| `@/types/*` | `src/types/*` |

## Design System

The app uses a monochrome luxury palette defined as CSS variables in `src/app/globals.css`:

- **Ink** `#0A0A0A` — primary text and dark-mode surface (warm near-black)
- **Paper** `#FAFAF8` — primary surface (warm off-white)
- **Charcoal** `#3A3A38` — secondary text (`muted-foreground`)
- **Smoke** `#E8E6E1` — hairlines, dividers, subtle fills
- **Gold-ash** `#9C8F7C` — single accent (desaturated brass, focus rings + nav underline only)

Variable names match Shadcn's standard token contract (`--background`, `--primary`, etc.) so all Shadcn UI components inherit the palette without overrides.

See `src/components/layout/README.md` for the full design rationale.
