import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import type { WebsiteSettings } from "@/lib/database.types";
import { getPublicMediaUrl } from "@/lib/storage";
import { telHref, whatsappUrl } from "@/lib/contact";

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
  // Owners often leave days blank; an all-blank table is noise, so the whole
  // column is dropped rather than rendering seven em-dashes.
  const hasHours = DAY_LABELS.some(([key]) => hours[key]);
  const wa = whatsappUrl(settings?.whatsapp);
  // A raw phone string ("+1 (555) 014-2200") is not a valid tel: URL — the
  // spaces and parens have to be stripped, same as on the contact page.
  const tel = telHref(settings?.phone);

  return (
    <footer className="border-t border-line bg-surface-1 text-ink-muted">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            {settings?.logo_path ? (
              <span className="relative size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-brand-line">
                <Image
                  src={getPublicMediaUrl(settings.logo_path)}
                  alt=""
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </span>
            ) : (
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-brand-line font-display text-base font-semibold text-brand-ink"
              >
                {businessName.trim().charAt(0).toUpperCase() || "·"}
              </span>
            )}
            <span className="font-display text-base font-semibold text-ink">{businessName}</span>
          </div>
          {settings?.tagline && <p className="mt-4 max-w-xs text-sm leading-relaxed">{settings.tagline}</p>}
          {socialEntries.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
              {socialEntries.map(([key, label]) => (
                <li key={key}>
                  <Link
                    href={social[key]!}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm transition-colors hover:text-brand-ink"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 text-sm">
          <h2 className="font-display text-base font-semibold text-ink">Contact</h2>
          {settings?.address && (
            <p className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-ink" aria-hidden />
              {settings.address}
            </p>
          )}
          {tel && settings?.phone && (
            <p className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0 text-brand-ink" aria-hidden />
              <a href={tel} className="transition-colors hover:text-brand-ink">
                {settings.phone}
              </a>
            </p>
          )}
          {wa && (
            <p className="flex items-center gap-2.5">
              <MessageCircle className="size-4 shrink-0 text-brand-ink" aria-hidden />
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-brand"
              >
                WhatsApp
              </a>
            </p>
          )}
          {settings?.email && (
            <p className="flex items-center gap-2.5">
              <Mail className="size-4 shrink-0 text-brand-ink" aria-hidden />
              <a href={`mailto:${settings.email}`} className="transition-colors hover:text-brand-ink">
                {settings.email}
              </a>
            </p>
          )}
        </div>

        {hasHours && (
          <div className="text-sm">
            <h2 className="font-display text-base font-semibold text-ink">Hours</h2>
            <ul className="mt-3 space-y-1.5">
              {DAY_LABELS.map(([key, label]) => (
                <li key={key} className="flex justify-between gap-4">
                  <span>{label}</span>
                  <span className="text-ink-faint">{hours[key] || "—"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-line px-4 py-5 text-center text-xs text-ink-faint sm:px-6">
        © {new Date().getFullYear()} {businessName}. All rights reserved.
      </div>
    </footer>
  );
}
