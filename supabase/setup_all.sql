-- ===========================================================================
-- ONE-PASTE SETUP
-- ===========================================================================
-- Everything needed to stand up a fresh Supabase project for this platform:
-- the six migrations in order, then the Veloura Lab seed data.
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> New query -> paste this whole file
--   -> Run.
--
-- SAFE TO RE-RUN. Every statement is idempotent (tables and indexes use
-- "if not exists", policies and functions are dropped and recreated, the seed
-- skips rows that already exist), so running it twice changes nothing and a
-- run that stops partway can simply be run again after the cause is fixed.
--
-- WHAT YOU SHOULD SEE: seven "== applied: ... ===" lines and nothing else.
-- Routine chatter is silenced below so that anything which does appear is
-- worth reading — in particular a warning about STORAGE, which means this
-- project would not let the SQL Editor create the media bucket or its
-- policies. That is the one thing that breaks photo uploads later; the
-- warning names the fix, and README "If photo uploads fail" has the detail.
--
-- This file is generated from the files it contains. To regenerate it:
--   bash scripts/build-setup-sql.sh
-- Do not edit it by hand; edit the migration or seed and regenerate.
-- ===========================================================================

-- Silence the routine "... does not exist, skipping" chatter that every
-- idempotent DROP emits on a first run, so real warnings stand out.
set client_min_messages to warning;



-- ###########################################################################
-- # 0001 core schema, security rules, media storage
-- # source: supabase/migrations/0001_init.sql
-- ###########################################################################

-- Maison Ember / multi-tenant website platform
-- Initial schema + Row Level Security (RLS)
--
-- Design: every business-owned table carries a business_id. RLS policies
-- are the real security boundary (not frontend checks) — a signed-in user
-- can only read/write rows for businesses they belong to via
-- business_members. Public (anon) visitors can only read the subset of
-- content that is meant to be public (visible products/categories, the
-- public gallery, and business info).
--
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS.

create extension if not exists "pgcrypto";

-- ============================================================================
-- TABLES
-- ============================================================================

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- One row per auth user, mirrors auth.users for app-level profile data.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Membership join table: which users belong to which business, and their role.
create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'editor')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  -- Deleting a category must NOT delete its products — just uncategorize them.
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null default 0 check (price >= 0),
  image_path text,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Media library, backed by Supabase Storage bucket "media".
-- storage_path convention: "{business_id}/{kind}/{filename}"
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  kind text not null default 'gallery' check (kind in ('product', 'gallery', 'logo', 'hero', 'other')),
  alt_text text not null default '',
  is_visible boolean not null default true,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.website_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id) on delete cascade,
  business_name text not null default '',
  tagline text not null default '',
  about_text text not null default '',
  logo_path text,
  hero_image_path text,
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  hours jsonb not null default '{}'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists categories_business_id_idx on public.categories (business_id);
create index if not exists products_business_id_idx on public.products (business_id);
create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists media_business_id_idx on public.media (business_id);
create index if not exists business_members_user_id_idx on public.business_members (user_id);
create index if not exists business_members_business_id_idx on public.business_members (business_id);

-- ============================================================================
-- updated_at maintenance
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.categories;
create trigger set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.products;
create trigger set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.website_settings;
create trigger set_updated_at before update on public.website_settings
  for each row execute function public.set_updated_at();

-- ============================================================================
-- New auth user -> profile row
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- RLS helper: is the current user a member of this business?
-- SECURITY DEFINER avoids recursive-RLS lookups when this is used inside
-- other tables' policies.
-- ============================================================================

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = auth.uid()
  );
$$;

grant execute on function public.is_business_member(uuid) to authenticated, anon;

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.business_members enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.media enable row level security;
alter table public.website_settings enable row level security;

-- ---- businesses -------------------------------------------------------
-- Public needs to read basic business rows (name/slug) to render the site.
drop policy if exists "businesses_public_read" on public.businesses;
create policy "businesses_public_read"
  on public.businesses for select
  to anon, authenticated
  using (true);

drop policy if exists "businesses_member_update" on public.businesses;
create policy "businesses_member_update"
  on public.businesses for update
  to authenticated
  using (public.is_business_member(id))
  with check (public.is_business_member(id));

-- ---- profiles -----------------------------------------------------------
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---- business_members ----------------------------------------------------
-- Users can see their own memberships (used to resolve "my business" on login).
drop policy if exists "business_members_self_select" on public.business_members;
create policy "business_members_self_select"
  on public.business_members for select
  to authenticated
  using (user_id = auth.uid());

-- ---- categories -----------------------------------------------------------
drop policy if exists "categories_public_read_visible" on public.categories;
create policy "categories_public_read_visible"
  on public.categories for select
  to anon, authenticated
  using (is_visible = true);

drop policy if exists "categories_member_read_all" on public.categories;
create policy "categories_member_read_all"
  on public.categories for select
  to authenticated
  using (public.is_business_member(business_id));

drop policy if exists "categories_member_write" on public.categories;
create policy "categories_member_write"
  on public.categories for all
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- ---- products ---------------------------------------------------------
drop policy if exists "products_public_read_visible" on public.products;
create policy "products_public_read_visible"
  on public.products for select
  to anon, authenticated
  using (is_visible = true);

drop policy if exists "products_member_read_all" on public.products;
create policy "products_member_read_all"
  on public.products for select
  to authenticated
  using (public.is_business_member(business_id));

drop policy if exists "products_member_write" on public.products;
create policy "products_member_write"
  on public.products for all
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- ---- media --------------------------------------------------------------
-- Public gallery images are readable by anyone; everything else in the
-- library (product source images, logo, hero, drafts) is member-only. The
-- public site never queries this table for product/logo/hero images — those
-- are read via the denormalized *_path columns on products/website_settings.
drop policy if exists "media_public_read_gallery" on public.media;
create policy "media_public_read_gallery"
  on public.media for select
  to anon, authenticated
  using (kind = 'gallery' and is_visible = true);

drop policy if exists "media_member_read_all" on public.media;
create policy "media_member_read_all"
  on public.media for select
  to authenticated
  using (public.is_business_member(business_id));

drop policy if exists "media_member_write" on public.media;
create policy "media_member_write"
  on public.media for all
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- ---- website_settings -------------------------------------------------
drop policy if exists "website_settings_public_read" on public.website_settings;
create policy "website_settings_public_read"
  on public.website_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "website_settings_member_write" on public.website_settings;
create policy "website_settings_member_write"
  on public.website_settings for all
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- ============================================================================
-- Storage: "media" bucket + object-level policies
-- ============================================================================

-- Creating the bucket and its policies needs ownership of the storage tables.
-- In most Supabase projects the SQL Editor's `postgres` role has it; in some it
-- does not, and the statements fail with "must be owner of table objects".
-- Rather than abort the whole migration, each step reports what to do instead
-- (Dashboard -> Storage -> Policies). Uploads will not work until the four
-- policies below exist, so the notices matter — read the output of this file.

do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'media',
    'media',
    true,
    5242880, -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
  on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;
