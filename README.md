# Business Website Platform

A production-ready, multi-business website platform: one Next.js application
that serves many customers' public websites, each with its own data, branding,
content, admin users and domain — plus a dashboard where the owner runs their
site without touching code.

The first business configured on it is **Veloura Lab** (luxury beauty tools &
skincare, Lebanon). A second demo business, **Maison Ember** (a fictional
restaurant), ships alongside it to prove the same codebase serves a completely
different industry — different vocabulary (`/menu` instead of `/shop`),
different palette, fully isolated data.

---

## Table of contents

1. [What it does](#1-what-it-does)
2. [Technology](#2-technology)
3. [Create a Supabase project](#3-create-a-supabase-project)
4. [Environment variables](#4-environment-variables)
5. [Run it locally](#5-run-it-locally)
6. [Database migrations](#6-database-migrations)
7. [Create the first user](#7-create-the-first-user)
8. [How authentication works](#8-how-authentication-works)
9. [Database structure](#9-database-structure)
10. [How business isolation works](#10-how-business-isolation-works)
11. [How RLS works (and how to test it)](#11-how-rls-works-and-how-to-test-it)
12. [Add a new business/customer](#12-add-a-new-businesscustomer)
13. [Configure a business](#13-configure-a-business)
14. [Deploy to Vercel](#14-deploy-to-vercel)
15. [Connect a custom domain](#15-connect-a-custom-domain)
16. [Managing media](#16-managing-media)
16b. [Checkout and orders](#16b-checkout-and-orders)
17. [Checkout and orders](#17-checkout-and-orders)
18. [Security notes](#18-security-notes)
19. [Adding future businesses without duplicating the app](#19-adding-future-businesses-without-duplicating-the-app)
20. [Project structure](#20-project-structure)
21. [Verification performed](#21-verification-performed)

---

## 1. What it does

**Public website** (`/`, `/shop` · `/menu` · `/services`, `/about`, `/gallery`,
`/contact`, `/checkout`) — every word, price, photo, colour and meta tag comes
from the database. Nothing about any specific business is hard-coded.

**Cash-on-delivery checkout** — cart, an order form built the way Lebanese
shops sell (name, phone, area with its delivery fee, city, street, notes, pay
on delivery), an order number, a shareable receipt and a WhatsApp confirm
button. Orders land in the dashboard with the customer's phone and address.

**Admin dashboard** (`/admin`) — sign in, then manage:

| Section | What the owner can do |
| --- | --- |
| Overview | Counts, new-order alert, a setup checklist, quick actions |
| Orders | Every order with phone, address and items; filter by stage; call/WhatsApp the customer; move an order from New to Delivered; internal notes |
| Catalogue | Create/edit/delete items, price, description, photo, category, visibility, order |
| Categories | Create, rename, reorder, hide, delete (never orphans items) |
| Media | Upload, preview, hide, delete images; reuse them as item photos |
| Reviews | Add/hide/delete testimonials shown on the homepage |
| Delivery | Delivery areas and fees, free-delivery threshold, minimum order, the note shown at checkout, and a switch to stop taking orders |
| Website | Brand colours (live preview), hero copy, logo/hero/social images, currency, SEO, custom domains |
| Business info | Name, industry, tagline, about, phone, WhatsApp, email, address, hours, social links |

Everything persists in Postgres. Edit in the dashboard, refresh the public
site, and the change is there.

**Industry awareness.** A business has an `industry`
(`beauty`, `restaurant`, `cafe`, `barbershop`, `salon`, `gym`, `retail`,
`other`). It selects the site's vocabulary and the catalogue URL — a
restaurant gets "Menu" at `/menu`, a salon gets "Services" at `/services`, a
beauty brand gets "Shop" at `/shop`. One implementation, different words: see
`src/lib/industry.ts`.

---

## 2. Technology

- **Next.js 16** (App Router, Server Components, Server Actions, TypeScript)
- **Tailwind CSS v4** with runtime CSS variables for per-business theming
- **Supabase** — Postgres, Auth, Storage, Row Level Security
- **Zod** for input validation, **sonner** for dashboard toasts
- **No animation library** — every effect is CSS/Canvas (see [Performance](#performance))

Requires Node.js 20+.

---

## 3. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a project.
2. Wait for it to finish provisioning.
3. Open **Project Settings → API** and copy:
   - the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - the **anon / publishable** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do **not** copy the `service_role` key. This application never needs it.

---

## 4. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public anon key (RLS still applies) |
| `NEXT_PUBLIC_BUSINESS_SLUG` | yes | Business to serve when the hostname isn't mapped |
| `NEXT_PUBLIC_SITE_URL` | no | Override the origin used for canonical/reset links |

`.env*` is git-ignored except `.env.example`. Never commit real keys.

---

## 5. Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm run typecheck    # next typegen && tsc --noEmit
npm run lint         # eslint
```

---

## 6. Database migrations

Run the SQL files in order in **Supabase → SQL Editor** (or via the Supabase
CLI). All of them are safe to re-run.

| File | Contents |
| --- | --- |
| `supabase/migrations/0001_init.sql` | Core tables, triggers, RLS policies, storage bucket + policies |
| `supabase/migrations/0002_perf_indexes.sql` | Composite index for membership lookups |
| `supabase/migrations/0003_platform_extensions.sql` | Industry, custom domains, branding/SEO columns, testimonials |
| `supabase/migrations/0004_checkout.sql` | Orders, order items, delivery zones, checkout settings, `place_order()` and `get_order_by_token()` |

Then load demo data (optional but recommended for a first run):

| File | Contents |
| --- | --- |
| `supabase/seed/veloura_lab.sql` | Veloura Lab: settings, 5 categories, 7 products, 3 reviews, 8 Lebanese delivery areas |
| `supabase/seed/maison_ember.sql` | Second demo business (restaurant) — delete if you don't want it |
| `supabase/seed/new_business.sql` | Template for adding a real customer |
| `supabase/seed/link_owner.sql` | Give a user ownership of a business |

Demo values that must be replaced before going live are marked `PLACEHOLDER`
in the seed files (email address, prices, opening hours, reviews). Product and
gallery photos are intentionally empty — upload real ones from the dashboard.

---

## 7. Create the first user

1. **Supabase → Authentication → Users → Add user**. Set an email and
   password, and tick *Auto Confirm User*.
2. Open `supabase/seed/link_owner.sql`, set `owner_email` to that address and
   `business_slug` to the business they own (`veloura-lab`), and run it.
3. Go to `/admin/login` and sign in.

A user without a membership row can sign in but sees nothing — membership is
what grants access.

---

## 8. How authentication works

Real Supabase Auth — no mock login.

- **Sign in** (`/admin/login`) — a Server Action calls
  `signInWithPassword`; `@supabase/ssr` stores the session in httpOnly cookies.
- **Password reset** — `/admin/reset-password` emails a link that returns
  through `/auth/callback` to `/admin/update-password`.
- **Sign out** — a Server Action calls `signOut` and redirects.
- **Route protection** — `src/proxy.ts` (Next 16's renamed middleware)
  refreshes the session on every request and redirects signed-out visitors away
  from `/admin`. This is UX, not security.
- **The real check** — every admin page and Server Action calls
  `requireBusinessContext()` (`src/lib/dal.ts`), which verifies the user with
  `supabase.auth.getUser()` (validated against the auth server, not just a
  decoded cookie) and resolves their business from `business_members`.
- **The final check** — Postgres RLS, which applies even if application code
  is wrong.

---

## 9. Database structure

```
businesses ──┬── business_members ── auth.users ── profiles
             ├── business_domains        (hostname -> business)
             ├── website_settings        (1:1 — branding, contact, SEO, checkout)
             ├── categories ──┐
             ├── products ────┘          (category_id ON DELETE SET NULL)
             ├── media                   (mirrors the "media" storage bucket)
             ├── testimonials
             ├── delivery_zones          (area -> fee)
             └── orders ── order_items   (price snapshot per line)
```

| Table | Notes |
| --- | --- |
| `businesses` | `slug`, `name`, `industry`, `is_active` |
| `profiles` | One row per auth user, created by trigger |
| `business_members` | `(business_id, user_id, role)` — roles: `owner`, `admin`, `editor` |
| `business_domains` | Lowercase hostname, unique; one `is_primary` per business |
| `categories` | `name`, `sort_order`, `is_visible` |
| `products` | `name`, `description`, `price`, `image_path`, `is_visible`, `sort_order` |
| `media` | `storage_path`, `kind` (`product`/`gallery`/`logo`/`hero`/`og`/`other`), `alt_text`, `is_visible` |
| `website_settings` | Colours, hero copy, SEO, contact, hours, socials, currency |
| `testimonials` | `author_name`, `quote`, `rating`, `is_visible`, `sort_order` |
| `delivery_zones` | `name`, `fee`, `is_active` — the areas offered at checkout |
| `orders` | Per-business `order_number`, unguessable `public_token`, customer + address, `status`, `subtotal`/`delivery_fee`/`total`, `admin_note` |
| `order_items` | Snapshot of each line: name, `unit_price`, `quantity`, `line_total` (survives product edits and deletions) |

UUID primary keys, foreign keys with sensible `ON DELETE` behaviour, `created_at`
/`updated_at` timestamps (maintained by trigger), CHECK constraints on prices,
ratings, hex colours, currency codes and hostnames, and indexes on every
`business_id`.

---

## 10. How business isolation works

Every business-owned row carries a `business_id`. Three independent layers keep
businesses apart:

1. **Request → business.** The public site resolves the business from the
   request's `Host` header via `business_domains`, falling back to
   `NEXT_PUBLIC_BUSINESS_SLUG` (`src/lib/business.ts`). The hostname only ever
   selects *public* content.
2. **Session → business.** The dashboard resolves the business from the
   signed-in user's `business_members` row. **A `business_id` is never read
   from a form, URL or client payload** — writes use the id resolved from the
   session, so a forged value has nothing to attach to.
3. **Postgres → row.** RLS policies re-check membership on every single read
   and write.

---

## 11. How RLS works (and how to test it)

RLS is enabled on every table. The policies are built on one
`SECURITY DEFINER` helper:

```sql
public.is_business_member(target_business_id uuid) -- is auth.uid() a member?
```

- **Public/anon reads** are limited to what a website must expose: visible
  products and categories, visible gallery media, business info and website
  settings, and the hostname→business mapping.
- **Member reads** additionally cover that business's hidden rows.
- **Writes** (`for all`) require `is_business_member(business_id)` in both
  `USING` and `WITH CHECK`, so a member can neither modify another business's
  rows nor create rows carrying someone else's `business_id`.
- **`business_members` is readable only by the user it belongs to** — nobody
  can enumerate another business's staff.
- **Storage**: objects live at `{business_id}/{kind}/{file}` and the
  `storage.objects` policies parse that first path segment through
  `is_business_member`, so uploads and deletes can't cross businesses. Reads
  are public, which is what a website's images need.

**Orders are a special case.** There is deliberately *no* INSERT policy on
`orders` for visitors: an order can only be created through
`public.place_order()`, a `SECURITY DEFINER` function that re-reads every
product price and the delivery fee from the database. The browser sends product
ids and quantities — nothing else — so a tampered request cannot change what
anything costs. A visitor can never SELECT an order either; the customer's
receipt page reads exactly one order through `public.get_order_by_token()`,
matched on the unguessable token in its URL. The function also enforces the
free-delivery threshold, the minimum order, the "ordering is closed" switch,
per-item quantity limits and a simple per-phone rate limit.

**Test them:** run `supabase/tests/rls_checks.sql` in the SQL Editor. It needs
two rows in `auth.users`, creates its own fixtures, asserts ten isolation
properties, and ends in `ROLLBACK` so it leaves nothing behind. A failure
aborts with the name of the check that failed.

Run `supabase/tests/checkout_checks.sql` the same way for the ordering rules:
ten assertions covering server-side pricing, clamped quantities, cross-business
and hidden items, the delivery fee and free-delivery threshold, anonymous read
and write attempts, the token lookup, and per-business order numbering.

---

## 12. Add a new business/customer

No code changes, no second deployment:

1. Copy `supabase/seed/new_business.sql`, fill in the block at the top (slug,
   name, industry, colours, contact, hostname) and run it.
2. Create the owner's auth user (Authentication → Users → Add user).
3. Run `supabase/seed/link_owner.sql` with that email and the new slug.
4. Either point a domain at the deployment (see
   [Custom domains](#15-connect-a-custom-domain)), or deploy a second Vercel
   project against the same database with
   `NEXT_PUBLIC_BUSINESS_SLUG=<new-slug>`.

The owner then fills in their own content from `/admin`.

---

## 13. Configure a business

Everything below is editable in the dashboard — no deploy required:

- **Business info** — name, industry, tagline, about text, phone, WhatsApp,
  email, address, opening hours, social links.
- **Website** — primary and accent colour (live preview), hero headline,
  supporting text and button label, logo, hero background, social share image,
  currency, show/hide prices, SEO title and description, custom domains.
- **Catalogue, categories, media, reviews** — as described in
  [What it does](#1-what-it-does).

The two brand colours are injected per request as CSS custom properties
(`src/lib/theme.ts`); every component references tokens like `bg-brand` and
`text-accent`, so changing the hex values re-skins the whole site instantly.

---

## 14. Deploy to Vercel

1. Push this repository to GitHub.
2. **Vercel → Add New → Project**, import the repo (framework auto-detects as
   Next.js).
3. Add the environment variables from
   [section 4](#4-environment-variables) for Production, Preview and
   Development.
4. Deploy.
5. In **Supabase → Authentication → URL Configuration**, set the Site URL to
   your deployed origin and add it to the redirect allow-list so password-reset
   links return to the right place.

---

## 15. Connect a custom domain

Domains are bought by the customer; the platform just recognises them.

1. In Vercel: **Project → Settings → Domains → Add**, then follow the DNS
   instructions shown there (an `A` record for the apex, `CNAME` for `www`).
2. In the dashboard: **Website → Custom domains → Connect domain**, entering
   the bare hostname (`velouralab.com`). Add `www.velouralab.com` too if you
   use it. Mark one as primary — it is used for canonical URLs, the sitemap
   and social previews.

Requests then resolve to that business automatically. Several businesses can
share one deployment this way, or you can give each customer its own Vercel
project pointing at the same database (`NEXT_PUBLIC_BUSINESS_SLUG` decides).

---

## 16. Managing media

- Upload from **Media** (gallery photos, logo, hero) or directly on an item.
- Files are validated for type (JPEG/PNG/WebP/GIF/SVG) and size (5MB) on the
  client *and* the server, and the bucket enforces both again.
- Photos are resized and re-encoded in the browser before upload
  (`src/lib/image-compress.ts`), so a phone photo doesn't cost 8MB.
- Storage paths are `{business_id}/{kind}/{uuid}.{ext}` — isolation is
  enforced by storage policies, not by naming convention alone.
- Hiding a gallery image removes it from the public site without deleting it.
- Deleting an item's photo only removes the file when nothing else uses it, so
  a shared library image is never pulled out from under another item.

---

## 17. Checkout and orders

Cash on delivery, the way small shops in Lebanon actually sell — no card
processor, no online payment, no account to create.

**What the customer does**

1. Adds items to the cart (it survives reloads and tabs, stored per business).
2. Opens `/checkout` and fills one form: name, phone, second number, email
   (optional), **area** — each with its delivery fee shown — city, street and
   building, and any notes.
3. Picks *Cash on delivery* and confirms. The total updates live as they
   change area.
4. Lands on a receipt with an order number, everything they ordered, the
   address, and a **Confirm on WhatsApp** button pre-filled with the order
   number. The link is theirs to keep — it shows the live status as the order
   moves along.

**What the owner does**

- **Orders** lists every order newest first, filterable by stage, showing the
  customer, phone, area and total at a glance.
- Opening one shows the items, the full address, the customer's note, and
  one-tap **Call** and **WhatsApp** buttons — the two things you actually do
  when confirming a delivery.
- Stage buttons move it: New → Confirmed → Preparing → Out for delivery →
  Delivered (or Cancelled). The customer's receipt page updates too.
- An internal note field keeps track of things like "called, delivering
  Thursday". The customer never sees it.

**What the owner configures** (Dashboard → Delivery)

- Delivery areas and their fees — add, rename, reprice, deactivate, remove.
  Past orders keep the area and fee they were charged.
- Free delivery over an amount, a minimum order, the note shown at checkout,
  and a switch that stops the website taking orders entirely (the cart
  disappears and the site points customers to WhatsApp instead).

**Why the prices can't be tampered with**

The browser only ever sends product ids and quantities. Every price, the
delivery fee, the free-delivery threshold and the minimum order are read from
the database inside `place_order()`, and the order rows are written there —
visitors have no INSERT permission on `orders` at all. See
[RLS](#11-how-rls-works-and-how-to-test-it) and
`supabase/tests/checkout_checks.sql`.

**Deliberately not included**: online card payment. Adding a processor later
means one more `payment_method` value and a payment step before
`place_order()` — the schema already has the column.

---

## 18. Security notes

- The service-role key is **never** used; there is no code path that could leak
  it to the browser.
- The browser only ever sees the anon key, which is powerless without RLS
  permission.
- `business_id` always comes from the session, never from client input.
- Order totals are computed in Postgres, never accepted from the browser; the
  checkout form is rate-limited per phone number and carries a honeypot field.
- Customers' orders are unreadable to anonymous visitors; a receipt is reachable
  only with its unguessable token.
- All form input is validated with Zod on the server (lengths, emails, URLs,
  hex colours, currency codes, hostnames, price ranges).
- Uploads are restricted by MIME type and size at three layers.
- Admin routes are gated in the proxy, re-checked in the Data Access Layer, and
  enforced by RLS.
- Destructive actions use confirmation dialogs; deleting a category never
  deletes its items.
- `.env*` files are git-ignored; `.env.example` contains names only.

---

## 19. Adding future businesses without duplicating the app

The codebase separates five things on purpose:

| Layer | Where it lives |
| --- | --- |
| Reusable functionality | `src/app`, `src/components`, `src/lib` |
| Business data | `businesses`, `categories`, `products`, `media`, `testimonials` |
| Business branding | `website_settings.primary_color` / `secondary_color` / images |
| Business content | `website_settings` hero + about + contact, catalogue rows |
| Business settings | `businesses.industry`, currency, SEO, domains |

Nothing in `src/` names a customer. Adding business number four is a SQL insert
plus a domain — not a fork.

---

## 20. Project structure

```
src/
  app/
    (site)/                 public website — layout injects brand theme + SEO
      page.tsx              home
      shop|menu|services/   catalogue (industry picks the canonical path)
      checkout/             cash-on-delivery order form
      order/[token]/        the customer's receipt
      about, gallery, contact
    admin/
      (auth)/               login, reset-password, update-password
      (dashboard)/          overview, orders, products, categories, media,
                            testimonials, delivery, website, settings
    auth/callback/          Supabase auth redirect handler
    sitemap.ts, robots.ts   per-business, resolved from the request
  components/
    site/                   hero, brand-orb (3D), dust-field, tilt, reveal,
                            catalog, product-card, checkout-form, header,
                            footer, cart/ (store, drawer, buttons), …
    admin/                  forms, lists, rows, media picker, domain manager
    ui/                     button, card, input, dialog, badge, skeleton…
  lib/
    business.ts             hostname -> business resolution + public queries
    dal.ts                  session -> business resolution for the dashboard
    industry.ts             per-industry vocabulary
    theme.ts                brand colours -> CSS variables
    actions/                Server Actions (auth, products, categories, media,
                            settings, domains, testimonials, orders, delivery)
    queries/admin.ts        dashboard reads
    validation/             Zod schemas
    supabase/               server, browser and proxy clients
supabase/
  migrations/               schema + RLS
  seed/                     demo data and templates
  tests/rls_checks.sql      isolation test suite
  tests/checkout_checks.sql ordering + pricing test suite
```

### Performance

The public site is server-rendered with a small client payload (~480KB of
uncompressed JS including React, ~0 long tasks after load).

Every animation is deliberately compositor-only — transforms and opacity, plus
one small Canvas particle field:

- the 3D hero (orbiting rings, faceted gem) is CSS `preserve-3d` + keyframes,
  not WebGL: no library, no textures, no per-frame JavaScript;
- pointer parallax and card tilt write a single transform and park their rAF
  loop as soon as the pointer settles;
- the particle canvas caps device-pixel-ratio at 2 and suspends itself when the
  tab is hidden or the canvas scrolls out of view;
- scroll reveals share one IntersectionObserver and unobserve after firing;
- everything is disabled under `prefers-reduced-motion`, and a `<noscript>`
  rule makes all content visible without JavaScript.

Images are resized before upload and served straight from Supabase's CDN.

---

## 21. Verification performed

Automated against a local Postgres + a stand-in Supabase API, using the real
application build:

- 19 end-to-end dashboard/public-site checks — sign-in, protected routes,
  create/edit/hide/delete an item and see each change on the public site,
  categories, business info, brand colour, reviews, sign out, persistence
  across sessions, and cross-business isolation between two tenants.
- 24 end-to-end checkout checks — add to cart, quantity stepper, badge count,
  cart surviving a reload, the delivery fee following the chosen area,
  submitting the order, the receipt (number, address, totals, WhatsApp
  confirm), the cart emptying afterwards, a wrong token 404ing, the order
  appearing in the dashboard, the status change reaching the customer's
  receipt, and another business not seeing any of it.
- 4 "ordering switched off" checks — cart hidden, cards falling back to
  WhatsApp, `/checkout` 404, and `place_order()` refusing a direct call.
- 5 media checks — upload, gallery visibility, picking a library image for an
  item, public rendering, hiding.
- 10 RLS assertions (`supabase/tests/rls_checks.sql`) and 10 checkout
  assertions (`supabase/tests/checkout_checks.sql`), each with a mutation test
  proving the suite fails when a policy is loosened.
- Hostname routing — the same deployment serving two businesses on two
  hostnames with different vocabulary, palette and sitemap.
- `npm run typecheck`, `npm run lint`, `npm run build` all clean; no horizontal
  overflow and no console errors at 1440px and 390px on every public page.

**Known limitations / setup still required**

- Real photos, the real contact email, real prices, hours and reviews must
  replace the `PLACEHOLDER` demo values.
- Roles beyond `owner` exist in the schema (`admin`, `editor`) but every role
  currently has the same permissions; narrowing them is a policy change.
- Checkout is cash on delivery only; there is no card payment and no stock
  tracking (an out-of-stock item is hidden rather than counted down).
- Order confirmation is not emailed or SMS'd: the customer keeps the receipt
  link and the owner calls or WhatsApps them, which is how these shops work.
  Wiring an email or SMS provider would be an addition to `place_order()`.
- Email delivery for password resets uses Supabase's built-in SMTP; configure
  a custom SMTP provider before relying on it in production.
