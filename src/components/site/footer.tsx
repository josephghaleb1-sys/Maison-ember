import Link from "next/link";
import { Phone, Mail, MapPin, Flame } from "lucide-react";
import type { WebsiteSettings } from "@/lib/database.types";

const DAY_LABELS: [keyof NonNullable<WebsiteSettings["hours"]>, string][] = [
  ["mon", "Mon"],
  ["tue", "Tue"],
  ["wed", "Wed"],
  ["thu", "Thu"],
  ["fri", "Fri"],
  ["sat", "Sat"],
  ["sun", "Sun"],
];

const SOCIAL_LABELS: [keyof NonNullable<WebsiteSettings["social_links"]>, string][] = [
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["twitter", "Twitter / X"],
  ["tiktok", "TikTok"],
  ["yelp", "Yelp"],
];

export function SiteFooter({
  businessName,
  settings,
}: {
  businessName: string;
  settings: WebsiteSettings | null;
}) {
  const hours = settings?.hours ?? {};
  const social = settings?.social_links ?? {};
  const socialEntries = SOCIAL_LABELS.filter(([key]) => social[key]);

  return (
    <footer className="border-t border-charcoal-900/10 bg-charcoal-950 text-charcoal-300">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-ember-600 text-white">
              <Flame className="size-4" aria-hidden />
            </span>
            <span className="font-display text-base font-semibold text-white">{businessName}</span>
          </div>
          {settings?.tagline && <p className="mt-3 text-sm">{settings.tagline}</p>}
          {socialEntries.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-3">
              {socialEntries.map(([key, label]) => (
                <li key={key}>
                  <Link
                    href={social[key]!}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-charcoal-300 hover:text-ember-400"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <h3 className="font-medium text-white">Contact</h3>
          {settings?.address && (
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              {settings.address}
            </p>
          )}
          {settings?.phone && (
            <p className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" aria-hidden />
              <a href={`tel:${settings.phone}`} className="hover:text-ember-400">
                {settings.phone}
              </a>
            </p>
          )}
          {settings?.email && (
            <p className="flex items-center gap-2">
              <Mail className="size-4 shrink-0" aria-hidden />
              <a href={`mailto:${settings.email}`} className="hover:text-ember-400">
                {settings.email}
              </a>
            </p>
          )}
        </div>

        <div className="text-sm">
          <h3 className="font-medium text-white">Hours</h3>
          <ul className="mt-2 space-y-1">
            {DAY_LABELS.map(([key, label]) => (
              <li key={key} className="flex justify-between gap-4">
                <span>{label}</span>
                <span className="text-charcoal-400">{hours[key] || "—"}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-charcoal-500 sm:px-6">
        © {new Date().getFullYear()} {businessName}. All rights reserved.
      </div>
    </footer>
  );
}
