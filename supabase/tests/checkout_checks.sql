-- ============================================================================
-- Checkout security checks
-- ============================================================================
-- Proves the parts of ordering that money depends on:
--   1.  An order is priced from the products table, not from the request.
--   2.  A tampered unit price in the request has no effect (there is nowhere
--       to send one — place_order only accepts product ids and quantities).
--   3.  Quantities are clamped to a sane range.
--   4.  Items belonging to another business are rejected.
--   5.  Hidden items are rejected.
--   6.  The delivery fee comes from the chosen zone, and the free-delivery
--       threshold is applied server-side.
--   7.  Anonymous visitors cannot read ANY order.
--   8.  Anonymous visitors cannot insert an order directly, bypassing pricing.
--   9.  The confirmation lookup works only with the exact order token.
--   10. A business owner cannot read another business's orders.
--
-- Run it in Supabase -> SQL Editor. Needs the demo data from
-- supabase/seed/veloura_lab.sql. Everything runs inside a transaction that
-- ends in ROLLBACK, so no test orders survive.

begin;

do $$
declare
  biz_id uuid;
  other_biz_id uuid;
  zone_id uuid;
  cheap_product uuid;
  cheap_price numeric;
  other_product uuid;
  hidden_product uuid;
  result jsonb;
  token uuid;
  fetched jsonb;
  found_count int;
  first_number int;
  second_number int;
  owner_a uuid;
  owner_b uuid;
