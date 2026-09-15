import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readSupabaseConfig } from "./config";

const PUBLIC_ADMIN_ROUTES = ["/admin/login", "/admin/reset-password"];

/**
 * Refreshes the Supabase auth session on every request and gates /admin.
 * Called from src/proxy.ts (Next.js 16's renamed `middleware.ts`).
 *
 * This is an *optimistic* check for good UX (redirect before rendering) —
 * the real security boundary is Postgres RLS, enforced again on every
 * query in Server Components/Actions.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Runs before every page. Without Supabase configured there is no session
  // to refresh and no /admin worth gating — but throwing here would take down
  // every route, including the page that explains what is missing. Step aside
  // and let the root layout render that explanation instead.
  const configured = readSupabaseConfig();
  if (!configured.ok) return supabaseResponse;

  const supabase = createServerClient(
    configured.config.url,
    configured.config.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isPublicAdminRoute = PUBLIC_ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isAdminRoute && !isPublicAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/admin/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
