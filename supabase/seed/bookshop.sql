-- ============================================================================
-- DEMO DATA — "Bookshop"
-- ============================================================================
--
-- This file seeds the first configured business on the platform. Everything
-- in it is DEMO CONTENT, safe to delete or overwrite once real customer
-- details are available:
--
--   * Phone numbers use the 555 range, which is reserved for fiction and can
--     never reach a real subscriber.
--   * The address, email and social handles are placeholders.
--   * Product titles and blurbs are written for the demo and are not real
--     catalogue listings.
--
-- Replace all of it from the dashboard (Business info / Website / Catalog) —
-- no code change required.
--
-- >>> BRAND COLORS: the palette below is a PLACEHOLDER (ink + antique gold).
-- >>> Swap primary_color / secondary_color for the customer's real brand
-- >>> colors — either here before first run, or in the dashboard at any time
-- >>> under Website -> Brand colors.
--
-- Safe to re-run: upserts by slug/business_id, so running it twice does not
-- duplicate rows.

do $$
declare
  biz_id uuid;
  cat_fiction uuid;
  cat_nonfiction uuid;
  cat_rare uuid;
  cat_stationery uuid;
  cat_accessories uuid;
begin
  -- ---- business -------------------------------------------------------------
  insert into public.businesses (slug, name, business_type, currency)
  values ('bookshop', 'Bookshop', 'bookshop', 'USD')
  on conflict (slug) do update set
    name = excluded.name,
    business_type = excluded.business_type,
    currency = excluded.currency
  returning id into biz_id;

  -- ---- website settings -----------------------------------------------------
  insert into public.website_settings (
    business_id, business_name, tagline, about_text,
    phone, whatsapp, email, address, hours, social_links,
    primary_color, secondary_color, hero_title, hero_subtitle,
    seo_title, seo_description
  )
  values (
    biz_id,
    'Bookshop',
    'Books worth keeping.',
    E'Bookshop began with a simple conviction: that a book you love deserves to be an object you keep. Not a file that disappears when a subscription lapses — a thing with weight, with a spine that creases where you stopped, with paper that takes an ink note in the margin.\n'
      || E'\nWe stock a deliberately small selection. Every title on our shelves is one of us has read and argued for, which means we carry fewer books than a chain and can tell you something true about each one. Modern fiction sits beside essays, natural history beside design monographs, and a case of rare and collectible editions anchors the back room.\n'
      || E'\nAlongside the books we keep the things that go with them: Japanese fountain pens, linen-bound notebooks, brass bookmarks, reading lights that will outlast the shelf they clamp to. Come in, take your time, and ask us what we are reading.',
    '+1 (555) 014-2200',
    '+1 555 014 2201',
    'hello@bookshop.example',
    '18 Quill Street, Old Town',
    '{"mon": "10:00 AM - 7:00 PM", "tue": "10:00 AM - 7:00 PM", "wed": "10:00 AM - 7:00 PM", "thu": "10:00 AM - 8:00 PM", "fri": "10:00 AM - 8:00 PM", "sat": "10:00 AM - 8:00 PM", "sun": "12:00 PM - 6:00 PM"}'::jsonb,
    '{"instagram": "https://instagram.com/example_bookshop", "facebook": "https://facebook.com/example_bookshop"}'::jsonb,
    '#C8A44D',
    '#0E1420',
    'Books worth keeping.',
    'A small, considered bookshop — modern fiction, essays and rare editions, alongside the pens, papers and reading things that belong with them.',
    'Bookshop | Books, Rare Editions & Reading Accessories',
    'A considered selection of fiction, non-fiction and rare editions, alongside fine stationery and reading accessories. Visit us in store or get in touch.'
  )
  on conflict (business_id) do update set
    business_name = excluded.business_name,
    tagline = excluded.tagline,
    about_text = excluded.about_text,
    phone = excluded.phone,
    whatsapp = excluded.whatsapp,
    email = excluded.email,
    address = excluded.address,
    hours = excluded.hours,
    social_links = excluded.social_links,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    hero_title = excluded.hero_title,
    hero_subtitle = excluded.hero_subtitle,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description;

  -- ---- categories -----------------------------------------------------------
  insert into public.categories (business_id, name, sort_order)
  values (biz_id, 'Fiction', 1)
  on conflict do nothing;
  select id into cat_fiction from public.categories where business_id = biz_id and name = 'Fiction';

  insert into public.categories (business_id, name, sort_order)
  values (biz_id, 'Non-Fiction', 2)
  on conflict do nothing;
  select id into cat_nonfiction from public.categories where business_id = biz_id and name = 'Non-Fiction';

  insert into public.categories (business_id, name, sort_order)
  values (biz_id, 'Rare & Collectible', 3)
  on conflict do nothing;
  select id into cat_rare from public.categories where business_id = biz_id and name = 'Rare & Collectible';

  insert into public.categories (business_id, name, sort_order)
  values (biz_id, 'Stationery', 4)
  on conflict do nothing;
  select id into cat_stationery from public.categories where business_id = biz_id and name = 'Stationery';

  insert into public.categories (business_id, name, sort_order)
  values (biz_id, 'Reading Accessories', 5)
  on conflict do nothing;
  select id into cat_accessories from public.categories where business_id = biz_id and name = 'Reading Accessories';

  -- ---- catalogue: only insert if this business has none yet (idempotent) -----
  --
  -- image_path is intentionally left null. Production data must never hotlink
  -- third-party photography — upload real images from the dashboard's Media
  -- library or the item editor. Until then the public site renders a branded
  -- monogram placeholder, which is a deliberate design state rather than a
  -- broken image.
  if not exists (select 1 from public.products where business_id = biz_id) then

    insert into public.products (business_id, category_id, name, description, price, sort_order) values
    (biz_id, cat_fiction, 'The Salt Almanac', 'A debut novel that follows three generations of a lighthouse family across one contracting coastline. Hardcover, 384 pages.', 28.00, 1),
    (biz_id, cat_fiction, 'Nine Kinds of Weather', 'Linked short stories set over a single year in a northern port town. Our most recommended book this season.', 22.00, 2),
    (biz_id, cat_fiction, 'A Room Lent to Us', 'Quiet, precise and very funny on the subject of inherited houses and the people who refuse to leave them.', 24.00, 3),
    (biz_id, cat_fiction, 'The Cartographer''s Wife', 'Historical fiction, mapped across four expeditions and one long argument. Paperback.', 18.00, 4),

    (biz_id, cat_nonfiction, 'On Keeping Things', 'Essays on repair, inheritance and why we hold on to objects that no longer work. Cloth bound.', 26.00, 1),
    (biz_id, cat_nonfiction, 'Field Notes on Rivers', 'Twelve years of walking one watershed, with the author''s own pen-and-ink drawings throughout.', 32.00, 2),
    (biz_id, cat_nonfiction, 'The Grammar of Cities', 'How street layout shapes the way neighbourhoods speak to each other. Illustrated, 300 pages.', 34.00, 3),
    (biz_id, cat_nonfiction, 'Slow Light', 'A working photographer''s account of one year without digital exposure. Duotone plates.', 45.00, 4),

    (biz_id, cat_rare, 'First Edition — The Salt Almanac', 'Signed first printing, numbered from an edition of 300. Housed in the publisher''s slipcase.', 340.00, 1),
    (biz_id, cat_rare, 'Letterpress Folio — Coastal Studies', 'Hand-set and printed on Somerset paper, sewn binding, edition of 120.', 480.00, 2),
    (biz_id, cat_rare, 'Antiquarian Atlas, 1911', 'Full-colour plates, original boards rebacked in calf. Condition notes available on request.', 1250.00, 3),

    (biz_id, cat_stationery, 'Linen Notebook — Ruled', 'Smyth-sewn, lies completely flat, 160gsm cream paper that takes fountain pen ink without bleed.', 26.00, 1),
    (biz_id, cat_stationery, 'Fountain Pen — Brass, Fine Nib', 'Solid brass barrel that patinas with use. Converter and one ink cartridge included.', 96.00, 2),
    (biz_id, cat_stationery, 'Bottled Ink — Oak Gall Black', 'A deep, slightly warm black. 50ml glass bottle.', 19.00, 3),
    (biz_id, cat_stationery, 'Letter Set — Laid Paper', 'Twenty sheets and ten lined envelopes in a soft grey folder.', 24.00, 4),

    (biz_id, cat_accessories, 'Brass Bookmark', 'Weighted, hand-finished, ages to a soft gold. Comes boxed.', 18.00, 1),
    (biz_id, cat_accessories, 'Reading Light — Clip', 'Warm 2700K light, three brightness levels, USB-C, clamps without marking the boards.', 54.00, 2),
    (biz_id, cat_accessories, 'Canvas Book Tote', 'Heavyweight cotton canvas with a reinforced base. Holds a week of reading.', 38.00, 3),
    (biz_id, cat_accessories, 'Oak Book Stand', 'Adjustable to three angles, folds flat. Finished with hard wax oil.', 88.00, 4);

  end if;
end $$;

-- ---------------------------------------------------------------------------
-- OPTIONAL: connect a custom domain to this business.
--
-- Adding the row is only half the job — the domain must also be added to your
-- hosting project (e.g. Vercel -> Project -> Domains) and its DNS pointed
-- there. Until both are done the hostname won't reach this application.
--
-- Uncomment and edit:
--
-- insert into public.business_domains (business_id, hostname, is_primary)
-- select id, 'bookshop.example.com', true from public.businesses where slug = 'bookshop'
-- on conflict (hostname) do nothing;
-- ---------------------------------------------------------------------------
