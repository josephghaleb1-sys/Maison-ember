import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { SetupRequired } from "@/components/setup-required";
import { readSupabaseConfig } from "@/lib/supabase/config";

/**
 * Two faces only: a high-contrast serif for display type and a neutral sans
 * for everything functional. `display: "swap"` plus Next's self-hosting means
 * no render-blocking font request and no layout shift on load.
 */
const display = Cormorant_Garamond({
  variable: "--font-display-family",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sans = Inter({
  variable: "--font-sans-family",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Fallback metadata only. The public site overrides all of this per business
 * in src/app/(site)/layout.tsx, reading from the database — nothing here is
 * specific to any one customer.
 */
export const metadata: Metadata = {
  title: "Business website",
  description: "A website powered by the platform.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Checked here rather than per-page: every route needs Supabase, and this is
  // the outermost place that can still render HTML when it is absent.
  const supabase = readSupabaseConfig();

  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      {/* The toast host lives in the admin layout, not here: the public site
          never raises toasts, and this keeps its JS payload smaller. */}
      <body className="flex min-h-full flex-col font-sans">
        {supabase.ok ? children : <SetupRequired missing={supabase.missing} />}
      </body>
    </html>
  );
}