exception
  when insufficient_privilege then
    raise warning 'Could not create the "media" bucket from SQL. Create it in the Dashboard: Storage -> New bucket -> name "media", Public ON, file size limit 5MB.';
end;
$$;

do $$
begin
  -- Public read: the website's images are public by definition.
  drop policy if exists "media_bucket_public_read" on storage.objects;
  create policy "media_bucket_public_read"
    on storage.objects for select
    to anon, authenticated
    using (bucket_id = 'media');

  -- Writes are scoped by the first path segment, which is the business id:
  -- "{business_id}/{kind}/{file}". A member can only write inside their own
  -- business's folder, so uploads can never cross businesses.
  drop policy if exists "media_bucket_member_insert" on storage.objects;
  create policy "media_bucket_member_insert"
    on storage.objects for insert
    to authenticated
    with check (
      bucket_id = 'media'
      and public.is_business_member(((storage.foldername(name))[1])::uuid)
    );

  drop policy if exists "media_bucket_member_update" on storage.objects;
  create policy "media_bucket_member_update"
    on storage.objects for update
    to authenticated
    using (
      bucket_id = 'media'
      and public.is_business_member(((storage.foldername(name))[1])::uuid)
    )
    with check (
      bucket_id = 'media'
      and public.is_business_member(((storage.foldername(name))[1])::uuid)
    );

  drop policy if exists "media_bucket_member_delete" on storage.objects;
  create policy "media_bucket_member_delete"
    on storage.objects for delete
    to authenticated
    using (
      bucket_id = 'media'
      and public.is_business_member(((storage.foldername(name))[1])::uuid)
    );
exception
  when insufficient_privilege then
    raise warning 'Could not create the storage policies from SQL (this project restricts it). Create them in the Dashboard: Storage -> Policies -> New policy on objects. See README "If photo uploads fail" for the four policies to add.';
end;
$$;

do $setup$ begin raise warning '== applied: 0001 core schema, security rules, media storage ==='; end $setup$;


-- ###########################################################################
-- # 0002 performance indexes
-- # source: supabase/migrations/0002_perf_indexes.sql
-- ###########################################################################

-- Performance: composite index for the business_members lookups that run on
-- nearly every admin request.
--
-- Two query shapes hit this table constantly:
--   1. requireBusinessContext(): where user_id = auth.uid()
--   2. is_business_member(): where business_id = ? and user_id = auth.uid()
--      (called from inside almost every RLS policy on categories/products/
--      media/website_settings — i.e. on every read and write those tables do)
--
-- Both previously had to be served by combining two single-column indexes
-- (business_members_user_id_idx, business_members_business_id_idx). A single
-- composite index serves both shapes directly. Safe to re-run.
--
-- Note: business_members is expected to stay a small table (one row per
-- staff member per business), so this is correctness/best-practice rather
-- than a measurable fix on its own — the real wins are fewer round trips.

create index if not exists business_members_user_business_idx
  on public.business_members (user_id, business_id);

do $setup$ begin raise warning '== applied: 0002 performance indexes ==='; end $setup$;


-- ###########################################################################
-- # 0003 domains, branding, SEO, testimonials
-- # source: supabase/migrations/0003_platform_extensions.sql
-- ###########################################################################

-- Platform extensions: industry presets, custom domains, branding/SEO settings,
-- and testimonials.
--
-- Why these exist:
--   * industry      -> the same application serves restaurants, cafés, beauty
--                      brands, barbershops, gyms, clothing stores… The industry
--                      drives copy/labels (see src/lib/industry.ts), never a
--                      separate codebase.
--   * business_domains -> a request is mapped to a business by hostname, so
--                      each customer can point their own domain at the same
--                      deployment (see src/lib/business.ts).
--   * branding/SEO columns -> colours, hero copy and meta tags are data, not
--                      hard-coded styling.
--   * testimonials  -> owner-managed social proof for the public site.
--
-- Safe to re-run: add column IF NOT EXISTS / DROP POLICY IF EXISTS everywhere.

-- ============================================================================
-- businesses: industry + active flag
-- ============================================================================

alter table public.businesses
  add column if not exists industry text not null default 'other',
  add column if not exists is_active boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'businesses_industry_check'
  ) then
    alter table public.businesses
      add constraint businesses_industry_check check (industry in (
        'restaurant', 'cafe', 'beauty', 'barbershop', 'salon',
        'gym', 'retail', 'other'
      ));
  end if;
end;
$$;

-- ============================================================================
-- business_domains: hostname -> business mapping
-- ============================================================================

create table if not exists public.business_domains (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  -- Stored lowercase, without protocol/port, e.g. "velouralab.com" or
  -- "veloura.vercel.app". A business may have several (apex + www + preview).
  hostname text not null unique check (hostname = lower(hostname) and hostname <> ''),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists business_domains_business_id_idx
  on public.business_domains (business_id);

-- Only one primary hostname per business (used to build canonical URLs).
create unique index if not exists business_domains_one_primary_idx
  on public.business_domains (business_id)
  where is_primary;

-- ============================================================================
-- website_settings: branding, hero copy, SEO
-- ============================================================================

alter table public.website_settings
  add column if not exists hero_title text not null default '',
  add column if not exists hero_subtitle text not null default '',
  add column if not exists hero_cta_label text not null default '',
  add column if not exists primary_color text not null default '#6a0f1f',
  add column if not exists secondary_color text not null default '#d4af37',
  add column if not exists seo_title text not null default '',
  add column if not exists seo_description text not null default '',
  add column if not exists og_image_path text,
  add column if not exists currency text not null default 'USD',
  add column if not exists whatsapp text not null default '',
  add column if not exists show_prices boolean not null default true;

-- Colours are rendered straight into a style attribute as CSS custom
-- properties, so constrain them to plain hex at the database level — a
-- defence-in-depth check on top of the Zod validation in the app.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'website_settings_colors_check'
  ) then
    alter table public.website_settings
      add constraint website_settings_colors_check check (
        primary_color ~* '^#[0-9a-f]{6}$' and secondary_color ~* '^#[0-9a-f]{6}$'
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'website_settings_currency_check'
  ) then
    alter table public.website_settings
      add constraint website_settings_currency_check check (currency ~ '^[A-Z]{3}$');
  end if;
end;
$$;

-- ============================================================================
-- media: allow the social-share ("og") image kind
-- ============================================================================

alter table public.media drop constraint if exists media_kind_check;
alter table public.media
  add constraint media_kind_check
  check (kind in ('product', 'gallery', 'logo', 'hero', 'og', 'other'));

-- ============================================================================
-- testimonials
-- ============================================================================

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  author_name text not null,
  author_role text not null default '',
  quote text not null,
  rating smallint not null default 5 check (rating between 1 and 5),
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists testimonials_business_id_idx on public.testimonials (business_id);

drop trigger if exists set_updated_at on public.testimonials;
create trigger set_updated_at before update on public.testimonials
  for each row execute function public.set_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.business_domains enable row level security;
alter table public.testimonials enable row level security;

