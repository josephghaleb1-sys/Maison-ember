"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary.
 *
 * A route-segment error.tsx cannot catch a failure thrown by its *own* layout
 * or generateMetadata — and the public site resolves its business (and so hits
 * the database) in exactly those places. Without this, a database outage shows
 * Next's unstyled default 500. This replaces the whole document, so it must
 * render its own <html>/<body> and can't rely on the site's brand tokens,
 * which are themselves injected by the layout that just failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0E1420",
          color: "#F4EFE4",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
            This site is temporarily unavailable
          </h1>
          <p style={{ marginTop: "0.75rem", lineHeight: 1.6, color: "#B9B4A8", fontSize: "0.95rem" }}>
            We couldn&apos;t load the page just now. Please try again in a moment.
          </p>
          {error.digest && (
            <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#7C776C" }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.75rem",
              padding: "0.7rem 1.6rem",
              borderRadius: "999px",
              border: "none",
              background: "#C8A44D",
              color: "#10100E",
              fontWeight: 500,
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
