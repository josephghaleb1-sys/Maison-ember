-- Checkout: cash-on-delivery orders, the way small Lebanese shops actually sell.
--
-- Design notes
--   * Prices are NEVER taken from the browser. Orders are placed through
--     public.place_order(), a SECURITY DEFINER function that re-reads every
--     product price and the delivery fee from the database, so a tampered
--     request cannot buy a $45 brush set for $1. There is deliberately no
--     INSERT policy on orders/order_items for visitors — that function is the
--     only way in.
--   * A visitor can never SELECT orders. The confirmation page reads a single
--     order through public.get_order_by_token(), which matches on an
--     unguessable token and returns only that order.
--   * Delivery is priced per zone (Beirut, Mount Lebanon, Bekaa…), which is
--     how delivery is quoted locally, with an optional free-delivery
--     threshold.
--
-- Safe to re-run.

-- ============================================================================
-- delivery zones
-- ============================================================================

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  fee numeric(10, 2) not null default 0 check (fee >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create index if not exists delivery_zones_business_id_idx on public.delivery_zones (business_id);

drop trigger if exists set_updated_at on public.delivery_zones;
create trigger set_updated_at before update on public.delivery_zones
  for each row execute function public.set_updated_at();

-- ============================================================================
-- orders
-- ============================================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  -- Per-business, human-friendly counter (see assign_order_number below).
  order_number integer not null,
  -- Unguessable key for the customer's confirmation link.
  public_token uuid not null unique default gen_random_uuid(),

  customer_name text not null check (length(btrim(customer_name)) between 2 and 120),
  customer_phone text not null check (length(btrim(customer_phone)) between 6 and 40),
  customer_phone_alt text not null default '',
  customer_email text not null default '',

  delivery_zone_id uuid references public.delivery_zones (id) on delete set null,
  -- Snapshot: the zone may be renamed or removed later; the order must not change.
  delivery_zone_name text not null default '',
  city text not null default '',
  address_line text not null check (length(btrim(address_line)) between 3 and 300),
  address_details text not null default '',
  notes text not null default '',

  payment_method text not null default 'cod' check (payment_method in ('cod')),
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  admin_note text not null default '',

  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, order_number)
);

create index if not exists orders_business_created_idx
  on public.orders (business_id, created_at desc);
create index if not exists orders_business_status_idx
  on public.orders (business_id, status);

drop trigger if exists set_updated_at on public.orders;
create trigger set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  -- Denormalised so RLS on this table doesn't have to join through orders.
  business_id uuid not null references public.businesses (id) on delete cascade,
  -- Kept for reporting; deleting a product must not delete order history.
  product_id uuid references public.products (id) on delete set null,
  -- Snapshot of what was actually bought, at the price that was charged.
  name text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 99),
  line_total numeric(10, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_business_id_idx on public.order_items (business_id);

-- ============================================================================
-- checkout settings
-- ============================================================================

alter table public.website_settings
  add column if not exists checkout_enabled boolean not null default true,
  add column if not exists free_delivery_over numeric(10, 2),
  add column if not exists min_order_total numeric(10, 2) not null default 0,
  add column if not exists order_notice text not null default '';

-- ============================================================================
-- per-business order numbers
-- ============================================================================

create or replace function public.assign_order_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.order_number is null or new.order_number = 0 then
    -- Serialise numbering per business so two simultaneous orders can't take
    -- the same number; the lock is released when the transaction ends.
    perform pg_advisory_xact_lock(hashtext(new.business_id::text));
    select coalesce(max(order_number), 1000) + 1
      into new.order_number
      from public.orders
     where business_id = new.business_id;
  end if;
  return new;
end;
$$;

drop trigger if exists assign_order_number on public.orders;
create trigger assign_order_number before insert on public.orders
  for each row execute function public.assign_order_number();

-- ============================================================================
-- place_order: the only way an order can be created
-- ============================================================================
-- items: [{"product_id": "...", "quantity": 2}, ...]
-- Returns: {order_number, public_token, subtotal, delivery_fee, total, currency}
--
-- Everything that decides money — unit prices, the delivery fee, the free
-- delivery threshold, the minimum order — is read from the database here.
-- The caller's only influence is which products and how many.

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
  p_customer_email text default ''
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

  -- Basic abuse guard: a phone number can't fire off dozens of orders a minute.
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

  -- Price every line from the products table, not from the request.
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

  -- NB: use the captured flag, not FOUND — the loop above has overwritten it.
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
    v_subtotal,
    v_fee,
    v_subtotal + v_fee,
    coalesce(v_settings.currency, 'USD')
  )
  returning * into v_order;

  -- Re-read each product for the line snapshot.
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

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'public_token', v_order.public_token,
    'subtotal', v_order.subtotal,
    'delivery_fee', v_order.delivery_fee,
    'total', v_order.total,
    'currency', v_order.currency
  );
end;
$$;

revoke all on function public.place_order(text, text, text, text, jsonb, uuid, text, text, text, text, text) from public;
grant execute on function public.place_order(text, text, text, text, jsonb, uuid, text, text, text, text, text)
  to anon, authenticated;

-- ============================================================================
-- get_order_by_token: the customer's own confirmation page
-- ============================================================================

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

  -- Deliberately narrow: no ids, no admin notes, no other customer's data.
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

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- ---- delivery_zones --------------------------------------------------------
-- Visitors need to see the areas and their fees to choose one at checkout.
drop policy if exists "delivery_zones_public_read_active" on public.delivery_zones;
create policy "delivery_zones_public_read_active"
  on public.delivery_zones for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "delivery_zones_member_read_all" on public.delivery_zones;
create policy "delivery_zones_member_read_all"
  on public.delivery_zones for select
  to authenticated
  using (public.is_business_member(business_id));

drop policy if exists "delivery_zones_member_write" on public.delivery_zones;
create policy "delivery_zones_member_write"
  on public.delivery_zones for all
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- ---- orders ----------------------------------------------------------------
-- NOTE the absence of an INSERT policy: visitors cannot write orders directly.
-- place_order() (SECURITY DEFINER) is the only path in, so prices and fees are
-- always the ones in the database.
drop policy if exists "orders_member_read" on public.orders;
create policy "orders_member_read"
  on public.orders for select
  to authenticated
  using (public.is_business_member(business_id));

drop policy if exists "orders_member_update" on public.orders;
create policy "orders_member_update"
  on public.orders for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

drop policy if exists "orders_member_delete" on public.orders;
create policy "orders_member_delete"
  on public.orders for delete
  to authenticated
  using (public.is_business_member(business_id));

-- ---- order_items -----------------------------------------------------------
drop policy if exists "order_items_member_read" on public.order_items;
create policy "order_items_member_read"
  on public.order_items for select
  to authenticated
  using (public.is_business_member(business_id));

drop policy if exists "order_items_member_delete" on public.order_items;
create policy "order_items_member_delete"
  on public.order_items for delete
  to authenticated
  using (public.is_business_member(business_id));
