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
    '#a5122b',                             -- deep red; the surfaces are mixed from it
    '#b8893b',                             -- gold, from the wordmark
    'dark',                                -- near-black ground, bled through with the red above
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
