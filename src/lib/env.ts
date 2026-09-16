/**
 * Environment configuration, validated with actionable messages.
 *
 * Reading `process.env.X!` directly turns a missing variable into a confusing
 * runtime crash ("Invalid URL", "fetch failed") far from its cause. A fresh
 * clone with no .env.local is the single most likely first-run problem, so it
 * gets an error that says exactly what to do instead.
 *
 * Only NEXT_PUBLIC_* values belong here — they are compiled into the browser
 * bundle. The service-role key must never be referenced anywhere in this
 * application; every query runs as the signed-in user (or anon) so that RLS
 * stays the enforcing boundary.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill in your ` +
        `Supabase project's values (Supabase Dashboard → Project Settings → API), ` +
        `then restart the dev server.`,
    );
  }
  return value.trim();
}

export function getSupabaseUrl(): string {
  const url = required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!/^https?:\/\//.test(url)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL must be a full URL starting with https:// ` +
        `(e.g. https://your-project-ref.supabase.co). Got: "${url}"`,
    );
  }
  return url.replace(/\/$/, "");
}

export function getSupabaseAnonKey(): string {
  return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
