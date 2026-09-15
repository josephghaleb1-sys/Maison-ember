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
