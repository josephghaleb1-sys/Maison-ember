import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { WebsiteSettings } from "@/lib/database.types";
import { BrandMark } from "@/components/site/brand-mark";
import { SOCIAL_META, WhatsAppIcon } from "@/components/site/social-icons";
import type { NavLink } from "@/components/site/header";
import { whatsappHref } from "@/lib/contact";

const DAY_LABELS: [keyof NonNullable<WebsiteSettings["hours"]>, string][] = [
  ["mon", "Mon"],
  ["tue", "Tue"],
  ["wed", "Wed"],
  ["thu", "Thu"],
  ["fri", "Fri"],
  ["sat", "Sat"],
  ["sun", "Sun"],
];

export function SiteFooter({
  businessName,
  settings,
  links,
}: {
  businessName: string;
  settings: WebsiteSettings | null;
  links: NavLink[];
}) {
  const social = settings?.social_links ?? {};
  const socialEntries = SOCIAL_META.filter(({ key }) => social[key]);
  const hourEntries = DAY_LABELS.filter(([key]) => settings?.hours?.[key]);
  const whatsapp = whatsappHref(settings?.whatsapp || settings?.phone);

  return (
    <footer className="relative mt-10 border-t border-accent/15 bg-ink-950">
      <div className="hairline-accent absolute inset-x-0 top-0 h-px" aria-hidden />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 md:gap-8">
        <div className="md:col-span-2 md:max-w-sm">
          <div className="flex items-center gap-3">
            <BrandMark name={businessName} logoPath={settings?.logo_path ?? null} size={44} />
            <span className="font-display text-lg font-semibold uppercase tracking-[0.24em] text-ink-50">
              {businessName}
            </span>
          </div>
          {settings?.tagline && (
            <p className="mt-4 text-sm leading-relaxed text-ink-300">{settings.tagline}</p>
          )}
          {socialEntries.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2.5">
              {socialEntries.map(({ key, label, Icon }) => (
                <li key={key}>
                  <a
                    href={social[key]!}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={label}
                    className="flex size-10 items-center justify-center rounded-full border border-ink-700 text-ink-200 transition-colors hover:border-accent/60 hover:text-accent"
                  >
                    <Icon className="size-4.5" />
                  </a>
                </li>
              ))}
              {whatsapp && (
                <li>
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="WhatsApp"
                    className="flex size-10 items-center justify-center rounded-full border border-ink-700 text-ink-200 transition-colors hover:border-accent/60 hover:text-accent"
                  >
                    <WhatsAppIcon className="size-4.5" />
                  </a>
                </li>
              )}
            </ul>
          )}
        </div>

        <div>
          <h3 className="eyebrow text-accent">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-ink-300 transition-colors hover:text-accent-bright">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow text-accent">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-300">
            {settings?.address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent/70" aria-hidden />
                <span>{settings.address}</span>
              </li>
            )}
            {settings?.phone && (
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-accent/70" aria-hidden />
                <a href={`tel:${settings.phone}`} className="transition-colors hover:text-accent-bright">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings?.email && (
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-accent/70" aria-hidden />
                <a
                  href={`mailto:${settings.email}`}
                  className="break-all transition-colors hover:text-accent-bright"
                >
                  {settings.email}
                </a>
              </li>
            )}
          </ul>

          {hourEntries.length > 0 && (
            <>
              <h3 className="eyebrow mt-8 text-accent">Hours</h3>
              <ul className="mt-4 space-y-1.5 text-sm">
                {hourEntries.map(([key, label]) => (
                  <li key={key} className="flex justify-between gap-4">
                    <span className="text-ink-400">{label}</span>
                    <span className="text-ink-200">{settings?.hours?.[key]}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-ink-800/70 px-4 py-5 sm:px-6">
        <p className="mx-auto max-w-6xl text-center text-xs text-ink-500">
          © {new Date().getFullYear()} {businessName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
