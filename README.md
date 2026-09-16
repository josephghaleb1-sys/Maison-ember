# Bibliotheca Bookshop

A production-grade client website: a public marketing site plus a secure
dashboard where the owner manages everything on it — products, categories,
photos, branding, contact details and SEO — without touching code.

## How this repository is meant to be used

**One repository, one deployment, one client.** This repo is Bibliotheca
Bookshop. The next client gets its own copy of this codebase, its own Vercel
project and its own Supabase project, so work on one site can never affect
another. Nothing is shared at runtime between clients.

What makes that cheap is that almost nothing here is specific to a bookshop.
The industry is a single field (`businesses.business_type`) that drives the
site's vocabulary, its catalog URL and its illustration; the branding is two
hex values in the database. Standing up a barbershop means copying this repo,
changing that field and filling in the dashboard — not rewriting components.

The underlying schema is still multi-tenant (every row carries a `business_id`
and RLS enforces it). That is deliberate: it costs nothing when a deployment
serves one business, it keeps the security model honest, and it leaves the
door open to hosting several small clients on one deployment later if you ever
want to. It is not a reason to put two clients in one repo.

---

## Table of contents

1. [What it does](#1-what-it-does)
2. [Tech stack](#2-tech-stack)
3. [Create a Supabase project](#3-create-a-supabase-project)
4. [Environment variables](#4-environment-variables)
5. [Run it locally](#5-run-it-locally)
6. [Database migrations](#6-database-migrations)
7. [Create the first user](#7-create-the-first-user)
8. [How authentication works](#8-how-authentication-works)
9. [Database structure](#9-database-structure)
10. [How business isolation works](#10-how-business-isolation-works)
11. [How RLS works (and how to test it)](#11-how-rls-works-and-how-to-test-it)
12. [Add a new business / customer](#12-add-a-new-business--customer)
13. [Configure a business](#13-configure-a-business)
14. [Deploy to Vercel](#14-deploy-to-vercel)
15. [Connect a custom domain](#15-connect-a-custom-domain)
16. [Manage media](#16-manage-media)
17. [Security considerations](#17-security-considerations)
18. [Scaling to many businesses](#18-scaling-to-many-businesses)
19. [Project structure](#19-project-structure)
20. [Known limitations](#20-known-limitations)

---

## 1. What it does

**Public website** (per business, fully database-driven):

- Homepage with hero, featured items, categories, gallery preview and a
  location/contact block
- Catalog page whose URL adapts to the industry — `/shop`, `/menu` or
  `/services`
- About, Gallery and Contact pages
- Per-business SEO metadata, Open Graph tags and favicon

**Admin dashboard** (authenticated, one business per signed-in user):

- Overview with website status, counts, recent changes and quick actions
- Catalog management: create, edit, delete, reorder, show/hide, photos
- Categories: create, rename, reorder, show/hide, safe delete
- Media library backed by Supabase Storage
- Website customization: brand colors with live preview, hero copy, logo,
  hero image, SEO
- Business info: name, story, phone, WhatsApp, email, address, hours, socials
- Settings: industry, currency, custom domains, account

Nothing a business owner can reasonably want to change is hard-coded. Text,
prices, images, colors, contact details, SEO and even the site's vocabulary all
come from the database.

---

## 2. Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + password) |
| File storage | Supabase Storage |
| Hosting | Vercel-compatible |

---

## 3. Create a Supabase project

1. Sign in at [supabase.com](https://supabase.com) and create a new project.
2. Choose a region close to your customers and save the database password.
3. Once it finishes provisioning, open **Project Settings → API** and copy:
   - the **Project URL**
   - the **anon / publishable** key

Do **not** copy the `service_role` key. This application never uses it, and it
must never reach a browser or a Git repository.

---

## 4. Environment variables

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public anon key |
| `NEXT_PUBLIC_BUSINESS_SLUG` | for local dev | Which business to serve when the hostname matches no domain row |
| `NEXT_PUBLIC_SITE_URL` | no | Absolute origin for password-reset links |

`.env.local` is gitignored. If a variable is missing the app fails with an
explicit message naming the variable rather than a vague runtime crash.

---

## 5. Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm run start        # serve the production build
npm run lint         # ESLint
npm run typecheck    # route typegen + tsc --noEmit
```

---

## 6. Database migrations

There is no migration runner dependency — the files are plain SQL, applied in
order in the Supabase **SQL Editor** (or via `supabase db push` if you use the
CLI). Every file is idempotent and safe to re-run.

| Order | File | Contents |
| --- | --- | --- |
| 1 | `supabase/migrations/0001_init.sql` | Tables, triggers, RLS policies, storage bucket |
| 2 | `supabase/migrations/0002_perf_indexes.sql` | Supporting indexes |
| 3 | `supabase/migrations/0003_platform_generalization.sql` | Industry type, currency, brand colors, hero copy, SEO fields, `business_domains` |
| 4 | `supabase/migrations/0004_unique_category_names.sql` | Merges duplicate categories and enforces one category name per business |

Then load demo data (optional but recommended for a first run):

| File | Contents |
| --- | --- |
| `supabase/seed/bibliotheca.sql` | Bibliotheca Bookshop: settings, 5 categories, 19 items |

---

## 7. Create the first user

Supabase Auth owns user accounts; this app never creates them from the public
site (there is deliberately no public sign-up — owners are onboarded by you).

1. **Supabase Dashboard → Authentication → Users → Add user.** Enter an email
   and password and tick *Auto Confirm User*.
2. Open `supabase/seed/link_owner.sql`, set `target_email` to that address and
   `target_slug` to the business (`bibliotheca`), and run it.
3. Visit `/admin/login` and sign in.

Step 2 is not optional. Membership is what every RLS policy checks — without a
`business_members` row the account signs in successfully but belongs to no
business, and is returned to the login screen.

---

## 8. How authentication works

- **Sign-in** — `signInWithPassword` in a Server Action; the session is stored
  in cookies by `@supabase/ssr`.
- **Session refresh** — `src/proxy.ts` (Next.js 16's renamed middleware) runs
  on every request and refreshes the session.
- **Route protection** — two layers:
  1. The proxy redirects unauthenticated requests for `/admin/*` to the login
     page. This is an *optimistic* check for fast, clean UX.
  2. The real boundary: every admin page and Server Action calls
     `requireBusinessContext()` (`src/lib/dal.ts`), which verifies the user via
     `supabase.auth.getUser()` and resolves their business from
     `business_members` — and RLS enforces the same rule again inside
     PostgreSQL.
- **Password reset** — `/admin/reset-password` emails a link that returns
  through `/auth/callback` to `/admin/update-password`.
- **Sign-out** — a Server Action clearing the session.

Never trust the proxy alone: it is a redirect for humans, not an authorization
check. Authorization lives in the DAL and in RLS.

---

## 9. Database structure

```
businesses ─────┬── business_members ── auth.users ── profiles
                ├── business_domains        (hostname -> business)
                ├── categories ──┐
                ├── products ◄───┘          (category_id ON DELETE SET NULL)
                ├── media                   (rows mirror Storage objects)
                └── website_settings        (1:1 — branding, contact, SEO)
```

| Table | Purpose |
| --- | --- |
| `businesses` | One row per customer. Carries `slug`, `business_type`, `currency`. |
| `profiles` | App-level profile per auth user, created by trigger on sign-up. |
| `business_members` | Which users belong to which business, and their role. |
| `business_domains` | Hostname → business. Hostname is globally unique; one primary per business. |
| `categories` | Catalog groupings. `sort_order`, `is_visible`. |
| `products` | Catalog items — books, dishes, services. `price`, `image_path`, `sort_order`, `is_visible`. |
| `media` | Media library rows for the `media` Storage bucket. |
| `website_settings` | Branding, hero copy, contact details, hours, socials, SEO. |

Every business-owned table carries `business_id` with
`ON DELETE CASCADE`. Deleting a category sets its products'
`category_id` to `NULL` rather than deleting them — categories are a grouping,
never an owner.

Constraints worth knowing (all enforced in the database, not just in forms):

- `business_type` must be one of the supported industries
- category names are unique per business (which is also what makes the seed
  files genuinely re-runnable — without it their `on conflict do nothing`
  never matched and every re-run duplicated the category list)
- `currency` must match `^[A-Z]{3}$`
- `primary_color` / `secondary_color` must match `^#[0-9A-Fa-f]{6}$`
- `hostname` must be lowercase and contain no port

---

## 10. How business isolation works

Two independent questions, answered separately:

**"Whose website is this request for?"** (public site) —
`getPublicBusiness()` in `src/lib/business.ts` looks up the request's `Host`
header in `business_domains`. If nothing matches, it falls back to
`NEXT_PUBLIC_BUSINESS_SLUG`. If neither resolves, the request 404s. The Host
header only ever *selects* a business — it never grants any write access.

**"Which business may this user edit?"** (dashboard) —
`requireBusinessContext()` resolves the business from the signed-in user's
`business_members` row. The business ID is never read from a form field, a URL
or a header, so a crafted request cannot retarget another business.

The industry then drives the site's vocabulary and routing through
`src/lib/business-types.ts`: a restaurant's catalog renders at `/menu` with
"dishes", a bookshop's at `/shop` with "titles", a salon's at `/services`.
Requesting the wrong segment for a business 404s, so the same content is never
served under two URLs.

---

## 11. How RLS works (and how to test it)

RLS is enabled on every table. Policies are built on one `SECURITY DEFINER`
helper:

```sql
public.is_business_member(target_business_id uuid) returns boolean
```

which answers "is `auth.uid()` a member of this business?" without recursive
policy evaluation.

| Audience | Can read | Can write |
| --- | --- | --- |
| `anon` (public site) | Visible products/categories, gallery media, business info, domains | Nothing |
| `authenticated` member | Everything belonging to **their** business, including hidden rows | Everything belonging to their business |
| `authenticated` non-member | Nothing of that business | Nothing |

Private data — `business_members`, other people's `profiles`, non-gallery media
— is never readable by `anon`.

**Test it.** `supabase/tests/rls_isolation.sql` impersonates the `anon` and
`authenticated` roles the way PostgREST does and asserts that a member of one
business cannot read, update or insert another's rows, that a member *can*
still work with their own, that anonymous visitors see visible rows only, and
that membership data stays private. It creates its own fixtures, so it runs on
a database with nothing but the migrations applied, and rolls itself back —
safe against a real project:

```
Supabase Dashboard → SQL Editor → paste supabase/tests/rls_isolation.sql → Run
```

Every check in it passes on the shipped schema.

---

## 12. Add a new business / customer

**For a new client, copy this repository** and give them their own Vercel and
Supabase projects — that is what keeps clients separate. Then run the
migrations and, instead of the Bibliotheca seed, insert their own rows:

```sql
-- 1. The business
insert into public.businesses (slug, name, business_type, currency)
values ('acme-barbers', 'Acme Barbers', 'barbershop', 'USD');

-- 2. Its website settings (branding, contact, SEO)
insert into public.website_settings (business_id, business_name, primary_color, secondary_color)
select id, 'Acme Barbers', '#C8A44D', '#101418'
from public.businesses where slug = 'acme-barbers';

-- 3. Its owner — after creating the auth user in the Supabase dashboard
insert into public.business_members (business_id, user_id, role)
select b.id, u.id, 'owner'
from public.businesses b
join auth.users u on u.email = 'owner@acmebarbers.com'
where b.slug = 'acme-barbers';

-- 4. Its domain (see section 15 for the Vercel half)
insert into public.business_domains (business_id, hostname, is_primary)
select id, 'acmebarbers.com', true
from public.businesses where slug = 'acme-barbers';
```

The owner then signs in and fills in the rest from the dashboard.

Adding a second business row to an *existing* deployment also works — the
schema and RLS support it — but that puts two clients in one codebase and one
database. Prefer a separate copy per client unless you have a specific reason
not to.

Supported `business_type` values: `restaurant`, `cafe`, `bakery`, `bookshop`,
`retail`, `barbershop`, `salon`, `gym`, `general`. To add another industry, add
an entry to `BUSINESS_TYPES` in `src/lib/business-types.ts` and to the CHECK
constraint in migration `0003` — that is the whole change.

---

## 13. Configure a business

Everything below is editable in the dashboard by the owner:

| Dashboard page | Controls |
| --- | --- |
| **Website** | Primary/secondary color (live preview), hero title and description, logo, hero image, SEO title and description |
| **Business info** | Name, tagline, about text, phone, WhatsApp, email, address, opening hours, social links |
| **Settings** | Industry, currency, custom domains, account details |
| **Catalog** | Items: name, description, price, category, photo, visibility, order |
| **Categories** | Name, visibility, order |
| **Media** | Upload, replace, delete, alt text, gallery visibility |

Colors are stored as hex and expanded at request time into a full set of CSS
custom properties by `src/lib/theme.ts`. Owners pick two colors; the site
derives a coherent palette and works with either a light or a dark secondary
color.

Readability is solved, not assumed. An owner can pick any pair, so every token
that carries text is computed against an explicit WCAG target rather than mixed
by eye: body copy clears 11:1 against the surface, muted copy and
brand-colored text clear 4.5:1, and button labels pick black or white by
measuring both. That matters for exactly the mid-tone golds and terracottas
businesses like most — a naive "is it dark?" test puts white on a #C8A44D
button at 2.4:1, where black would have given 8.9:1.

---

## 14. Deploy to Vercel

1. Push the repository to GitHub.
2. In Vercel, **Add New → Project** and import it. The framework preset is
   detected automatically.
3. Add the environment variables from section 4 under **Settings →
   Environment Variables**.
4. Deploy.

Two deployment shapes are supported:

- **One project per client** (how this repo is set up) — set
  `NEXT_PUBLIC_BUSINESS_SLUG` to that client's slug. Separate repo, separate
  database, separate deployment: nothing you do for one client can reach
  another.
- **One project, several businesses** — attach each domain to the same project
  and let `business_domains` route by hostname, leaving
  `NEXT_PUBLIC_BUSINESS_SLUG` unset. Cheaper to host and to patch, at the cost
  of clients sharing a codebase and a database.

---

## 15. Connect a custom domain

Connecting a domain is always two halves:

1. **Vercel** — Project → Settings → Domains → add the domain, then set the
   DNS records Vercel shows at the registrar.
2. **This application** — add the hostname in the dashboard under
   **Settings → Custom domains** (or insert into `business_domains`).

Until both are done the domain will not serve the business: Vercel needs to
accept the request, and this app needs to know whose site that hostname is.

Store the hostname only — no scheme, no port, lowercase. Add `example.com` and
`www.example.com` as separate rows if you serve both, and mark one primary. The
primary is what the dashboard's **View website** button opens.

Do not buy domains through this application; customers own their own domains.

---

## 16. Manage media

Media lives in the Supabase Storage bucket `media`, created by migration
`0001`, with paths namespaced per business:

```
{business_id}/{kind}/{uuid}.{ext}      kind = product | gallery | logo | hero | other
```

That leading `business_id` segment is not cosmetic — the storage policies parse
it with `storage.foldername()` and check membership against it, so one business
cannot write into another's folder.

Validation is enforced in three places: the bucket (5 MB limit, image MIME
types only), the upload helper in `src/lib/actions/upload.ts`, and the file
input. Images are downscaled and recompressed in the browser before upload.

Uploading a replacement logo or hero deletes the old object only after the new
one succeeds, so a failed upload can never leave a business with no logo.

---

## 17. Security considerations

- **The service_role key is never used.** Every query runs as the signed-in
  user or as `anon`, so RLS is always the enforcing boundary. There is no
  privileged code path to bypass.
- **The anon key is public by design** — it is in the browser bundle, as
  intended. It grants nothing beyond what RLS allows.
- **Business ID is never client-supplied** for writes; it comes from the
  session's membership.
- **Server-side authorization** in `src/lib/dal.ts` for every admin page and
  action, backed by RLS in the database.
- **Input validation** with Zod on every form, mirrored by CHECK constraints in
  the database.
- **Brand colors are validated as 6-digit hex** in Zod *and* by a CHECK
  constraint, because they are interpolated into a `<style>` tag. Anything else
  falls back to the default — the fallback is covered by tests, including
  `</style>` break-out attempts.
- **Uploads are restricted** by MIME type and size at bucket, server and client.
- **Errors never leak internals to visitors.** The public error boundary shows
  a generic message and logs the detail server-side; the dashboard shows real
  messages to the authenticated operator who needs them.
- **No secrets in Git.** `.gitignore` excludes `.env*` except `.env.example`.

**Worth understanding:** the public-read policies allow `anon` to read *visible*
products, categories and gallery media across all businesses, not just the one
whose domain was requested. That data is already published on each business's
own public website, so this is exposure of public information rather than a
leak — but it does mean a determined party with the anon key could enumerate
other tenants' *public* catalogs. If you need to prevent that (for example
while a customer's site is still being built), add an `is_published` flag to
`businesses` and include it in the three `*_public_read_*` policies. Hidden
items, unpublished drafts, membership and all private data are already
inaccessible.

---

## 18. Reusing this for the next client

Copy the repository, then change data rather than code:

- **Business-agnostic:** every component, route, Server Action and query. No
  component hard-codes a business name, color, price or image.
- **In the database:** identity, content, catalog, media, branding, SEO,
  domains, users.
- **One config file:** `src/lib/business-types.ts` holds each industry's
  vocabulary, catalog URL and illustration. Adding an industry is an entry
  there plus a line in the CHECK constraint in migration `0003`.

So a new client is: copy repo → new Supabase project → run migrations → insert
their business row → set `NEXT_PUBLIC_BUSINESS_SLUG` → deploy. The design work
that remains is theirs alone, in their own repo, where it cannot disturb
anyone else's site.

---

## 19. Project structure

```
src/
  app/
    (site)/                  Public website
      layout.tsx             Theme injection + per-business SEO
      page.tsx               Homepage
      [segment]/page.tsx     Catalog — /shop, /menu or /services
      about/ gallery/ contact/
      error.tsx not-found.tsx
    admin/
      (auth)/                Login, reset password, update password
      (dashboard)/           Overview, products, categories, media,
                             website, business, settings
    auth/callback/           Supabase auth redirect handler
    global-error.tsx         Last-resort boundary (catches layout failures)
    icon.svg                 Platform fallback favicon
  components/
    site/                    Public components (brand tokens only)
    admin/                   Dashboard components (fixed platform chrome)
    ui/                      Shared primitives
  lib/
    business.ts              Public business resolution (hostname -> business)
    business-types.ts        Per-industry vocabulary and routing
    dal.ts                   Authenticated data access layer
    theme.ts                 Brand colors -> CSS custom properties
    env.ts                   Validated environment variables
    revalidate.ts            Cache invalidation helpers
    actions/                 Server Actions
    queries/                 Admin read queries
    validation/              Zod schemas
supabase/
  migrations/                Schema + RLS, applied in order
  seed/                      Demo businesses and owner linking
  tests/rls_isolation.sql    RLS isolation test
public/demo/                 Demo logo asset
```

Two palettes exist deliberately, documented at the top of
`src/app/globals.css`: brand tokens (`--brand`, `--surface`, `--ink`) for the
public site, overwritten per business on every request; and a fixed
`charcoal`/`ember` scale for the dashboard, which is the platform's own product
UI and stays consistent across tenants.

---

## 20. Known limitations

- **Roles** — the schema, the DAL helper (`canManageBusinessConfig`) and the
  policies support `owner`, `admin` and `editor`, but only Owner is exercised
  in this release. Adding per-role restrictions is a change to that helper and
  the policies, not to call sites.
- **One business per user in the UI.** The schema supports a user belonging to
  several businesses; the dashboard picks the first membership. A business
  switcher is the missing piece, not a schema change.
- **No public sign-up.** Owners are onboarded by creating the auth user and the
  membership row. This is deliberate.
- **No team invitations yet** — adding a second user to a business is currently
  a SQL insert.
- **Images are served directly from Supabase Storage** with Next's image
  optimizer disabled (`next.config.ts`), since uploads are already downscaled
  client-side. Enable it if you want Vercel's optimizer as well.
- **Demo content is demo content.** Everything in `supabase/seed/bibliotheca.sql`
  — phone numbers (555 range, reserved for fiction), address, email, socials,
  product titles — is placeholder data, marked as such at the top of the file,
  and meant to be replaced.
- **The shipped logo is a placeholder.** `public/demo/bibliotheca-logo.svg` is
  a geometric stand-in drawn from the customer's own mark. Upload the real
  artwork under Website → Logo & hero image and it replaces this everywhere,
  including the browser tab.
- **No hero photograph yet.** Without one the hero renders a branded gradient
  and texture, which is a designed state rather than a gap — but a real
  photograph is what the layout is built for.
