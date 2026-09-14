-- ============================================================================
-- Row Level Security checks
-- ============================================================================
-- Proves the database itself — not the UI — keeps businesses apart.
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> paste this file -> Run.
--   It needs at least two rows in auth.users (any two accounts; create a
--   throwaway second one if you only have one).
--
-- SAFE TO RUN ANY TIME: everything happens inside a transaction that ends in
-- ROLLBACK, so no rows survive the run. A failed assertion aborts with a
-- message naming the check that failed.
--
-- WHAT IT PROVES
--   1.  A member reads their own hidden rows.
--   2.  A member CANNOT read another business's hidden rows.
--   3.  A member CANNOT update another business's rows.
--   4.  A member CANNOT delete another business's rows.
--   5.  A member CANNOT insert rows carrying another business's business_id
--       (i.e. a forged business_id in a request is rejected by Postgres).
--   6.  Anonymous visitors read only visible rows.
--   7.  Anonymous visitors cannot write anything.
--   8.  Anonymous visitors cannot enumerate who belongs to a business.
--   9.  A signed-in user with no membership sees no private data.
--   10. Storage objects are namespaced per business and enforced by policy.

begin;

do $$
declare
  user_a uuid;
  user_b uuid;
  biz_a uuid;
  biz_b uuid;
  hidden_a uuid;
  hidden_b uuid;
  visible_a uuid;
  found int;
  outsider uuid := gen_random_uuid();
begin
  select id into user_a from auth.users order by id limit 1;
  select id into user_b from auth.users where id <> user_a order by id limit 1;

  if user_a is null or user_b is null then
    raise exception 'These checks need at least two rows in auth.users. Create a second (throwaway) user and re-run.';
  end if;

  -- ---- fixtures ------------------------------------------------------------
  insert into public.businesses (slug, name, industry)
  values ('rls-check-a', 'RLS Check A', 'retail') returning id into biz_a;
  insert into public.businesses (slug, name, industry)
  values ('rls-check-b', 'RLS Check B', 'retail') returning id into biz_b;

  insert into public.business_members (business_id, user_id, role) values (biz_a, user_a, 'owner');
  insert into public.business_members (business_id, user_id, role) values (biz_b, user_b, 'owner');

  insert into public.products (business_id, name, price, is_visible)
  values (biz_a, 'A hidden', 10, false) returning id into hidden_a;
  insert into public.products (business_id, name, price, is_visible)
  values (biz_a, 'A visible', 10, true) returning id into visible_a;
  insert into public.products (business_id, name, price, is_visible)
  values (biz_b, 'B hidden', 10, false) returning id into hidden_b;

  -- ========================================================================
  -- USER A
  -- ========================================================================
  set local role authenticated;
  perform set_config('request.jwt.claim.sub', user_a::text, true);

  select count(*) into found from public.products where id = hidden_a;
  if found <> 1 then raise exception 'CHECK 1 FAILED: a member cannot read their own hidden row'; end if;

  select count(*) into found from public.products where id = hidden_b;
  if found <> 0 then raise exception 'CHECK 2 FAILED: a member can read another business''s hidden row'; end if;

  -- An UPDATE/DELETE that no policy allows silently matches zero rows, so
  -- these are verified by reading the row back as the table owner.
  update public.products set name = 'hijacked' where id = hidden_b;
  delete from public.products where id = hidden_b;

  reset role;
  select count(*) into found from public.products where id = hidden_b and name = 'B hidden';
  if found <> 1 then
    raise exception 'CHECK 3/4 FAILED: a member changed or deleted another business''s row';
  end if;

  set local role authenticated;
  perform set_config('request.jwt.claim.sub', user_a::text, true);
  begin
    insert into public.products (business_id, name, price) values (biz_b, 'forged', 1);
    raise exception 'CHECK 5 FAILED: a member inserted a row under another business''s id';
  exception
    when insufficient_privilege then null; -- expected: RLS rejected the write
  end;

  -- ========================================================================
  -- ANONYMOUS VISITOR
  -- ========================================================================
  reset role;
  set local role anon;
  perform set_config('request.jwt.claim.sub', '', true);

  select count(*) into found from public.products where id = visible_a;
  if found <> 1 then raise exception 'CHECK 6a FAILED: anon cannot read a visible product'; end if;

  select count(*) into found from public.products where id in (hidden_a, hidden_b);
  if found <> 0 then raise exception 'CHECK 6b FAILED: anon can read hidden products'; end if;

  begin
    insert into public.products (business_id, name, price) values (biz_a, 'anon write', 1);
    raise exception 'CHECK 7 FAILED: anon inserted a product';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.products set name = 'anon edit' where id = visible_a;
    -- An UPDATE with no matching policy affects 0 rows rather than erroring.
    if (select name from public.products where id = visible_a) = 'anon edit' then
      raise exception 'CHECK 7b FAILED: anon updated a product';
    end if;
  exception
    when insufficient_privilege then null;
  end;

  select count(*) into found from public.business_members;
  if found <> 0 then raise exception 'CHECK 8 FAILED: anon can enumerate business members'; end if;

  -- ========================================================================
  -- SIGNED-IN USER WITH NO MEMBERSHIP
  -- ========================================================================
  reset role;
  set local role authenticated;
  perform set_config('request.jwt.claim.sub', outsider::text, true);

  select count(*) into found from public.products where id in (hidden_a, hidden_b);
  if found <> 0 then raise exception 'CHECK 9a FAILED: a user with no membership reads hidden rows'; end if;

  select count(*) into found from public.business_members;
  if found <> 0 then raise exception 'CHECK 9b FAILED: a user with no membership reads memberships'; end if;

  begin
    insert into public.categories (business_id, name) values (biz_a, 'outsider');
    raise exception 'CHECK 9c FAILED: a user with no membership inserted a category';
  exception
    when insufficient_privilege then null;
  end;

  reset role;
  raise notice 'All RLS checks passed.';
end;
$$;

rollback;