-- ---- business_domains ------------------------------------------------------
-- The public site resolves "which business is this hostname?" as an anonymous
-- visitor, so the mapping itself has to be readable. It contains no secrets —
-- just hostnames that are public by definition.
drop policy if exists "business_domains_public_read" on public.business_domains;
create policy "business_domains_public_read"
  on public.business_domains for select
  to anon, authenticated
  using (true);

drop policy if exists "business_domains_member_write" on public.business_domains;
create policy "business_domains_member_write"
  on public.business_domains for all
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- ---- testimonials ----------------------------------------------------------
drop policy if exists "testimonials_public_read_visible" on public.testimonials;
create policy "testimonials_public_read_visible"
  on public.testimonials for select
  to anon, authenticated
  using (is_visible = true);

drop policy if exists "testimonials_member_read_all" on public.testimonials;
create policy "testimonials_member_read_all"
  on public.testimonials for select
  to authenticated
  using (public.is_business_member(business_id));

drop policy if exists "testimonials_member_write" on public.testimonials;
create policy "testimonials_member_write"
  on public.testimonials for all
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

do $setup$ begin raise warning '== applied: 0003 domains, branding, SEO, testimonials ==='; end $setup$;


-- ###########################################################################
-- # 0004 delivery zones, orders, checkout
-- # source: supabase/migrations/0004_checkout.sql
-- ###########################################################################

-- Checkout: cash-on-delivery orders, the way small Lebanese shops actually sell.
--
-- Design notes
--   * Prices are NEVER taken from the browser. Orders are placed through
--     public.place_order(), a SECURITY DEFINER function that re-reads every
--     product price and the delivery fee from the database, so a tampered
--     request cannot buy a $45 brush set for $1. There is deliberately no
--     INSERT policy on orders/order_items for visitors — that function is the
--     only way in.
--   * A visitor can never SELECT orders. The confirmation page reads a single
--     order through public.get_order_by_token(), which matches on an
--     unguessable token and returns only that order.
--   * Delivery is priced per zone (Beirut, Mount Lebanon, Bekaa…), which is
--     how delivery is quoted locally, with an optional free-delivery
--     threshold.
--
-- Safe to re-run.

-- ============================================================================
-- delivery zones
-- ============================================================================

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  fee numeric(10, 2) not null default 0 check (fee >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create index if not exists delivery_zones_business_id_idx on public.delivery_zones (business_id);

drop trigger if exists set_updated_at on public.delivery_zones;
create trigger set_updated_at before update on public.delivery_zones
  for each row execute function public.set_updated_at();

-- ============================================================================
-- orders
-- ============================================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  -- Per-business, human-friendly counter (see assign_order_number below).
  order_number integer not null,
  -- Unguessable key for the customer's confirmation link.
  public_token uuid not null unique default gen_random_uuid(),

  customer_name text not null check (length(btrim(customer_name)) between 2 and 120),
  customer_phone text not null check (length(btrim(customer_phone)) between 6 and 40),
  -- Optional back-up number. The checkout form doesn't ask for one (one number
  -- is enough when every order is confirmed by a phone call), but the column
  -- and the place_order() parameter stay so it can be re-added without a
  -- migration.
  customer_phone_alt text not null default '',
  customer_email text not null default '',

  delivery_zone_id uuid references public.delivery_zones (id) on delete set null,
  -- Snapshot: the zone may be renamed or removed later; the order must not change.
  delivery_zone_name text not null default '',
  city text not null default '',
  address_line text not null check (length(btrim(address_line)) between 3 and 300),
  address_details text not null default '',
  notes text not null default '',

  payment_method text not null default 'cod' check (payment_method in ('cod')),
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  admin_note text not null default '',

  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, order_number)
);

create index if not exists orders_business_created_idx
  on public.orders (business_id, created_at desc);
create index if not exists orders_business_status_idx
  on public.orders (business_id, status);

