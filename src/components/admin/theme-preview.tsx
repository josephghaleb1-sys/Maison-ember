"use client";

import { buildThemeCss } from "@/lib/theme";

/**
 * Miniature of the public site rendered with the colors currently in the
 * form — the same buildThemeCss() the live site uses, so what an owner sees
 * here is what they'll get after saving.
 */
export function ThemePreview({
  primary,
  secondary,
  businessName,
}: {
  primary: string;
  secondary: string;
  businessName: string;
}) {
  const css = buildThemeCss({ primary_color: primary, secondary_color: secondary });

  return (
    <div
      // Scoped to this element rather than :root so it can't leak into the
      // dashboard's own chrome.
      style={Object.fromEntries(
        css
          .split(";")
          .filter(Boolean)
          .map((decl) => {
            const index = decl.indexOf(":");
            return [decl.slice(0, index), decl.slice(index + 1)];
          }),
      ) as React.CSSProperties}
      className="overflow-hidden rounded-xl border border-charcoal-800"
    >
      <div style={{ background: "var(--surface)" }} className="p-5">
        <div className="flex items-center justify-between">
          <span
            style={{ color: "var(--ink)" }}
            className="font-display text-sm font-semibold"
          >
            {businessName || "Your business"}
          </span>
          <span style={{ color: "var(--brand)" }} className="text-[11px] tracking-wide">
            Shop · About · Contact
          </span>
        </div>

        <div
          style={{ background: "var(--surface-1)", borderColor: "var(--line)" }}
          className="mt-4 rounded-lg border p-4"
        >
          <p
            style={{ color: "var(--brand)" }}
            className="text-[10px] uppercase tracking-[0.25em]"
          >
            Featured
          </p>
          <p
            style={{ color: "var(--ink)" }}
            className="mt-1.5 font-display text-lg font-semibold"
          >
            A headline on your site
          </p>
          <p style={{ color: "var(--ink-muted)" }} className="mt-1 text-xs">
            Supporting copy sits at this contrast level.
          </p>
          <div className="mt-3 flex gap-2">
            <span
              style={{ background: "var(--brand)", color: "var(--on-brand)" }}
              className="rounded-full px-3 py-1 text-[11px] font-medium"
            >
              Primary button
            </span>
            <span
              style={{ borderColor: "var(--brand-line)", color: "var(--brand)" }}
              className="rounded-full border px-3 py-1 text-[11px] font-medium"
            >
              Secondary
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
