-- Light/dark site palette, owner order notifications, and Whish payment.
--
--   * color_mode lets a business pick a light (ivory/blush) or dark surface
--     palette. Product photography decides this more than taste does: pastel
--     packshots sit badly on near-black, and vice versa.
--   * order_email is where new-order notifications go — often not the same
--     address as the public contact email.
--   * Whish Money is how a lot of Lebanese customers pay when they don't want
--     cash on the door. The shop's Whish number is a setting; the customer
--     sends the total and types the transfer reference into the order.
--
-- Safe to re-run.

alter table public.website_settings
  add column if not exists color_mode text not null default 'dark',
  add column if not exists order_email text not null default '',
  add column if not exists whish_enabled boolean not null default false,
  add column if not exists whish_number text not null default '',
  add column if not exists whish_note text not null default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'website_settings_color_mode_check') then
    alter table public.website_settings
      add constraint website_settings_color_mode_check check (color_mode in ('dark', 'light'));
  end if;
end;
$$;

-- ============================================================================
-- orders: payment method + reference
-- ============================================================================

alter table public.orders
  add column if not exists payment_reference text not null default '';

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check check (payment_method in ('cod', 'whish'));

-- ============================================================================
-- place_order: accepts a payment method, returns what the notification needs
-- ============================================================================
-- Pricing rules are unchanged: every amount is still read from the database
-- here, never from the request. The two new arguments only record *how* the
-- customer intends to pay, and a Whish transfer reference if they gave one.

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

  -- Whish can only be chosen if the shop actually accepts it.
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

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
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

    insert into public.order_items (
      order_id, business_id, product_id, name, unit_price, quantity, line_total
    ) values (
      v_order.id, v_business.id, v_product.id, v_product.name,
      v_product.price, v_quantity, v_product.price * v_quantity
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

  -- The extra fields here are what the server action needs to email the owner
  -- straight after checkout. They describe the order that was just created, so
  -- returning them to the caller who created it reveals nothing new.
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

-- Drop the previous 11-argument signature so only one version exists.
drop function if exists public.place_order(text, text, text, text, jsonb, uuid, text, text, text, text, text);

-- The customer's receipt should show how they are paying.
create or replace function public.get_order_by_token(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_items jsonb;
begin
  select * into v_order from public.orders where public_token = p_token;
  if not found then
    return null;
  end if;

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
    'order_number', v_order.order_number,
    'status', v_order.status,
    'customer_name', v_order.customer_name,
    'customer_phone', v_order.customer_phone,
    'delivery_zone_name', v_order.delivery_zone_name,
    'city', v_order.city,
    'address_line', v_order.address_line,
    'address_details', v_order.address_details,
    'notes', v_order.notes,
    'payment_method', v_order.payment_method,
    'payment_reference', v_order.payment_reference,
    'subtotal', v_order.subtotal,
    'delivery_fee', v_order.delivery_fee,
    'total', v_order.total,
    'currency', v_order.currency,
    'created_at', v_order.created_at,
    'items', v_items
  );
end;
$$;

revoke all on function public.get_order_by_token(uuid) from public;
grant execute on function public.get_order_by_token(uuid) to anon, authenticated;