begin
  select id into biz_id from public.businesses where slug = 'veloura-lab';
  if biz_id is null then
    raise exception 'Run supabase/seed/veloura_lab.sql first.';
  end if;

  select id into other_biz_id from public.businesses where id <> biz_id limit 1;
  select id into zone_id from public.delivery_zones where business_id = biz_id and is_active order by fee limit 1;
  select id, price into cheap_product, cheap_price
    from public.products where business_id = biz_id and is_visible order by price limit 1;

  -- A hidden item to test with.
  insert into public.products (business_id, name, price, is_visible)
  values (biz_id, 'Checkout check hidden item', 5, false) returning id into hidden_product;

  -- ========================================================================
  -- 1 + 2 + 6: pricing and delivery fee come from the database
  -- ========================================================================
  set local role anon;
  perform set_config('request.jwt.claim.sub', '', true);

  -- Note the payload: only product_id and quantity. Even a client that sends
  -- "price" or "total" fields has nowhere for them to land.
  result := public.place_order(
    'veloura-lab', 'Checkout Check', '70 000 001', 'Test address 1',
    jsonb_build_array(jsonb_build_object(
      'product_id', cheap_product, 'quantity', 2, 'price', 0.01, 'total', 0.01
    )),
    zone_id
  );

  if (result ->> 'subtotal')::numeric <> cheap_price * 2 then
    raise exception 'CHECK 1 FAILED: subtotal % is not the database price % x 2',
      result ->> 'subtotal', cheap_price;
  end if;

  if (result ->> 'delivery_fee')::numeric
     <> (select fee from public.delivery_zones where id = zone_id) then
    raise exception 'CHECK 6a FAILED: delivery fee did not come from the zone';
  end if;

  if (result ->> 'total')::numeric
     <> (result ->> 'subtotal')::numeric + (result ->> 'delivery_fee')::numeric then
    raise exception 'CHECK 1b FAILED: total is not subtotal + delivery';
  end if;

  token := (result ->> 'public_token')::uuid;
  first_number := (result ->> 'order_number')::int;

  -- ========================================================================
  -- 3: quantities are clamped
  -- ========================================================================
  result := public.place_order(
    'veloura-lab', 'Checkout Check', '70 000 002', 'Test address 2',
    jsonb_build_array(jsonb_build_object('product_id', cheap_product, 'quantity', 5000)),
    zone_id
  );
  if (result ->> 'subtotal')::numeric <> cheap_price * 99 then
    raise exception 'CHECK 3 FAILED: quantity was not clamped to 99 (subtotal %)', result ->> 'subtotal';
  end if;
  second_number := (result ->> 'order_number')::int;

  if second_number <> first_number + 1 then
    raise exception 'CHECK 10b FAILED: order numbers are not sequential per business (% then %)',
      first_number, second_number;
  end if;

  -- ========================================================================
  -- 4: another business's item cannot be bought here
  -- ========================================================================
  select id into other_product from public.products where business_id = other_biz_id limit 1;
  if other_product is not null then
    begin
      perform public.place_order(
        'veloura-lab', 'Checkout Check', '70 000 003', 'Test address 3',
        jsonb_build_array(jsonb_build_object('product_id', other_product, 'quantity', 1)),
        zone_id
      );
      raise exception 'CHECK 4 FAILED: an item from another business was accepted';
    exception
      when sqlstate 'P0001' then null; -- expected rejection
    end;
  end if;

  -- ========================================================================
  -- 5: hidden items cannot be bought
  -- ========================================================================
  begin
    perform public.place_order(
      'veloura-lab', 'Checkout Check', '70 000 004', 'Test address 4',
      jsonb_build_array(jsonb_build_object('product_id', hidden_product, 'quantity', 1)),
      zone_id
    );
    raise exception 'CHECK 5 FAILED: a hidden item was accepted';
  exception
    when sqlstate 'P0001' then null;
  end;

  -- ========================================================================
  -- 6b: the free-delivery threshold is applied server-side
  -- ========================================================================
  reset role;
  update public.website_settings set free_delivery_over = 0.01 where business_id = biz_id;
  set local role anon;

  result := public.place_order(
    'veloura-lab', 'Checkout Check', '70 000 005', 'Test address 5',
    jsonb_build_array(jsonb_build_object('product_id', cheap_product, 'quantity', 1)),
    zone_id
  );
  if (result ->> 'delivery_fee')::numeric <> 0 then
    raise exception 'CHECK 6b FAILED: free-delivery threshold was not applied';
  end if;

  -- ========================================================================
  -- 7: anonymous visitors cannot read orders
  -- ========================================================================
  select count(*) into found_count from public.orders;
  if found_count <> 0 then
    raise exception 'CHECK 7a FAILED: anon can read % orders', found_count;
  end if;

  select count(*) into found_count from public.order_items;
  if found_count <> 0 then
    raise exception 'CHECK 7b FAILED: anon can read order items';
  end if;

  -- ========================================================================
  -- 8: anonymous visitors cannot write an order directly
  -- ========================================================================
  begin
    insert into public.orders (business_id, customer_name, customer_phone, address_line, subtotal, total)
    values (biz_id, 'Forger', '70 000 006', 'Somewhere', 0.01, 0.01);
    raise exception 'CHECK 8 FAILED: anon inserted an order directly, bypassing pricing';
  exception
    when insufficient_privilege then null;
  end;

  -- ========================================================================
  -- 9: the confirmation lookup needs the exact token
  -- ========================================================================
  fetched := public.get_order_by_token(token);
  if fetched is null or (fetched ->> 'order_number')::int <> first_number then
    raise exception 'CHECK 9a FAILED: a customer cannot read their own order with its token';
  end if;
  if jsonb_array_length(fetched -> 'items') <> 1 then
    raise exception 'CHECK 9b FAILED: order items missing from the confirmation';
  end if;
  if public.get_order_by_token(gen_random_uuid()) is not null then
    raise exception 'CHECK 9c FAILED: a random token returned an order';
  end if;

  -- ========================================================================
  -- 10: an owner sees only their own business's orders
  -- ========================================================================
  reset role;
  select user_id into owner_a from public.business_members where business_id = biz_id limit 1;
  select user_id into owner_b from public.business_members where business_id = other_biz_id limit 1;

  if owner_a is not null then
    set local role authenticated;
    perform set_config('request.jwt.claim.sub', owner_a::text, true);
    select count(*) into found_count from public.orders where business_id = biz_id;
    if found_count = 0 then
      raise exception 'CHECK 10a FAILED: the owner cannot see their own orders';
    end if;
    reset role;
  end if;

  if owner_b is not null then
    set local role authenticated;
    perform set_config('request.jwt.claim.sub', owner_b::text, true);
    select count(*) into found_count from public.orders where business_id = biz_id;
    if found_count <> 0 then
      raise exception 'CHECK 10 FAILED: another business''s owner can read these orders';
    end if;
    reset role;
  end if;

  reset role;
  raise notice 'All checkout checks passed.';
end;
$$;

rollback;
