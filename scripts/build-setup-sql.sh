set -euo pipefail
out=supabase/setup_all.sql

cat > "$out" <<'HDR'
-- ===========================================================================
-- ONE-PASTE SETUP
-- ===========================================================================
-- Everything needed to stand up a fresh Supabase project for this platform:
-- the six migrations in order, then the Veloura Lab seed data.
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> New query -> paste this whole file
--   -> Run.
--
-- SAFE TO RE-RUN. Every statement is idempotent (tables and indexes use
-- "if not exists", policies and functions are dropped and recreated, the seed
-- skips rows that already exist), so running it twice changes nothing and a
-- run that stops partway can simply be run again after the cause is fixed.
--
-- WHAT YOU SHOULD SEE: seven "== applied: ... ===" lines and nothing else.
-- Routine chatter is silenced below so that anything which does appear is
-- worth reading — in particular a warning about STORAGE, which means this
-- project would not let the SQL Editor create the media bucket or its
-- policies. That is the one thing that breaks photo uploads later; the
-- warning names the fix, and README "If photo uploads fail" has the detail.
--
-- This file is generated from the files it contains. To regenerate it:
--   bash scripts/build-setup-sql.sh
-- Do not edit it by hand; edit the migration or seed and regenerate.
-- ===========================================================================

-- Silence the routine "... does not exist, skipping" chatter that every
-- idempotent DROP emits on a first run, so real warnings stand out.
set client_min_messages to warning;

HDR

emit() {
  local file="$1" label="$2"
  {
    printf '\n\n'
    printf -- '-- ###########################################################################\n'
    printf -- '-- # %s\n' "$label"
    printf -- '-- # source: %s\n' "$file"
    printf -- '-- ###########################################################################\n\n'
    cat "$file"
    printf '\n'
    printf "do \$setup\$ begin raise warning '== applied: %s ==='; end \$setup\$;\n" "$label"
  } >> "$out"
}

emit supabase/migrations/0001_init.sql            "0001 core schema, security rules, media storage"
emit supabase/migrations/0002_perf_indexes.sql    "0002 performance indexes"
emit supabase/migrations/0003_platform_extensions.sql "0003 domains, branding, SEO, testimonials"
emit supabase/migrations/0004_checkout.sql        "0004 delivery zones, orders, checkout"
emit supabase/migrations/0005_theme_payments_email.sql "0005 light/dark, order email, Whish payment"
emit supabase/migrations/0006_sales.sql           "0006 sale prices"
emit supabase/seed/veloura_lab.sql                "seed Veloura Lab demo content"

{
  printf '\n\n'
  printf -- '-- ###########################################################################\n'
  printf -- '-- # Done. Next: Authentication -> Users -> Add user (tick Auto Confirm),\n'
  printf -- '-- # then run supabase/seed/link_owner.sql with your email to get access.\n'
  printf -- '-- ###########################################################################\n'
} >> "$out"
