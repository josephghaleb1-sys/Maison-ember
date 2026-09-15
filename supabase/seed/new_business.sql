-- ============================================================================
-- TEMPLATE — add a new business (customer) to the platform
-- ============================================================================
-- Copy this file, fill in the block at the top, run it in the Supabase SQL
-- Editor, then link an owner with link_owner.sql. That is the whole process:
-- no code changes, no redeploy, no second codebase.
--
-- industry must be one of:
--   restaurant | cafe | beauty | barbershop | salon | gym | retail | other
-- It selects the site's vocabulary and the catalogue URL
-- (/menu, /services or /shop) — see src/lib/industry.ts.

do $$
declare
  -- ---- EDIT THESE ---------------------------------------------------------
  v_slug        text := 'my-business';          -- url-safe, unique
  v_name        text := 'My Business';
  v_industry    text := 'retail';
  v_hostname    text := '';                     -- e.g. 'mybusiness.com', or '' for none yet
  v_tagline     text := 'Our one-line promise.';
  v_hero_title  text := 'My Business';
  v_hero_sub    text := 'What we do, in a sentence a visitor can act on.';
  v_primary     text := '#6a0f1f';              -- brand colour, #rrggbb
  v_secondary   text := '#d4af37';              -- accent colour, #rrggbb
  v_phone       text := '';
  v_whatsapp    text := '';                     -- digits, incl. country code
  v_email       text := '';
  v_address     text := '';
  v_currency    text := 'USD';
  -- Delivery areas for cash-on-delivery checkout: name => fee. Set to
  -- '{}'::jsonb if this business doesn't deliver (checkout then still works
  -- with no area choice, or turn checkout off in the dashboard).
  v_zones       jsonb := '{"Beirut": 3, "Mount Lebanon": 4, "North Lebanon": 5, "South Lebanon": 5, "Bekaa": 5}'::jsonb;
  -- -------------------------------------------------------------------------
  biz_id uuid;
begin
  insert into public.businesses (slug, name, industry)
  values (v_slug, v_name, v_industry)
  on conflict (slug) do update
    set name = excluded.name, industry = excluded.industry
  returning id into biz_id;

  insert into public.website_settings (
    business_id, business_name, tagline, hero_title, hero_subtitle,
    primary_color, secondary_color, seo_title, seo_description,
    phone, whatsapp, email, address, currency
  )
  values (
    biz_id, v_name, v_tagline, v_hero_title, v_hero_sub,
    v_primary, v_secondary, v_name, v_tagline,
    v_phone, v_whatsapp, v_email, v_address, v_currency
  )
  on conflict (business_id) do update set
    business_name = excluded.business_name,
    tagline = excluded.tagline,
    hero_title = excluded.hero_title,
    hero_subtitle = excluded.hero_subtitle,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    phone = excluded.phone,
    whatsapp = excluded.whatsapp,
    email = excluded.email,
    address = excluded.address,
    currency = excluded.currency;

  -- Delivery areas
  insert into public.delivery_zones (business_id, name, fee, sort_order)
  select biz_id, zone.key, (zone.value)::numeric, ordinality
    from jsonb_each(v_zones) with ordinality as zone(key, value, ordinality)
  on conflict (business_id, name) do update set fee = excluded.fee;

  if v_hostname <> '' then
    insert into public.business_domains (business_id, hostname, is_primary)
    values (biz_id, lower(v_hostname), true)
    on conflict (hostname) do update
      set business_id = excluded.business_id, is_primary = excluded.is_primary;
  end if;

  raise notice 'Business % ready (id %). Now run link_owner.sql for its owner.', v_slug, biz_id;
end;
$$;