drop trigger if exists set_updated_at on public.orders;
create trigger set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  -- Denormalised so RLS on this table doesn't have to join through orders.
  business_id uuid not null references public.businesses (id) on delete cascade,
  -- Kept for reporting; deleting a product must not delete order history.
  product_id uuid references public.products (id) on delete set null,
  -- Snapshot of what was actually bought, at the price that was charged.
  name text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 99),
  line_total numeric(10, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_business_id_idx on public.order_items (business_id);

-- ============================================================================
-- checkout settings
-- ============================================================================

alter table public.website_settings
  add column if not exists checkout_enabled boolean not null default true,
  add column if not exists free_delivery_over numeric(10, 2),
  add column if not exists min_order_total numeric(10, 2) not null default 0,
  add column if not exists order_notice text not null default '';

-- ============================================================================
-- per-business order numbers
-- ============================================================================

create or replace function public.assign_order_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.order_number is null or new.order_number = 0 then
    -- Serialise numbering per business so two simultaneous orders can't take
    -- the same number; the lock is released when the transaction ends.
    perform pg_advisory_xact_lock(hashtext(new.business_id::text));
    select coalesce(max(order_number), 1000) + 1
      into new.order_number
      from public.orders
     where business_id = new.business_id;
  end if;
  return new;
end;
$$;

drop trigger if exists assign_order_number on public.orders;
create trigger assign_order_number before insert on public.orders
  for each row execute function public.assign_order_number();

-- ============================================================================
-- place_order: the only way an order can be created
-- ============================================================================
-- items: [{"product_id": "...", "quantity": 2}, ...]
-- Returns: {order_number, public_token, subtotal, delivery_fee, total, currency}
--
-- Everything that decides money — unit prices, the delivery fee, the free
-- delivery threshold, the minimum order — is read from the database here.
-- The caller's only influence is which products and how many.

create or replace function public.place_order(
  p_business_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_address_line text,
  p_items jsonb,
  p_delivery_zone_id uuid default null,
  p_city text default '',
  p_address_details text default '',
  p_notes text default '',
  p_customer_phone_alt text default '',
  p_customer_email text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business public.businesses%rowtype;
  v_settings public.website_settings%rowtype;
  v_order public.orders%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_subtotal numeric(10, 2) := 0;
  v_fee numeric(10, 2) := 0;
  v_zone public.delivery_zones%rowtype;
  v_item_count integer;
  v_recent integer;
  v_has_settings boolean;
begin
  select * into v_business from public.businesses where slug = p_business_slug and is_active;
  if not found then
    raise exception 'This shop is not available.' using errcode = 'P0002';
  end if;

  select * into v_settings from public.website_settings where business_id = v_business.id;
  v_has_settings := found;
  if v_has_settings and not v_settings.checkout_enabled then
    raise exception 'Online ordering is currently closed.' using errcode = 'P0001';
  end if;

  -- Basic abuse guard: a phone number can't fire off dozens of orders a minute.
  select count(*) into v_recent
    from public.orders
   where business_id = v_business.id
     and customer_phone = btrim(p_customer_phone)
     and created_at > now() - interval '10 minutes';
  if v_recent >= 5 then
    raise exception 'Too many orders from this number just now. Please call us instead.'
      using errcode = 'P0001';
  end if;

  v_item_count := jsonb_array_length(coalesce(p_items, '[]'::jsonb));
  if v_item_count = 0 then
    raise exception 'Your cart is empty.' using errcode = 'P0001';
  end if;
  if v_item_count > 50 then
    raise exception 'That is too many different items for one order.' using errcode = 'P0001';
  end if;

  if p_delivery_zone_id is not null then
    select * into v_zone
      from public.delivery_zones
     where id = p_delivery_zone_id and business_id = v_business.id and is_active;
    if not found then
      raise exception 'Choose a delivery area.' using errcode = 'P0001';
    end if;
    v_fee := v_zone.fee;
  end if;

  -- Price every line from the products table, not from the request.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := greatest(1, least(99, coalesce((v_item ->> 'quantity')::integer, 1)));

    select * into v_product
      from public.products
     where id = (v_item ->> 'product_id')::uuid
       and business_id = v_business.id
       and is_visible;

    if not found then
      raise exception 'One of the items is no longer available. Please review your cart.'
        using errcode = 'P0001';
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
  end loop;

  -- NB: use the captured flag, not FOUND — the loop above has overwritten it.
  if v_has_settings and v_settings.min_order_total > 0 and v_subtotal < v_settings.min_order_total then
    raise exception 'Minimum order is %.', v_settings.min_order_total using errcode = 'P0001';
  end if;

  if v_settings.free_delivery_over is not null
     and v_settings.free_delivery_over > 0
     and v_subtotal >= v_settings.free_delivery_over then
    v_fee := 0;
  end if;

  insert into public.orders (
    business_id, customer_name, customer_phone, customer_phone_alt, customer_email,
    delivery_zone_id, delivery_zone_name, city, address_line, address_details, notes,
    subtotal, delivery_fee, total, currency
  ) values (
    v_business.id,
    btrim(p_customer_name),
    btrim(p_customer_phone),
    btrim(coalesce(p_customer_phone_alt, '')),
    btrim(coalesce(p_customer_email, '')),
    v_zone.id,
    coalesce(v_zone.name, ''),
    btrim(coalesce(p_city, '')),
    btrim(p_address_line),
    btrim(coalesce(p_address_details, '')),
    left(btrim(coalesce(p_notes, '')), 1000),
    v_subtotal,
    v_fee,
    v_subtotal + v_fee,
    coalesce(v_settings.currency, 'USD')
  )
  returning * into v_order;

  -- Re-read each product for the line snapshot.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := greatest(1, least(99, coalesce((v_item ->> 'quantity')::integer, 1)));
    select * into v_product
      from public.products
     where id = (v_item ->> 'product_id')::uuid
       and business_id = v_business.id
       and is_visible;

    insert into public.order_items (
      order_id, business_id, product_id, name, unit_price, quantity, line_total
    ) values (
      v_order.id, v_business.id, v_product.id, v_product.name,
      v_product.price, v_quantity, v_product.price * v_quantity
    );
  end loop;

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'public_token', v_order.public_token,
    'subtotal', v_order.subtotal,
    'delivery_fee', v_order.delivery_fee,
    'total', v_order.total,
    'currency', v_order.currency
  );
end;
$$;

revoke all on function public.place_order(text, text, text, text, jsonb, uuid, text, text, text, text, text) from public;
grant execute on function public.place_order(text, text, text, text, jsonb, uuid, text, text, text, text, text)
  to anon, authenticated;

-- ============================================================================
-- get_order_by_token: the customer's own confirmation page
-- ============================================================================

create or replace function public.get_order_by_token(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_items jsonb;
begin
  select * into v_order from public.orders where public_token = p_token;
  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'name', oi.name,
           'unit_price', oi.unit_price,
           'quantity', oi.quantity,
           'line_total', oi.line_total
         ) order by oi.created_at), '[]'::jsonb)
    into v_items
    from public.order_items oi
   where oi.order_id = v_order.id;

  -- Deliberately narrow: no ids, no admin notes, no other customer's data.
  return jsonb_build_object(
    'order_number', v_order.order_number,
    'status', v_order.status,
    'customer_name', v_order.customer_name,
    'customer_phone', v_order.customer_phone,
    'delivery_zone_name', v_order.delivery_zone_name,
    'city', v_order.city,
    'address_line', v_order.address_line,
    'address_details', v_order.address_details,
    'notes', v_order.notes,
    'subtotal', v_order.subtotal,
    'delivery_fee', v_order.delivery_fee,
    'total', v_order.total,
    'currency', v_order.currency,
    'created_at', v_order.created_at,
    'items', v_items
  );
end;
$$;

revoke all on function public.get_order_by_token(uuid) from public;
grant execute on function public.get_order_by_token(uuid) to anon, authenticated;

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- ---- delivery_zones --------------------------------------------------------
-- Visitors need to see the areas and their fees to choose one at checkout.
drop policy if exists "delivery_zones_public_read_active" on public.delivery_zones;
create policy "delivery_zones_public_read_active"
  on public.delivery_zones for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "delivery_zones_member_read_all" on public.delivery_zones;
create policy "delivery_zones_member_read_all"
  on public.delivery_zones for select
  to authenticated
  using (public.is_business_member(business_id));

drop policy if exists "delivery_zones_member_write" on public.delivery_zones;
create policy "delivery_zones_member_write"
  on public.delivery_zones for all
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- ---- orders ----------------------------------------------------------------
-- NOTE the absence of an INSERT policy: visitors cannot write orders directly.
-- place_order() (SECURITY DEFINER) is the only path in, so prices and fees are
-- always the ones in the database.
drop policy if exists "orders_member_read" on public.orders;
create policy "orders_member_read"
  on public.orders for select
  to authenticated
  using (public.is_business_member(business_id));

drop policy if exists "orders_member_update" on public.orders;
create policy "orders_member_update"
  on public.orders for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

drop policy if exists "orders_member_delete" on public.orders;
create policy "orders_member_delete"
  on public.orders for delete
  to authenticated
  using (public.is_business_member(business_id));

-- ---- order_items -----------------------------------------------------------
drop policy if exists "order_items_member_read" on public.order_items;
create policy "order_items_member_read"
  on public.order_items for select
  to authenticated
  using (public.is_business_member(business_id));

drop policy if exists "order_items_member_delete" on public.order_items;
create policy "order_items_member_delete"
  on public.order_items for delete
  to authenticated
  using (public.is_business_member(business_id));

do $setup$ begin raise warning '== applied: 0004 delivery zones, orders, checkout ==='; end $setup$;


-- ###########################################################################
-- # 0005 light/dark, order email, Whish payment
-- # source: supabase/migrations/0005_theme_payments_email.sql
-- ###########################################################################

-- Light/dark site palette, owner order notifications, and Whish payment.
--
--   * color_mode lets a business pick a light (ivory/blush) or dark surface
--     palette. Product photography decides this more than taste does: pastel
--     packshots sit badly on near-black, and vice versa.
--   * order_email is where new-order notifications go — often not the same
--     address as the public contact email.
--   * Whish Money is how a lot of Lebanese customers pay when they don't want
--     cash on the door. The shop's Whish number is a setting; the customer
--     sends the total and types the transfer reference into the order.
--
-- Safe to re-run.

