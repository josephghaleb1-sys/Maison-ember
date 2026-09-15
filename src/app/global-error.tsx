"use client";

/**
 * Last-resort boundary: only reached if the root layout itself fails, which is
 * why it ships its own <html>/<body> and no shared styling.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08060a",
          color: "#f8f3ea",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ marginTop: "0.75rem", color: "#b4a99a" }}>
            Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.7rem 1.5rem",
              borderRadius: "999px",
              border: "1px solid #d4af37",
              background: "transparent",
              color: "#d4af37",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontSize: "0.75rem",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ marginTop: "1.25rem", fontSize: "0.75rem", color: "#6d6359" }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
