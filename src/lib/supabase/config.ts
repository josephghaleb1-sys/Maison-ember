/**
 * Reads the two Supabase variables every client factory needs.
 *
 * They are the one piece of configuration a deployment cannot run without,
 * and the failure mode when they are absent is the worst kind: the proxy
 * (middleware) constructs a client on *every* request, so an unconfigured
 * deployment throws before any page renders and the visitor gets a blank
 * screen with nothing to act on. Reading them through here instead lets the
 * app notice the gap and say so.
 */

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export const SUPABASE_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export type SupabaseEnvKey = (typeof SUPABASE_ENV_KEYS)[number];

/**
 * Non-throwing read. `missing` names the variables that are absent or blank,
 * in the order they should be added.
 */
export function readSupabaseConfig():
  | { ok: true; config: SupabaseConfig }
  | { ok: false; missing: SupabaseEnvKey[] } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const missing: SupabaseEnvKey[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (missing.length > 0) return { ok: false, missing };
  return { ok: true, config: { url: url!, anonKey: anonKey! } };
}

export function isSupabaseConfigured(): boolean {
  return readSupabaseConfig().ok;
}

/**
 * Throwing read, for the code paths that cannot render an explanation — route
 * handlers, Server Actions, the storage URL builder. The message names the
 * variables and where to set them, rather than @supabase/ssr's
 * "supabaseUrl is required".
 */
export function requireSupabaseConfig(): SupabaseConfig {
  const result = readSupabaseConfig();
  if (result.ok) return result.config;

  throw new Error(
    `This deployment is missing ${result.missing.join(" and ")}. ` +
      `Add ${result.missing.length === 1 ? "it" : "them"} in your host's ` +
      `environment variables (on Vercel: Settings -> Environment Variables), ` +
      `then redeploy. The values are in your Supabase project under ` +
      `Project Settings -> API.`,
  );
}
