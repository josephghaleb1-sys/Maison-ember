import type { SupabaseEnvKey } from "@/lib/supabase/config";

/**
 * Shown in place of the site when the deployment has no Supabase credentials.
 *
 * Without them nothing can render — not the homepage, not /admin, not an
 * error boundary that needs data. The previous behaviour was a blank white
 * page, which tells whoever deployed it nothing at all. This is deliberately
 * self-contained: no database, no client JS, no brand theming (there is no
 * business to theme it with), so it renders under exactly the conditions that
 * break everything else.
 */
export function SetupRequired({ missing }: { missing: readonly SupabaseEnvKey[] }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-ink-800 bg-ink-900 p-6 sm:p-8">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-brand-secondary">
          Almost there
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink-50">
          This site needs its database details
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-300">
          The code deployed correctly. It just has not been told which Supabase
          project to read from, so there is nothing to show yet.
        </p>

        <div className="mt-6 rounded-xl border border-ink-800 bg-ink-950 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            {missing.length === 1 ? "Missing setting" : "Missing settings"}
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {missing.map((key) => (
              <li
                key={key}
                className="break-all font-mono text-xs text-brand-accent-text"
              >
                {key}
              </li>
            ))}
          </ul>
        </div>

        <ol className="mt-6 flex list-decimal flex-col gap-3 pl-5 text-sm leading-relaxed text-ink-200 marker:text-ink-500">
          <li>
            Open your hosting dashboard. On Vercel that is{" "}
            <span className="text-ink-50">Settings → Environment Variables</span>.
          </li>
          <li>
            Add the {missing.length === 1 ? "value" : "values"} above. They are in
            Supabase under{" "}
            <span className="text-ink-50">Project Settings → API</span> — the
            Project URL, and the key labelled{" "}
            <span className="text-ink-50">anon</span> (never the service role
            one).
          </li>
          <li>
            Redeploy. On Vercel:{" "}
            <span className="text-ink-50">Deployments → ⋯ → Redeploy</span>.
          </li>
        </ol>

        <p className="mt-6 border-t border-ink-800 pt-5 text-xs leading-relaxed text-ink-400">
          Visitors see this page too, so finish setup before sharing the link.
        </p>
      </div>
    </main>
  );
}
