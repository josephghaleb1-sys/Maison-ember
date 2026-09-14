-- Grant a Supabase Auth user ownership of a business.
--
-- Run this AFTER creating the login user in
--   Supabase Dashboard -> Authentication -> Users -> Add user.
--
-- Edit the two values below, then run the whole file in the SQL Editor.
--   • owner_email    the exact email of that auth user
--   • business_slug  the business they should own (businesses.slug)
--
-- Membership is what the dashboard resolves on sign-in, and what every RLS
-- policy checks — a user with no membership can sign in but sees nothing.

do $$
declare
  owner_email   text := 'YOUR_EMAIL_HERE';
  business_slug text := 'veloura-lab';
  target_user   uuid;
  target_biz    uuid;
begin
  select id into target_user from auth.users where email = owner_email;
  if target_user is null then
    raise exception 'No auth user with email %. Create it in Authentication -> Users first.', owner_email;
  end if;

  select id into target_biz from public.businesses where slug = business_slug;
  if target_biz is null then
    raise exception 'No business with slug %. Run its seed file first.', business_slug;
  end if;

  insert into public.business_members (business_id, user_id, role)
  values (target_biz, target_user, 'owner')
  on conflict (business_id, user_id) do update set role = excluded.role;
end;
$$;

-- Sanity check: one row per membership you just granted.
select u.email, bm.role, b.name as business, b.slug
from public.business_members bm
join public.businesses b on b.id = bm.business_id
join auth.users u on u.id = bm.user_id
order by b.name;
