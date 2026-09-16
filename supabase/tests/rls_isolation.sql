-- ============================================================================
-- RLS ISOLATION TEST
-- ============================================================================
--
-- Proves the security claim this platform rests on: a signed-in user of
-- Business A cannot read or write Business B's data, and an anonymous visitor
-- sees only what is meant to be public.
--
-- This runs entirely in the database and rolls itself back, so it is safe
-- against a real project. Run it in the Supabase SQL Editor after applying
-- the migrations and both seed files.
--
-- It works by impersonating roles the way PostgREST does: `set local role` to
-- anon/authenticated and `set local request.jwt.claims` to a specific user id,
-- which is exactly what auth.uid() reads inside the policies.

begin;

do $$
declare
  biz_a uuid;   -- bookshop
  biz_b uuid;   -- maison-ember
  user_a uuid;
  visible_count int;
  hidden_probe int;
  update_count int;
begin
  select id into biz_a from public.businesses where slug = 'bookshop';
  select id into biz_b from public.businesses where slug = 'maison-ember';

  if biz_a is null or biz_b is null then
    raise exception 'Seed both businesses first (bookshop.sql and maison_ember.sql).';
  end if;

  select user_id into user_a
  from public.business_members where business_id = biz_a limit 1;

  if user_a is null then
    raise exception 'No member on the bookshop yet — run link_owner.sql first.';
  end if;

  -- Give Business B a hidden product to probe for.
  insert into public.products (business_id, name, description, price, is_visible)
  values (biz_b, 'ISOLATION PROBE', 'Should never be readable by another business.', 1, false);

  -- ==========================================================================
  -- 1. A member of Business A cannot READ Business B's hidden rows
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
  -- 2. A member of Business A cannot WRITE Business B's rows
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
  -- 3. A member of Business A cannot INSERT into Business B
  -- ==========================================================================
  begin
    insert into public.products (business_id, name, price) values (biz_b, 'SMUGGLED', 1);
    raise exception 'FAIL: business A inserted a row into business B.';
  exception
    when insufficient_privilege then
      raise notice 'PASS: business A cannot insert into business B.';
  end;

  -- ==========================================================================
  -- 4. Anonymous visitors see visible rows only — never hidden ones
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
  -- 5. Anonymous visitors cannot write at all
  -- ==========================================================================
  begin
    insert into public.products (business_id, name, price) values (biz_a, 'ANON WRITE', 1);
    raise exception 'FAIL: anon inserted a product.';
  exception
    when insufficient_privilege then
      raise notice 'PASS: anon cannot insert products.';
  end;

  -- ==========================================================================
  -- 6. Private membership data stays private
  -- ==========================================================================
  select count(*) into hidden_probe from public.business_members;
  if hidden_probe <> 0 then
    raise exception 'FAIL: anon read % membership row(s).', hidden_probe;
  end if;
  raise notice 'PASS: anon cannot read business_members.';

  reset role;
  raise notice '--- All RLS isolation checks passed. ---';
end $$;

-- Nothing above is kept: the probe row and any accidental writes are discarded.
rollback;
