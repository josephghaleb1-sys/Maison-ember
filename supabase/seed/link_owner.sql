-- Grants a Supabase Auth user the Owner role on a business.
--
-- Run this AFTER you've created the login user in
-- Supabase Dashboard -> Authentication -> Users -> Add user.
--
-- Membership is what the whole security model hangs on: RLS decides access by
-- asking "is this user a member of the business that owns this row?", so until
-- a row exists here the account can sign in but will see nothing and be
-- redirected back to the login screen.
--
-- Edit the two values below, then run the whole file in the SQL Editor.

do $$
declare
  -- ---- EDIT THESE TWO ------------------------------------------------------
  target_email text := 'YOUR_EMAIL_HERE';
  target_slug  text := 'bibliotheca';   -- 'maison-ember' for the second demo
  -- --------------------------------------------------------------------------
  target_user  uuid;
  target_biz   uuid;
begin
  select id into target_user from auth.users where email = target_email;
  if target_user is null then
    raise exception
      'No auth user with email %. Create it first under Authentication -> Users.', target_email;
  end if;

  select id into target_biz from public.businesses where slug = target_slug;
  if target_biz is null then
    raise exception
      'No business with slug %. Run the seed file for it first.', target_slug;
  end if;

  insert into public.business_members (business_id, user_id, role)
  values (target_biz, target_user, 'owner')
  on conflict (business_id, user_id) do update set role = excluded.role;

  raise notice 'Linked % as owner of %.', target_email, target_slug;
end $$;

-- Sanity check: should list your membership(s).
select bm.role, b.name as business_name, b.slug, u.email
from public.business_members bm
join public.businesses b on b.id = bm.business_id
join auth.users u on u.id = bm.user_id
order by b.name;
