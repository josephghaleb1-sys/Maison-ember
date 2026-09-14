import { ExternalLink, LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import type { BusinessRole } from "@/lib/database.types";

export function Topbar({
  email,
  role,
  siteHref,
}: {
  email: string | null;
  role: BusinessRole;
  siteHref: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink-800 bg-ink-900/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink-50">{email}</p>
        <p className="text-xs capitalize text-ink-500">{role}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {/* Opens the live public site this dashboard controls. */}
        <a
          href={siteHref}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-ink-700 px-2.5 py-1.5 text-sm font-medium text-ink-200 transition-colors hover:border-accent/50 hover:text-accent"
        >
          <ExternalLink className="size-4" aria-hidden />
          <span className="hidden sm:inline">View website</span>
        </a>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-300 transition-colors hover:bg-ink-800"
          >
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
