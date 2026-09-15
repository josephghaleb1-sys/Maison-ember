-- ===========================================================================
-- VERIFY INSTALL
-- ===========================================================================
-- Paste into Supabase -> SQL Editor -> New query -> Run, any time you want to
-- know whether a project is fully set up. It only reads; it changes nothing.
--
-- Every row should say OK. Any row saying PROBLEM tells you what is missing
-- and what to do about it.
--
-- This exists because the SQL Editor does not always surface the warnings
-- raised during setup — on a phone it shows none at all — and the one failure
-- that matters (storage, which breaks photo uploads) is raised as a warning.
-- ===========================================================================

with checks as (

  select 1 as ord, 'required' as kind, 'Tables' as part,
         (select count(*) from pg_tables
           where schemaname = 'public'
             and tablename in ('businesses','profiles','business_members','categories',
                               'products','media','website_settings','business_domains',
                               'testimonials','delivery_zones','orders','order_items')) as got,
         12 as want,
         'Re-run setup_all.sql — some migrations did not apply.' as fix

  union all
  select 2, 'required', 'Row Level Security',
         (select count(*) from pg_tables
           where schemaname = 'public' and rowsecurity
             and tablename in ('businesses','profiles','business_members','categories',
                               'products','media','website_settings','business_domains',
                               'testimonials','delivery_zones','orders','order_items')),
         12,
         'Re-run setup_all.sql — customer data is NOT protected until this says OK.'

  union all
  select 3, 'required', 'Photo storage: bucket',
         (select count(*) from storage.buckets where id = 'media' and public),
         1,
         'Storage -> New bucket -> name "media", Public ON, file size limit 5MB.'

  union all
  select 4, 'required', 'Photo storage: policies',
         (select count(*) from pg_policies
           where schemaname = 'storage' and tablename = 'objects'
             and policyname like 'media_bucket_%'),
         4,
         'See README "If photo uploads fail" — add the four policies by hand.'

  union all
  select 5, 'required', 'Checkout functions',
         (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public'
             and p.proname in ('place_order','get_order_by_token','effective_price')),
         3,
         'Re-run setup_all.sql — migrations 0004 and 0006 did not apply.'

  union all
  select 6, 'required', 'Sale prices',
         (select count(*) from information_schema.columns
           where table_schema = 'public' and table_name = 'products'
             and column_name in ('sale_price','sale_ends_at')),
         2,
         'Re-run setup_all.sql — migration 0006 did not apply.'

  union all
  select 7, 'required', 'Payments and order email',
         (select count(*) from information_schema.columns
           where table_schema = 'public' and table_name = 'website_settings'
             and column_name in ('color_mode','order_email','whish_enabled','whish_number')),
         4,
         'Re-run setup_all.sql — migration 0005 did not apply.'

  union all
  select 8, 'required', 'Veloura Lab content',
         (select count(*) from public.categories c
            join public.businesses b on b.id = c.business_id where b.slug = 'veloura-lab')
       + (select count(*) from public.products p
            join public.businesses b on b.id = p.business_id where b.slug = 'veloura-lab')
       + (select count(*) from public.delivery_zones d
            join public.businesses b on b.id = d.business_id where b.slug = 'veloura-lab'),
         20,
         'Re-run the seed section — expected 5 categories + 7 products + 8 delivery areas.'

  union all
  select 9, 'step3', 'Your login',
         (select count(*) from public.business_members m
            join public.businesses b on b.id = m.business_id where b.slug = 'veloura-lab'),
         1,
         'Normal until Step 3. Create the user, then run seed/link_owner.sql.'
)

select
  part                  as "What",
  case
    when got >= want      then 'OK'
    when kind = 'step3'   then 'PENDING'
    else                       'PROBLEM'
  end                   as "Status",
  got || ' of ' || want as "Found",
  case when got >= want then '' else fix end as "What to do"
from checks
order by ord;
