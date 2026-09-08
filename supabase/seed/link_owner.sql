-- Run this AFTER you've created your admin login user in
-- Supabase Dashboard > Authentication > Users > Add user.
--
-- Replace 'YOUR_EMAIL_HERE' with the exact email you used for that user,
-- then run this whole file in the SQL Editor.

insert into public.business_members (business_id, user_id, role)
select b.id, u.id, 'owner'
from public.businesses b
join auth.users u on u.email = 'YOUR_EMAIL_HERE'
where b.slug = 'maison-ember'
on conflict (business_id, user_id) do update set role = excluded.role;

-- Sanity check: this should return one row showing your membership.
select bm.role, b.name as business_name, u.email
from public.business_members bm
join public.businesses b on b.id = bm.business_id
join auth.users u on u.id = bm.user_id
where b.slug = 'maison-ember';
