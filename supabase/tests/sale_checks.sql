-- ============================================================================
-- Sale pricing checks
-- ============================================================================
-- A sale changes what customers are charged, so the rules are worth pinning
-- down:
--   1. effective_price returns the sale price while a sale is running.
--   2. It returns the full price when there is no sale.
--   3. It returns the full price once the sale's end date has passed — an
--      expired sale charges full price even though the column is still set.
--   4. An order placed during a sale is charged the sale price, on both the
--      order total and the individual line.
--   5. An order placed after the sale ended is charged the full price, even if
--      the customer's cart was loaded while the sale was on.
--   6. A sale price at or above the normal price is rejected by the database.
--
-- Safe to run any time: everything is inside a transaction that ends in
-- ROLLBACK.

begin;

do $$
declare
  biz_id uuid;
  zone_id uuid;
  product_id uuid;
  v_full numeric := 40;
  v_sale numeric := 25;
  result jsonb;
  line numeric;
begin
  select id into biz_id from public.businesses where slug = 'veloura-lab';
  if biz_id is null then
    raise exception 'Run supabase/seed/veloura_lab.sql first.';
  end if;
  select id into zone_id from public.delivery_zones where business_id = biz_id and is_active limit 1;

  insert into public.products (business_id, name, price, is_visible)
  values (biz_id, 'Sale check item', v_full, true)
  returning id into product_id;

  -- ---- 2: no sale -> full price -------------------------------------------
  if public.effective_price(v_full, null, null) <> v_full then
    raise exception 'CHECK 2 FAILED: no sale should cost the full price';
  end if;

  -- ---- 1: running sale -> sale price --------------------------------------
  update public.products
     set sale_price = v_sale, sale_ends_at = now() + interval '7 days'
   where id = product_id;

  if public.effective_price(v_full, v_sale, now() + interval '7 days') <> v_sale then
    raise exception 'CHECK 1 FAILED: a running sale should use the sale price';
  end if;

  -- ---- 4: an order during the sale is charged the sale price --------------
  set local role anon;
  perform set_config('request.jwt.claim.sub', '', true);

  result := public.place_order(
    'veloura-lab', 'Sale Check', '70 111 001', 'Test address',
    jsonb_build_array(jsonb_build_object('product_id', product_id, 'quantity', 2)),
    zone_id
  );

  if (result ->> 'subtotal')::numeric <> v_sale * 2 then
    raise exception 'CHECK 4 FAILED: order subtotal % is not the sale price x 2 (%)',
      result ->> 'subtotal', v_sale * 2;
  end if;

  select (item ->> 'unit_price')::numeric into line
    from jsonb_array_elements(result -> 'items') as item limit 1;
  if line <> v_sale then
    raise exception 'CHECK 4b FAILED: the order line records % instead of the sale price %',
      line, v_sale;
  end if;

  -- ---- 3 + 5: an expired sale reverts to the full price --------------------
  reset role;
  update public.products
     set sale_ends_at = now() - interval '1 minute'
   where id = product_id;

  if public.effective_price(v_full, v_sale, now() - interval '1 minute') <> v_full then
    raise exception 'CHECK 3 FAILED: an expired sale should cost the full price';
  end if;

  set local role anon;
  result := public.place_order(
    'veloura-lab', 'Sale Check', '70 111 002', 'Test address',
    jsonb_build_array(jsonb_build_object('product_id', product_id, 'quantity', 1)),
    zone_id
  );
  if (result ->> 'subtotal')::numeric <> v_full then
    raise exception 'CHECK 5 FAILED: an order after the sale ended was charged % instead of %',
      result ->> 'subtotal', v_full;
  end if;

  -- ---- 6: a "sale" that isn't a discount is refused ------------------------
  reset role;
  begin
    update public.products set sale_price = v_full where id = product_id;
    raise exception 'CHECK 6 FAILED: a sale price equal to the normal price was accepted';
  exception
    when check_violation then null; -- expected
  end;

  begin
    update public.products set sale_price = v_full + 5 where id = product_id;
    raise exception 'CHECK 6b FAILED: a sale price above the normal price was accepted';
  exception
    when check_violation then null;
  end;

  reset role;
  raise notice 'All sale checks passed.';
end;
$$;

rollback;
