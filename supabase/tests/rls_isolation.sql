-- ============================================================================
-- RLS ISOLATION TEST
-- ============================================================================
--
-- Proves the security claim this application rests on: a signed-in user of one
-- business cannot read or write another business's data, and an anonymous
-- visitor sees only what is meant to be public.
--
-- Self-contained: it creates its own two businesses, its own user and its own
-- products, so it runs against a database that has had nothing but the
-- migrations applied. Everything happens inside a transaction that rolls back,
-- so it is safe to run against a real project — it leaves no rows behind.
--
-- It works by impersonating roles the way PostgREST does: `set local role` to
-- anon/authenticated and `set local request.jwt.claims` to a specific user id,
-- which is exactly what auth.uid() reads inside the policies.

begin;

do $$
declare
  biz_a uuid;
  biz_b uuid;
  user_a uuid;
  hidden_probe int;
  visible_count int;
  update_count int;
begin
  -- ==========================================================================
  -- Fixtures
  -- ==========================================================================
  insert into public.businesses (slug, name, business_type, currency)
  values ('rls-fixture-a', 'RLS Fixture A', 'bookshop', 'USD')
  returning id into biz_a;

  insert into public.businesses (slug, name, business_type, currency)
  values ('rls-fixture-b', 'RLS Fixture B', 'retail', 'USD')
  returning id into biz_b;

  insert into auth.users (email) values ('rls-fixture-owner@example.invalid')
  returning id into user_a;

  -- The user belongs to A only. That single row is what every policy checks.
  insert into public.business_members (business_id, user_id, role)
  values (biz_a, user_a, 'owner');

  insert into public.products (business_id, name, price, is_visible) values
    (biz_a, 'A — public title', 10, true),
    (biz_b, 'B — public title', 10, true),
    (biz_b, 'B — HIDDEN DRAFT', 10, false);

  -- ==========================================================================
  -- 1. A member of business A cannot READ business B's hidden rows
  -- ==========================================================================
  set local role authenticated;
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', user_a, 'role', 'authenticated')::text,
    true
  );

  select count(*) into hidden_probe
  from public.products
  where business_id = biz_b and is_visible = false;

  if hidden_probe <> 0 then
    raise exception 'FAIL: business A read % hidden row(s) belonging to business B.', hidden_probe;
  end if;
  raise notice 'PASS: business A cannot read business B''s hidden rows.';

  -- ==========================================================================
  -- 2. A member of business A cannot WRITE business B's rows
  -- ==========================================================================
  with attempted as (
    update public.products set name = 'HIJACKED' where business_id = biz_b returning 1
  )
  select count(*) into update_count from attempted;

  if update_count <> 0 then
    raise exception 'FAIL: business A updated % row(s) belonging to business B.', update_count;
  end if;
  raise notice 'PASS: business A cannot write business B''s rows.';

  -- ==========================================================================
  -- 3. A member of business A cannot INSERT into business B
  -- ==========================================================================
  begin
    insert into public.products (business_id, name, price) values (biz_b, 'SMUGGLED', 1);
    raise exception 'FAIL: business A inserted a row into business B.';
  exception
    when insufficient_privilege then
      raise notice 'PASS: business A cannot insert into business B.';
  end;

  -- ==========================================================================
  -- 4. A member of business A CAN work with its own rows
  --    (a policy that blocks everything would pass every test above)
  -- ==========================================================================
  select count(*) into visible_count from public.products where business_id = biz_a;
  if visible_count = 0 then
    raise exception 'FAIL: business A cannot read its own products.';
  end if;
  raise notice 'PASS: business A can read its own rows (% found).', visible_count;

  -- ==========================================================================
  -- 5. Anonymous visitors see visible rows only — never hidden ones
  -- ==========================================================================
  set local role anon;
  perform set_config('request.jwt.claims', null, true);

  select count(*) into hidden_probe from public.products where is_visible = false;
  if hidden_probe <> 0 then
    raise exception 'FAIL: anon read % hidden product(s).', hidden_probe;
  end if;

  select count(*) into visible_count from public.products where is_visible = true;
  if visible_count = 0 then
    raise exception 'FAIL: anon cannot read any visible products — the public site would be empty.';
  end if;
  raise notice 'PASS: anon sees % visible product(s) and 0 hidden ones.', visible_count;

  -- ==========================================================================
  -- 6. Anonymous visitors cannot write at all
  -- ==========================================================================
  begin
    insert into public.products (business_id, name, price) values (biz_a, 'ANON WRITE', 1);
    raise exception 'FAIL: anon inserted a product.';
  exception
    when insufficient_privilege then
      raise notice 'PASS: anon cannot insert products.';
  end;

  -- ==========================================================================
  -- 7. Private membership data stays private
  -- ==========================================================================
  select count(*) into hidden_probe from public.business_members;
  if hidden_probe <> 0 then
    raise exception 'FAIL: anon read % membership row(s).', hidden_probe;
  end if;
  raise notice 'PASS: anon cannot read business_members.';

  reset role;
  raise notice '--- All RLS isolation checks passed. ---';
end $$;

-- Nothing above is kept: every fixture row is discarded with the transaction.
rollback;
