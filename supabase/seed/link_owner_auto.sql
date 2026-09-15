-- ===========================================================================
-- GIVE YOURSELF ACCESS TO THE DASHBOARD  (no editing required)
-- ===========================================================================
-- Run this AFTER creating your login in
--   Supabase -> Authentication -> Users -> Add user  (tick "Auto Confirm User")
--
-- A user who can sign in but has no membership row sees an empty dashboard —
-- membership is what every security policy checks. This grants it.
--
-- It figures out which user to link on its own, so there is nothing to edit:
-- on a fresh project there is exactly one account, and that is you. If there
-- is more than one it stops and lists them, and you use link_owner.sql
-- instead, which names the email explicitly.
--
-- Safe to re-run: re-granting ownership to the same person changes nothing.
-- ===========================================================================

do $$
declare
  target_user  uuid;
  target_email text;
  target_biz   uuid;
  user_count   int;
  everyone     text;
begin
  select count(*) into user_count from auth.users;

  if user_count = 0 then
    raise exception
      'No login exists yet. Create one first: Authentication -> Users -> Add user, and tick "Auto Confirm User".';
  end if;

  if user_count > 1 then
    select string_agg(email, ', ' order by email) into everyone from auth.users;
    raise exception
      'This project has % logins (%), so I cannot tell which one is yours. Use link_owner.sql and type your email into it.',
      user_count, everyone;
  end if;

  select id, email into target_user, target_email from auth.users;

  select id into target_biz from public.businesses where slug = 'veloura-lab';
  if target_biz is null then
    raise exception
      'Veloura Lab is not in the database. Run setup_all.sql first.';
  end if;

  insert into public.business_members (business_id, user_id, role)
  values (target_biz, target_user, 'owner')
  on conflict (business_id, user_id) do update set role = excluded.role;

  raise notice 'Done. % now owns Veloura Lab.', target_email;
end;
$$;

-- You should see exactly one row below, with your email and the role "owner".
-- That means you can now sign in at /admin and see everything.
select
  u.email as "Your login",
  bm.role as "Role",
  b.name  as "Business"
from public.business_members bm
join public.businesses b on b.id = bm.business_id
join auth.users u on u.id = bm.user_id;
