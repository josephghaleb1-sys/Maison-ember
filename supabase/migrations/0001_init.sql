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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media_bucket_public_read" on storage.objects;
create policy "media_bucket_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

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