alter table public.website_settings
  add column if not exists color_mode text not null default 'dark',
  add column if not exists order_email text not null default '',
  add column if not exists whish_enabled boolean not null default false,
  add column if not exists whish_number text not null default '',
  add column if not exists whish_note text not null default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'website_settings_color_mode_check') then
    alter table public.website_settings
      add constraint website_settings_color_mode_check check (color_mode in ('dark', 'light'));
  end if;
end;
$$;

-- ============================================================================
-- orders: payment method + reference
-- ============================================================================

alter table public.orders
  add column if not exists payment_reference text not null default '';

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check check (payment_method in ('cod', 'whish'));

-- ============================================================================
-- place_order: accepts a payment method, returns what the notification needs
-- ============================================================================
-- Pricing rules are unchanged: every amount is still read from the database
-- here, never from the request. The two new arguments only record *how* the
-- customer intends to pay, and a Whish transfer reference if they gave one.

create or replace function public.place_order(
  p_business_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_address_line text,
  p_items jsonb,
  p_delivery_zone_id uuid default null,
  p_city text default '',
  p_address_details text default '',
  p_notes text default '',
  p_customer_phone_alt text default '',
  p_customer_email text default '',
  p_payment_method text default 'cod',
  p_payment_reference text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business public.businesses%rowtype;
  v_settings public.website_settings%rowtype;
  v_order public.orders%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_subtotal numeric(10, 2) := 0;
  v_fee numeric(10, 2) := 0;
  v_zone public.delivery_zones%rowtype;
  v_item_count integer;
  v_recent integer;
  v_has_settings boolean;
  v_method text;
  v_items jsonb;
begin
  select * into v_business from public.businesses where slug = p_business_slug and is_active;
  if not found then
    raise exception 'This shop is not available.' using errcode = 'P0002';
  end if;

  select * into v_settings from public.website_settings where business_id = v_business.id;
  v_has_settings := found;
  if v_has_settings and not v_settings.checkout_enabled then
    raise exception 'Online ordering is currently closed.' using errcode = 'P0001';
  end if;

  -- Whish can only be chosen if the shop actually accepts it.
  v_method := lower(coalesce(nullif(btrim(p_payment_method), ''), 'cod'));
  if v_method not in ('cod', 'whish') then
    v_method := 'cod';
  end if;
  if v_method = 'whish' and not (v_has_settings and v_settings.whish_enabled) then
    raise exception 'That payment method is not available.' using errcode = 'P0001';
  end if;

  select count(*) into v_recent
    from public.orders
   where business_id = v_business.id
     and customer_phone = btrim(p_customer_phone)
     and created_at > now() - interval '10 minutes';
  if v_recent >= 5 then
    raise exception 'Too many orders from this number just now. Please call us instead.'
      using errcode = 'P0001';
  end if;

  v_item_count := jsonb_array_length(coalesce(p_items, '[]'::jsonb));
  if v_item_count = 0 then
    raise exception 'Your cart is empty.' using errcode = 'P0001';
  end if;
  if v_item_count > 50 then
    raise exception 'That is too many different items for one order.' using errcode = 'P0001';
  end if;

  if p_delivery_zone_id is not null then
    select * into v_zone
      from public.delivery_zones
     where id = p_delivery_zone_id and business_id = v_business.id and is_active;
    if not found then
      raise exception 'Choose a delivery area.' using errcode = 'P0001';
    end if;
    v_fee := v_zone.fee;
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := greatest(1, least(99, coalesce((v_item ->> 'quantity')::integer, 1)));

    select * into v_product
      from public.products
     where id = (v_item ->> 'product_id')::uuid
       and business_id = v_business.id
       and is_visible;

    if not found then
      raise exception 'One of the items is no longer available. Please review your cart.'
        using errcode = 'P0001';
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
  end loop;

  if v_has_settings and v_settings.min_order_total > 0 and v_subtotal < v_settings.min_order_total then
    raise exception 'Minimum order is %.', v_settings.min_order_total using errcode = 'P0001';
  end if;

  if v_settings.free_delivery_over is not null
     and v_settings.free_delivery_over > 0
     and v_subtotal >= v_settings.free_delivery_over then
    v_fee := 0;
  end if;

  insert into public.orders (
    business_id, customer_name, customer_phone, customer_phone_alt, customer_email,
    delivery_zone_id, delivery_zone_name, city, address_line, address_details, notes,
    payment_method, payment_reference,
    subtotal, delivery_fee, total, currency
  ) values (
    v_business.id,
    btrim(p_customer_name),
    btrim(p_customer_phone),
    btrim(coalesce(p_customer_phone_alt, '')),
    btrim(coalesce(p_customer_email, '')),
    v_zone.id,
    coalesce(v_zone.name, ''),
    btrim(coalesce(p_city, '')),
    btrim(p_address_line),
    btrim(coalesce(p_address_details, '')),
    left(btrim(coalesce(p_notes, '')), 1000),
    v_method,
    left(btrim(coalesce(p_payment_reference, '')), 120),
    v_subtotal,
    v_fee,
    v_subtotal + v_fee,
    coalesce(v_settings.currency, 'USD')
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := greatest(1, least(99, coalesce((v_item ->> 'quantity')::integer, 1)));
    select * into v_product
      from public.products
     where id = (v_item ->> 'product_id')::uuid
       and business_id = v_business.id
       and is_visible;

    insert into public.order_items (
      order_id, business_id, product_id, name, unit_price, quantity, line_total
    ) values (
      v_order.id, v_business.id, v_product.id, v_product.name,
      v_product.price, v_quantity, v_product.price * v_quantity
    );
  end loop;

  select coalesce(jsonb_agg(jsonb_build_object(
           'name', oi.name,
           'unit_price', oi.unit_price,
           'quantity', oi.quantity,
           'line_total', oi.line_total
         ) order by oi.created_at), '[]'::jsonb)
    into v_items
    from public.order_items oi
   where oi.order_id = v_order.id;

  -- The extra fields here are what the server action needs to email the owner
  -- straight after checkout. They describe the order that was just created, so
  -- returning them to the caller who created it reveals nothing new.
  return jsonb_build_object(
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'public_token', v_order.public_token,
    'subtotal', v_order.subtotal,
    'delivery_fee', v_order.delivery_fee,
    'total', v_order.total,
    'currency', v_order.currency,
    'payment_method', v_order.payment_method,
    'payment_reference', v_order.payment_reference,
    'customer_name', v_order.customer_name,
    'customer_phone', v_order.customer_phone,
    'customer_email', v_order.customer_email,
    'delivery_zone_name', v_order.delivery_zone_name,
    'city', v_order.city,
    'address_line', v_order.address_line,
    'address_details', v_order.address_details,
    'notes', v_order.notes,
    'order_email', coalesce(v_settings.order_email, ''),
    'business_name', coalesce(nullif(v_settings.business_name, ''), v_business.name),
    'items', v_items
  );
end;
$$;

revoke all on function public.place_order(text, text, text, text, jsonb, uuid, text, text, text, text, text, text, text) from public;
grant execute on function public.place_order(text, text, text, text, jsonb, uuid, text, text, text, text, text, text, text)
  to anon, authenticated;

-- Drop the previous 11-argument signature so only one version exists.
drop function if exists public.place_order(text, text, text, text, jsonb, uuid, text, text, text, text, text);

-- The customer's receipt should show how they are paying.
create or replace function public.get_order_by_token(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_items jsonb;
begin
  select * into v_order from public.orders where public_token = p_token;
  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'name', oi.name,
           'unit_price', oi.unit_price,
           'quantity', oi.quantity,
           'line_total', oi.line_total
         ) order by oi.created_at), '[]'::jsonb)
    into v_items
    from public.order_items oi
   where oi.order_id = v_order.id;

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'status', v_order.status,
    'customer_name', v_order.customer_name,
    'customer_phone', v_order.customer_phone,
    'delivery_zone_name', v_order.delivery_zone_name,
    'city', v_order.city,
    'address_line', v_order.address_line,
    'address_details', v_order.address_details,
    'notes', v_order.notes,
    'payment_method', v_order.payment_method,
    'payment_reference', v_order.payment_reference,
    'subtotal', v_order.subtotal,
    'delivery_fee', v_order.delivery_fee,
    'total', v_order.total,
    'currency', v_order.currency,
    'created_at', v_order.created_at,
    'items', v_items
  );
