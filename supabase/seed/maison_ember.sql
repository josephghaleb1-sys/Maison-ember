-- Demo data for the fictional restaurant "Maison Ember".
-- Safe to re-run: upserts by slug/business_id, so running it twice does not
-- duplicate rows.
--
-- NOTE: product/gallery photos are intentionally left blank (image_path is
-- null). Real production data must not hotlink third-party images — upload
-- real photos from the admin dashboard's Media Library / product editor.
-- The public site renders a clean placeholder until an image is uploaded.

do $$
declare
  biz_id uuid;
  cat_starters uuid;
  cat_mains uuid;
  cat_sides uuid;
  cat_desserts uuid;
  cat_drinks uuid;
begin
  -- ---- business -----------------------------------------------------------
  insert into public.businesses (slug, name)
  values ('maison-ember', 'Maison Ember')
  on conflict (slug) do update set name = excluded.name
  returning id into biz_id;

  -- ---- website settings -----------------------------------------------------
  insert into public.website_settings (
    business_id, business_name, tagline, about_text,
    phone, email, address, hours, social_links
  )
  values (
    biz_id,
    'Maison Ember',
    'Wood-fired cooking, modern French soul.',
    'Maison Ember began as a single cast-iron hearth and a stubborn belief that fire is the oldest and best seasoning there is. Every dish that leaves our kitchen passes over live oak and applewood coals before it reaches your table. Our chefs blend classic French technique with the char, smoke, and spontaneity of open-flame cooking — small plates built for sharing, mains built for lingering, and a wine list built for both. Pull up a seat at the hearth.',
    '(415) 555-0142',
    'hello@maisonember.com',
    '214 Kindling Lane, San Francisco, CA 94110',
    '{"mon": "Closed", "tue": "5:00 PM - 10:00 PM", "wed": "5:00 PM - 10:00 PM", "thu": "5:00 PM - 10:00 PM", "fri": "5:00 PM - 11:00 PM", "sat": "5:00 PM - 11:00 PM", "sun": "11:00 AM - 9:00 PM"}'::jsonb,
    '{"instagram": "https://instagram.com/maisonember", "facebook": "https://facebook.com/maisonember"}'::jsonb
  )
  on conflict (business_id) do update set
    business_name = excluded.business_name,
    tagline = excluded.tagline,
    about_text = excluded.about_text,
    phone = excluded.phone,
    email = excluded.email,
    address = excluded.address,
    hours = excluded.hours,
    social_links = excluded.social_links;

  -- ---- categories -----------------------------------------------------------
  insert into public.categories (business_id, name, sort_order)
  values (biz_id, 'Starters', 1)
  on conflict do nothing;
  select id into cat_starters from public.categories where business_id = biz_id and name = 'Starters';

  insert into public.categories (business_id, name, sort_order)
  values (biz_id, 'Wood-Fired Mains', 2)
  on conflict do nothing;
  select id into cat_mains from public.categories where business_id = biz_id and name = 'Wood-Fired Mains';

  insert into public.categories (business_id, name, sort_order)
  values (biz_id, 'Sides', 3)
  on conflict do nothing;
  select id into cat_sides from public.categories where business_id = biz_id and name = 'Sides';

  insert into public.categories (business_id, name, sort_order)
  values (biz_id, 'Desserts', 4)
  on conflict do nothing;
  select id into cat_desserts from public.categories where business_id = biz_id and name = 'Desserts';

  insert into public.categories (business_id, name, sort_order)
  values (biz_id, 'Drinks', 5)
  on conflict do nothing;
  select id into cat_drinks from public.categories where business_id = biz_id and name = 'Drinks';

  -- ---- products: only insert if this business has none yet (idempotent) ----
  if not exists (select 1 from public.products where business_id = biz_id) then

    insert into public.products (business_id, category_id, name, description, price, sort_order) values
    (biz_id, cat_starters, 'Charred Octopus', 'Applewood-grilled octopus, smoked paprika, fingerling potato, salsa verde.', 19.00, 1),
    (biz_id, cat_starters, 'Ember Roasted Bone Marrow', 'Whole roasted marrow bones, parsley shallot gremolata, grilled sourdough.', 17.00, 2),
    (biz_id, cat_starters, 'Heirloom Tomato Tartare', 'Smoked tomato water, whipped burrata, basil oil, charred baguette.', 15.00, 3),
    (biz_id, cat_starters, 'Firepit Mussels', 'White wine, garlic, chili, grilled bread for dipping.', 18.00, 4),
    (biz_id, cat_starters, 'Wood-Fired Flatbread', 'Blistered flatbread, whipped ricotta, honey, chili oil, thyme.', 14.00, 5),

    (biz_id, cat_mains, 'Dry-Aged Ember Ribeye', '32-day dry-aged ribeye, live-fire finished, bone marrow butter.', 58.00, 1),
    (biz_id, cat_mains, 'Whole Roasted Branzino', 'Fennel, Meyer lemon, olive oil, char-grilled over oak.', 36.00, 2),
    (biz_id, cat_mains, 'Smoked Half Chicken', 'Brined 24 hours, hearth-roasted, herb jus, charred lemon.', 29.00, 3),
    (biz_id, cat_mains, 'Ash-Roasted Cauliflower Steak', 'Whole roasted cauliflower, romesco, toasted almond, herb oil.', 24.00, 4),
    (biz_id, cat_mains, 'Coal-Roasted Duck Breast', 'Cherry gastrique, charred radicchio, duck fat potatoes.', 34.00, 5),
    (biz_id, cat_mains, 'Fire-Grilled Lamb Chops', 'Rosemary and garlic marinade, mint chimichurri, grilled lemon.', 42.00, 6),

    (biz_id, cat_sides, 'Charred Broccolini', 'Chili flake, garlic, shaved parmesan, lemon.', 11.00, 1),
    (biz_id, cat_sides, 'Smoked Mac and Cheese', 'Three-cheese blend, smoked gouda, toasted breadcrumb.', 13.00, 2),
    (biz_id, cat_sides, 'Ember Roasted Potatoes', 'Fingerling potatoes, rosemary, sea salt, garlic aioli.', 10.00, 3),
    (biz_id, cat_sides, 'Grilled Corn', 'Chili lime butter, cotija cheese, cilantro.', 9.00, 4),

    (biz_id, cat_desserts, 'Campfire Smore Tart', 'Torched marshmallow, dark chocolate ganache, graham crust.', 12.00, 1),
    (biz_id, cat_desserts, 'Warm Skillet Cookie', 'Cast-iron chocolate chip cookie, vanilla bean ice cream.', 11.00, 2),
    (biz_id, cat_desserts, 'Smoked Chocolate Pot de Creme', 'Applewood-smoked dark chocolate custard, whipped cream, sea salt.', 10.00, 3),

    (biz_id, cat_drinks, 'Smoked Old Fashioned', 'Bourbon, applewood smoke, demerara, orange bitters.', 15.00, 1),
    (biz_id, cat_drinks, 'Ember House Red Blend', 'Glass of our house Rhône-style blend.', 13.00, 2),
    (biz_id, cat_drinks, 'Sparkling Elderflower', 'Non-alcoholic, elderflower, soda, mint, lime.', 7.00, 3);

  end if;
end $$;
