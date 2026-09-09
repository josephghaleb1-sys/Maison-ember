-- Performance: composite index for the business_members lookups that run on
-- nearly every admin request.
--
-- Two query shapes hit this table constantly:
--   1. requireBusinessContext(): where user_id = auth.uid()
--   2. is_business_member(): where business_id = ? and user_id = auth.uid()
--      (called from inside almost every RLS policy on categories/products/
--      media/website_settings — i.e. on every read and write those tables do)
--
-- Both previously had to be served by combining two single-column indexes
-- (business_members_user_id_idx, business_members_business_id_idx). A single
-- composite index serves both shapes directly. Safe to re-run.
--
-- Note: business_members is expected to stay a small table (one row per
-- staff member per business), so this is correctness/best-practice rather
-- than a measurable fix on its own — the real wins are fewer round trips.

create index if not exists business_members_user_business_idx
  on public.business_members (user_id, business_id);
