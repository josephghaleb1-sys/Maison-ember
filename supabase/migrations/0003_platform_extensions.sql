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
