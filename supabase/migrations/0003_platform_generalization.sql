-- Platform generalization: make the application reusable across industries.
--
-- Up to now the schema assumed one industry (restaurant) and one deployment
-- per business, resolved from an environment variable. This migration adds
-- the three things that were missing for a real multi-business platform:
--
--   1. businesses.business_type  — drives site vocabulary/routes per tenant
--      ("Menu" for a restaurant, "Shop" for a bookshop, "Services" for a
--      salon) so the SAME code renders an appropriate site for each.
--   2. business_domains          — maps a hostname to a business, so one
--      deployment can serve many businesses on their own custom domains.
--   3. branding/SEO/hero columns — colors, hero copy and SEO metadata move
--      out of hard-coded components and into owner-editable data.
--
-- Safe to re-run: every statement is IF NOT EXISTS / OR REPLACE / DROP ... IF
-- EXISTS guarded.

-- ============================================================================
-- 1. businesses: industry + currency
-- ============================================================================

alter table public.businesses
  add column if not exists business_type text not null default 'general';

-- Keep this list in sync with BUSINESS_TYPES in src/lib/business-types.ts.
-- An unknown value would leave the site with no vocabulary to render, so the
-- database refuses it rather than letting a typo reach production.
alter table public.businesses drop constraint if exists businesses_business_type_check;
alter table public.businesses
  add constraint businesses_business_type_check check (
    business_type in (
      'restaurant', 'cafe', 'bakery', 'bookshop', 'retail',
      'barbershop', 'salon', 'gym', 'general'
    )
  );

-- Prices are stored as a plain numeric; the currency they're expressed in is
-- a per-business display concern (a Beirut bookshop and a Paris bistro are
-- both valid tenants of this platform).
alter table public.businesses
  add column if not exists currency text not null default 'USD';

alter table public.businesses drop constraint if exists businesses_currency_check;
alter table public.businesses
  add constraint businesses_currency_check check (currency ~ '^[A-Z]{3}$');

-- ============================================================================
-- 2. business_domains: hostname -> business
-- ============================================================================
--
-- One deployment, many businesses, each on its own domain. A request's Host
-- header is looked up here to decide whose site to render. Hostnames are
-- stored lowercase and without a port, which is what the resolver normalizes
-- to before querying.

create table if not exists public.business_domains (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  hostname text not null unique,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint business_domains_hostname_lowercase check (hostname = lower(hostname)),
  constraint business_domains_hostname_no_port check (hostname !~ ':')
);

create index if not exists business_domains_business_id_idx
  on public.business_domains (business_id);

-- At most one primary domain per business (the canonical URL used for SEO and
-- the dashboard's "View website" link).
create unique index if not exists business_domains_one_primary_idx
  on public.business_domains (business_id)
  where is_primary;

-- ============================================================================
-- 3. website_settings: branding, hero copy, SEO, WhatsApp
-- ============================================================================

alter table public.website_settings
  add column if not exists primary_color text not null default '#C8A44D',
  add column if not exists secondary_color text not null default '#0E1420',
  add column if not exists hero_title text not null default '',
  add column if not exists hero_subtitle text not null default '',
  add column if not exists seo_title text not null default '',
  add column if not exists seo_description text not null default '',
  add column if not exists whatsapp text not null default '';

-- Colors are interpolated straight into a <style> tag on the public site, so
-- the format is constrained at the database level as well as in the form
-- validator — this is what makes that injection safe.
alter table public.website_settings drop constraint if exists website_settings_primary_color_check;
alter table public.website_settings
  add constraint website_settings_primary_color_check
  check (primary_color ~ '^#[0-9A-Fa-f]{6}$');

alter table public.website_settings drop constraint if exists website_settings_secondary_color_check;
alter table public.website_settings
  add constraint website_settings_secondary_color_check
  check (secondary_color ~ '^#[0-9A-Fa-f]{6}$');

-- ============================================================================
-- 4. RLS for business_domains
-- ============================================================================
--
-- Public read is required: resolving "which business does this hostname
-- belong to?" happens for anonymous visitors on every public request, before
-- anyone is signed in. A hostname is public information by definition — it is
-- in the browser's address bar. Writes stay restricted to members.

alter table public.business_domains enable row level security;

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
