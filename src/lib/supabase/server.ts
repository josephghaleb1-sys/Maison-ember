import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { requireSupabaseConfig } from "./config";

/**
 * Server-side Supabase client (Server Components, Server Actions, Route
 * Handlers). Uses the anon key + the caller's session cookie — RLS enforces
 * access, this never uses the service role key.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = requireSupabaseConfig();

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component during render — safe to ignore,
            // since proxy.ts refreshes the session on every request.
          }
        },
      },
    },
  );
}
