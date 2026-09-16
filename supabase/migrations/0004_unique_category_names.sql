-- One category name per business.
--
-- Two problems, one cause:
--
--   1. Nothing stopped a business having two categories called "Fiction",
--      which is a data-quality bug on its own — the public site renders both
--      and the owner can't tell them apart.
--   2. The seed files use `on conflict do nothing` when inserting categories
--      and describe themselves as safe to re-run. With no matching unique
--      constraint that clause can never fire, so every re-run silently
--      duplicated the entire category list.
--
-- Adding the constraint fixes both. Existing duplicates have to be merged
-- first, or the index creation fails on any database that already has them.
--
-- Safe to re-run.

-- ---- 1. Move products off duplicate categories onto the oldest one --------
with ranked as (
  select
    id,
    business_id,
    name,
    first_value(id) over (
      partition by business_id, name order by created_at, id
    ) as keeper_id
  from public.categories
)
update public.products p
set category_id = r.keeper_id
from ranked r
where p.category_id = r.id
  and r.id <> r.keeper_id;

-- ---- 2. Delete the now-unreferenced duplicates ----------------------------
with ranked as (
  select
    id,
    first_value(id) over (
      partition by business_id, name order by created_at, id
    ) as keeper_id
  from public.categories
)
delete from public.categories c
using ranked r
where c.id = r.id
  and r.id <> r.keeper_id;

-- ---- 3. Enforce it from here on ------------------------------------------
create unique index if not exists categories_business_id_name_key
  on public.categories (business_id, name);