end;
$$;

revoke all on function public.get_order_by_token(uuid) from public;
grant execute on function public.get_order_by_token(uuid) to anon, authenticated;

do $setup$ begin raise warning '== applied: 0005 light/dark, order email, Whish payment ==='; end $setup$;


-- ###########################################################################
-- # 0006 sale prices
-- # source: supabase/migrations/0006_sales.sql
-- ###########################################################################

-- Sale prices.
--
-- A sale is two extra columns on a product: what it costs while it's on, and
-- optionally when it stops. Everything else — the catalogue, the cart, the
-- checkout total, the order lines — reads one function, public.effective_price,
-- so there is exactly one definition of "what does this cost right now" and no
-- way for the displayed price and the charged price to drift apart.
--
-- Safe to re-run.

alter table public.products
  add column if not exists sale_price numeric(10, 2),
  add column if not exists sale_ends_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_sale_price_check') then
    alter table public.products
      add constraint products_sale_price_check
      check (sale_price is null or (sale_price >= 0 and sale_price < price));
  end if;
end;
$$;

-- Finding what's on sale is a common query on both sides of the app.
create index if not exists products_business_sale_idx
  on public.products (business_id)
  where sale_price is not null;

-- ============================================================================
-- effective_price: the single source of truth for what an item costs today
-- ============================================================================
-- IMMUTABLE is wrong here (it depends on now()), so it is STABLE — fine for
-- use in selects and in place_order.

create or replace function public.effective_price(
  p_price numeric,
  p_sale_price numeric,
  p_sale_ends_at timestamptz
)
returns numeric
language sql
stable
as $$
  select case
    when p_sale_price is not null
     and p_sale_price < p_price
     and (p_sale_ends_at is null or p_sale_ends_at > now())
    then p_sale_price
    else p_price
  end;
$$;

grant execute on function public.effective_price(numeric, numeric, timestamptz) to anon, authenticated;

-- ============================================================================
-- place_order: charge the sale price when a sale is running
-- ============================================================================
-- Unchanged in every other respect; only the line that computes a line's price
-- moves from products.price to effective_price(...). A customer who loads the
-- page while a sale is on and checks out after it ends pays the full price —
-- the database decides, not the browser.

