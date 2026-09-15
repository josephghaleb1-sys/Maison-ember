import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { requireSupabaseConfig } from "./config";

export function createClient() {
  const { url, anonKey } = requireSupabaseConfig();

  return createBrowserClient<Database>(url, anonKey);
}
