import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";

/** `siteHref` is the business's primary custom domain when it has one, and
 * this deployment's root otherwise — see getPublicSiteHref(). */
export function Topbar({ email, siteHref }: { email: string | null; siteHref: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-charcoal-800 bg-charcoal-900/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-cream-50">{email}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <Link
          href={siteHref}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-charcoal-300 hover:bg-charcoal-800"
        >
          <ExternalLink className="size-4" aria-hidden />
          <span className="hidden sm:inline">View website</span>
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-charcoal-300 hover:bg-charcoal-800"
          >
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