create or replace function public.place_order(
  p_business_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_address_line text,
  p_items jsonb,
  p_delivery_zone_id uuid default null,
  p_city text default '',
  p_address_details text default '',
  p_notes text default '',
  p_customer_phone_alt text default '',
  p_customer_email text default '',
  p_payment_method text default 'cod',
  p_payment_reference text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business public.businesses%rowtype;
  v_settings public.website_settings%rowtype;
  v_order public.orders%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_unit_price numeric(10, 2);
  v_quantity integer;
  v_subtotal numeric(10, 2) := 0;
  v_fee numeric(10, 2) := 0;
  v_zone public.delivery_zones%rowtype;
  v_item_count integer;
  v_recent integer;
  v_has_settings boolean;
  v_method text;
  v_items jsonb;
begin
  select * into v_business from public.businesses where slug = p_business_slug and is_active;
  if not found then
    raise exception 'This shop is not available.' using errcode = 'P0002';
  end if;

  select * into v_settings from public.website_settings where business_id = v_business.id;
  v_has_settings := found;
  if v_has_settings and not v_settings.checkout_enabled then
    raise exception 'Online ordering is currently closed.' using errcode = 'P0001';
  end if;

  v_method := lower(coalesce(nullif(btrim(p_payment_method), ''), 'cod'));
  if v_method not in ('cod', 'whish') then
    v_method := 'cod';
  end if;
  if v_method = 'whish' and not (v_has_settings and v_settings.whish_enabled) then
    raise exception 'That payment method is not available.' using errcode = 'P0001';
  end if;

  select count(*) into v_recent
    from public.orders
   where business_id = v_business.id
     and customer_phone = btrim(p_customer_phone)
     and created_at > now() - interval '10 minutes';
  if v_recent >= 5 then
    raise exception 'Too many orders from this number just now. Please call us instead.'
      using errcode = 'P0001';
  end if;

  v_item_count := jsonb_array_length(coalesce(p_items, '[]'::jsonb));
  if v_item_count = 0 then
    raise exception 'Your cart is empty.' using errcode = 'P0001';
  end if;
  if v_item_count > 50 then
    raise exception 'That is too many different items for one order.' using errcode = 'P0001';
  end if;

  if p_delivery_zone_id is not null then
    select * into v_zone
      from public.delivery_zones
     where id = p_delivery_zone_id and business_id = v_business.id and is_active;
    if not found then
      raise exception 'Choose a delivery area.' using errcode = 'P0001';
    end if;
    v_fee := v_zone.fee;
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := greatest(1, least(99, coalesce((v_item ->> 'quantity')::integer, 1)));

    select * into v_product
      from public.products
     where id = (v_item ->> 'product_id')::uuid
       and business_id = v_business.id
       and is_visible;

    if not found then
      raise exception 'One of the items is no longer available. Please review your cart.'
        using errcode = 'P0001';
    end if;

    v_subtotal := v_subtotal
      + (public.effective_price(v_product.price, v_product.sale_price, v_product.sale_ends_at) * v_quantity);
  end loop;

  if v_has_settings and v_settings.min_order_total > 0 and v_subtotal < v_settings.min_order_total then
    raise exception 'Minimum order is %.', v_settings.min_order_total using errcode = 'P0001';
  end if;

  if v_settings.free_delivery_over is not null
     and v_settings.free_delivery_over > 0
     and v_subtotal >= v_settings.free_delivery_over then
    v_fee := 0;
  end if;

  insert into public.orders (
    business_id, customer_name, customer_phone, customer_phone_alt, customer_email,
    delivery_zone_id, delivery_zone_name, city, address_line, address_details, notes,
    payment_method, payment_reference,
    subtotal, delivery_fee, total, currency
  ) values (
    v_business.id,
    btrim(p_customer_name),
    btrim(p_customer_phone),
    btrim(coalesce(p_customer_phone_alt, '')),
    btrim(coalesce(p_customer_email, '')),
    v_zone.id,
    coalesce(v_zone.name, ''),
    btrim(coalesce(p_city, '')),
    btrim(p_address_line),
    btrim(coalesce(p_address_details, '')),
    left(btrim(coalesce(p_notes, '')), 1000),
    v_method,
    left(btrim(coalesce(p_payment_reference, '')), 120),
    v_subtotal,
    v_fee,
    v_subtotal + v_fee,
    coalesce(v_settings.currency, 'USD')
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := greatest(1, least(99, coalesce((v_item ->> 'quantity')::integer, 1)));
    select * into v_product
      from public.products
     where id = (v_item ->> 'product_id')::uuid
       and business_id = v_business.id
       and is_visible;

    v_unit_price := public.effective_price(v_product.price, v_product.sale_price, v_product.sale_ends_at);

    insert into public.order_items (
      order_id, business_id, product_id, name, unit_price, quantity, line_total
    ) values (
      v_order.id, v_business.id, v_product.id, v_product.name,
      v_unit_price, v_quantity, v_unit_price * v_quantity
    );
  end loop;

  select coalesce(jsonb_agg(jsonb_build_object(
           'name', oi.name,
           'unit_price', oi.unit_price,
           'quantity', oi.quantity,
           'line_total', oi.line_total
         ) order by oi.created_at), '[]'::jsonb)
    into v_items
    from public.order_items oi
   where oi.order_id = v_order.id;

  return jsonb_build_object(
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'public_token', v_order.public_token,
    'subtotal', v_order.subtotal,
    'delivery_fee', v_order.delivery_fee,
    'total', v_order.total,
    'currency', v_order.currency,
    'payment_method', v_order.payment_method,
    'payment_reference', v_order.payment_reference,
    'customer_name', v_order.customer_name,
    'customer_phone', v_order.customer_phone,
    'customer_email', v_order.customer_email,
    'delivery_zone_name', v_order.delivery_zone_name,
    'city', v_order.city,
    'address_line', v_order.address_line,
    'address_details', v_order.address_details,
    'notes', v_order.notes,
    'order_email', coalesce(v_settings.order_email, ''),
    'business_name', coalesce(nullif(v_settings.business_name, ''), v_business.name),
    'items', v_items
  );
end;
$$;

revoke all on function public.place_order(text, text, text, text, jsonb, uuid, text, text, text, text, text, text, text) from public;
grant execute on function public.place_order(text, text, text, text, jsonb, uuid, text, text, text, text, text, text, text)
  to anon, authenticated;

do $setup$ begin raise warning '== applied: 0006 sale prices ==='; end $setup$;


-- ###########################################################################
-- # seed Veloura Lab demo content
-- # source: supabase/seed/veloura_lab.sql
-- ###########################################################################

-- ============================================================================
-- DEMO DATA — Veloura Lab (luxury beauty tools & skincare, Lebanon)
-- ============================================================================
-- This is the first business configured on the platform. Everything below is
-- ordinary data: no part of the application is specific to it.
--
-- WHAT IS REAL vs. PLACEHOLDER
--   Real, supplied by the business owner:
--     business name, industry, tagline, phone/WhatsApp, Instagram URL,
--     country, brand colours, SEO title/description, product line-up.
--   PLACEHOLDER — replace before going live (search for "PLACEHOLDER"):
--     * email      -> hello@velouralab.example  (.example is a reserved
--                     documentation domain, so it can never reach a stranger)
--     * prices     -> illustrative demo prices
--     * hours      -> illustrative demo hours
--     * testimonials -> illustrative demo reviews, not real customers
--     * hostnames  -> localhost only until a real domain is connected
--
-- Product/gallery photos are intentionally left empty: hotlinking someone
-- else's images would be wrong, and the site renders a designed placeholder
-- until real photos are uploaded from Dashboard -> Media / product editor.
--
-- Safe to re-run: every insert upserts on a natural key.

do $$
declare
  biz_id uuid;
  cat_tools uuid;
  cat_skincare uuid;
  cat_sleep uuid;
  cat_oral uuid;
  cat_sets uuid;
begin
  -- ---- business ------------------------------------------------------------
  insert into public.businesses (slug, name, industry)
  values ('veloura-lab', 'Veloura Lab', 'beauty')
  on conflict (slug) do update
    set name = excluded.name, industry = excluded.industry
  returning id into biz_id;

  -- ---- domains -------------------------------------------------------------
  -- Local development only. Add the customer's real domain here (and in the
  -- Vercel project) when it is purchased — see README "Custom domains".
  insert into public.business_domains (business_id, hostname, is_primary)
  values (biz_id, 'localhost', false)
  on conflict (hostname) do update set business_id = excluded.business_id;

  -- ---- website settings ----------------------------------------------------
  insert into public.website_settings (
    business_id, business_name, tagline, about_text,
    hero_title, hero_subtitle, hero_cta_label,
    primary_color, secondary_color, color_mode,
    seo_title, seo_description,
    phone, whatsapp, email, address, currency, show_prices,
    hours, social_links
  )
  values (
    biz_id,
    'Veloura Lab',
    'The Touch of Luxury',
    E'Veloura Lab began with a simple belief: the tools you reach for every morning should feel as considered as the skin they touch.\n' ||
    E'We curate premium beauty tools and skincare essentials — the curler that lifts without pinching, the brushes that blend like silk, the silk set that protects your hair while you sleep. Every piece is chosen for how it feels in the hand on the hundredth use, not the first.\n' ||
    E'Cash on delivery all over Lebanon. Message us on WhatsApp or Instagram and we will help you choose.',
    'The Touch of Luxury',
    'Premium beauty tools and skincare, curated for everyday ritual — delivered across Lebanon with cash on delivery.',
    'Shop the collection',
    '#7d1230',                             -- wine, from the logo's velvet
    '#b8893b',                             -- gold, from the wordmark
    'light',                               -- ivory surface: the product photography is pale
    'Veloura Lab | Premium Beauty & Skincare',
    'Discover beauty, skincare, makeup, and self-care essentials at Veloura Lab. Shop quality beauty products in Lebanon and find your new favorites.',
    '+961 70 349 245',
    '+96170349245',
    'hello@velouralab.example',            -- PLACEHOLDER
    'Lebanon — cash on delivery nationwide',
    'USD',
    true,
    -- PLACEHOLDER hours (demo)
    '{"mon": "10:00 - 19:00", "tue": "10:00 - 19:00", "wed": "10:00 - 19:00", "thu": "10:00 - 19:00", "fri": "10:00 - 19:00", "sat": "11:00 - 18:00", "sun": "Closed"}'::jsonb,
    '{"instagram": "https://www.instagram.com/velouralab.lb"}'::jsonb
  )
  on conflict (business_id) do update set
    business_name = excluded.business_name,
    tagline = excluded.tagline,
    about_text = excluded.about_text,
    hero_title = excluded.hero_title,
    hero_subtitle = excluded.hero_subtitle,
    hero_cta_label = excluded.hero_cta_label,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    color_mode = excluded.color_mode,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    phone = excluded.phone,
    whatsapp = excluded.whatsapp,
    email = excluded.email,
    address = excluded.address,
    currency = excluded.currency,
    show_prices = excluded.show_prices,
    hours = excluded.hours,
    social_links = excluded.social_links;

  -- ---- categories ----------------------------------------------------------
  -- Seeded once: categories carry no unique key, so a plain insert would
  -- duplicate them every time this file is re-run.
  if not exists (select 1 from public.categories where business_id = biz_id) then
    insert into public.categories (business_id, name, sort_order) values
      (biz_id, 'Beauty Tools', 1),
      (biz_id, 'Skincare Rituals', 2),
      (biz_id, 'Sleep & Hair', 3),
      (biz_id, 'Oral Care', 4),
      (biz_id, 'Gift Sets', 5);
  end if;

  select id into cat_tools    from public.categories where business_id = biz_id and name = 'Beauty Tools';
  select id into cat_skincare from public.categories where business_id = biz_id and name = 'Skincare Rituals';
  select id into cat_sleep    from public.categories where business_id = biz_id and name = 'Sleep & Hair';
  select id into cat_oral     from public.categories where business_id = biz_id and name = 'Oral Care';
  select id into cat_sets     from public.categories where business_id = biz_id and name = 'Gift Sets';

  -- ---- products (prices are PLACEHOLDER demo values) ------------------------
  -- Seeded once, for the same reason as the reviews below.
  if not exists (select 1 from public.products where business_id = biz_id) then
    insert into public.products (business_id, category_id, name, description, price, sort_order) values
      (biz_id, cat_tools, 'Premium Eyelash Curler',
       'Rose-gold curler with a soft silicone pad that lifts and curls in one press — no pinching, no breakage. Naturally longer-looking lashes that hold all day.',
       18, 1),
      (biz_id, cat_tools, 'Premium Makeup Brush Set',
       'A complete set of ultra-soft synthetic brushes in a travel case. Flawless blending for face and eyes, built to keep their shape wash after wash.',
       45, 2),
      (biz_id, cat_tools, 'Makeup Brush Cleaning Mat',
       'Textured silicone mat with multiple grooves for deep-cleaning every brush size. Cleaner brushes, healthier skin, longer-lasting bristles.',
       12, 3),
      (biz_id, cat_skincare, 'Face Roller & Gua Sha Set',
       'Natural jade-stone roller and gua sha in a gift box. Depuffs, sculpts and helps your serums absorb — a two-minute ritual, morning and night.',
       32, 4),
      (biz_id, cat_sleep, 'Luxury Silk Sleep Set',
       'Silk pillowcase, eye mask and scrunchie. Gentler on skin and hair than cotton: less frizz, fewer creases, deeper sleep.',
       38, 5),
      (biz_id, cat_oral, 'Premium Tongue Scraper Set',
       'Stainless-steel scrapers with travel cases. Removes residue and bacteria, freshens breath and brings back taste sensitivity.',
       15, 6),
      (biz_id, cat_sets, 'The Glow Ritual Set',
       'Our signature bundle: face roller and gua sha, silk sleep set and cleansing mat — everything for a complete evening ritual, boxed and ready to gift.',
       89, 7);
  end if;

  -- ---- testimonials (PLACEHOLDER demo reviews — replace with real ones) -----
  -- Only seeded once: there is no natural key to upsert on, so re-running the
  -- file must not pile up duplicates.
  if not exists (select 1 from public.testimonials where business_id = biz_id) then
    insert into public.testimonials (business_id, author_name, author_role, quote, rating, sort_order) values
      (biz_id, 'Lara K.', 'Beirut', 'The eyelash curler is the first one that never pinched me. Delivery was next day and the packaging felt like a gift.', 5, 1),
      (biz_id, 'Maya S.', 'Jounieh', 'I bought the silk set for my sister and ended up ordering a second one for myself. My hair has never been this calm in the morning.', 5, 2),
      (biz_id, 'Rita A.', 'Tripoli', 'Ordered through WhatsApp, paid on delivery, arrived in two days. The gua sha set is beautiful — it lives on my dresser now.', 5, 3);
  end if;
end;
$$;

-- Sanity check: should list the business with its catalogue counts.
select b.slug,
       b.industry,
       (select count(*) from public.categories c where c.business_id = b.id) as categories,
       (select count(*) from public.products p where p.business_id = b.id) as products,
       (select count(*) from public.testimonials t where t.business_id = b.id) as testimonials
from public.businesses b
where b.slug = 'veloura-lab';

-- ============================================================================
-- Delivery zones + checkout settings (cash on delivery, Lebanon)
-- ============================================================================
-- Fees below are PLACEHOLDER demo values — set the real ones in
-- Dashboard -> Delivery, or edit here before going live.

do $$
declare
  biz_id uuid;
begin
  select id into biz_id from public.businesses where slug = 'veloura-lab';

  insert into public.delivery_zones (business_id, name, fee, sort_order) values
    (biz_id, 'Beirut', 3, 1),
    (biz_id, 'Mount Lebanon', 4, 2),
    (biz_id, 'North Lebanon', 5, 3),
    (biz_id, 'Akkar', 6, 4),
    (biz_id, 'South Lebanon', 5, 5),
    (biz_id, 'Nabatieh', 5, 6),
    (biz_id, 'Bekaa', 5, 7),
    (biz_id, 'Baalbek-Hermel', 6, 8)
  on conflict (business_id, name) do update set fee = excluded.fee, sort_order = excluded.sort_order;

  update public.website_settings
     set checkout_enabled = true,
         free_delivery_over = 75,          -- PLACEHOLDER
         min_order_total = 0,
         order_notice = 'Cash on delivery all over Lebanon. We call to confirm every order before it ships — usually within a few hours.',
         -- PLACEHOLDER: set the real inbox in Dashboard -> Website, and the
         -- real Whish number in Dashboard -> Delivery, before going live.
         order_email = 'orders@velouralab.example',
         whish_enabled = true,
         whish_number = '70 349 245',
         whish_note = 'Send the exact total on Whish, then add the reference below so we can match your transfer.'
   where business_id = biz_id;
end;
$$;

do $setup$ begin raise warning '== applied: seed Veloura Lab demo content ==='; end $setup$;


-- ###########################################################################
-- # Done. Next: Authentication -> Users -> Add user (tick Auto Confirm),
-- # then run supabase/seed/link_owner.sql with your email to get access.
-- ###########################################################################
