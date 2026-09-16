import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react";
import { getSiteContext } from "@/lib/business";
import { mapsUrl, telHref, whatsappUrl } from "@/lib/contact";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteLinkButton } from "@/components/site/site-button";
import { Reveal } from "@/components/site/reveal";

export async function generateMetadata(): Promise<Metadata> {
  const { businessName, settings } = await getSiteContext();
  return {
    title: "Contact",
    description: settings?.address
      ? `Find ${businessName} at ${settings.address}.`
      : `Get in touch with ${businessName}.`,
    alternates: { canonical: "/contact" },
  };
}

const DAY_LABELS: [string, string][] = [
  ["mon", "Monday"],
  ["tue", "Tuesday"],
  ["wed", "Wednesday"],
  ["thu", "Thursday"],
  ["fri", "Friday"],
  ["sat", "Saturday"],
  ["sun", "Sunday"],
];

export default async function ContactPage() {
  const { settings, type, businessName } = await getSiteContext();

  const hours = settings?.hours ?? {};
  const hasHours = DAY_LABELS.some(([key]) => hours[key as keyof typeof hours]);
  const social = Object.entries(settings?.social_links ?? {}).filter(([, url]) => url);

  const directions = mapsUrl(settings?.address);
  const phone = telHref(settings?.phone);
  const wa = whatsappUrl(settings?.whatsapp);

  // Each card is only rendered when its field has a value — the brief calls
  // for no empty fields on the public site.
  const cards = [
    directions && settings?.address
      ? {
          key: "address",
          href: directions,
          external: true,
          icon: MapPin,
          label: "Visit",
          value: settings.address,
        }
      : null,
    phone && settings?.phone
      ? { key: "phone", href: phone, external: false, icon: Phone, label: "Call", value: settings.phone }
      : null,
    wa
      ? {
          key: "whatsapp",
          href: wa,
          external: true,
          icon: MessageCircle,
          label: "WhatsApp",
          value: settings?.whatsapp ?? "",
        }
      : null,
    settings?.email
      ? {
          key: "email",
          href: `mailto:${settings.email}`,
          external: false,
          icon: Mail,
          label: "Email",
          value: settings.email,
        }
      : null,
  ].filter((card): card is NonNullable<typeof card> => card !== null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-24">
      <Reveal>
        <SectionHeading
          eyebrow="Contact"
          title={type.visitLabel}
          description={`We'd love to hear from you.`}
          align="center"
        />
      </Reveal>

      {cards.length === 0 && !hasHours ? (
        <Reveal delay={100}>
          <div className="mx-auto mt-16 max-w-md rounded-2xl border border-line bg-surface-1 px-6 py-14 text-center">
            <p className="font-display text-xl font-semibold text-ink">Details coming soon</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {businessName} hasn&apos;t published contact details yet.
            </p>
          </div>
        </Reveal>
      ) : (
        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            {cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <Reveal key={card.key} delay={i * 80}>
                  <a
                    href={card.href}
                    {...(card.external ? { target: "_blank", rel: "noreferrer" } : {})}
                    className="flex items-start gap-4 rounded-2xl border border-line bg-surface-1 p-5 transition-colors duration-300 hover:border-brand-line"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-tint">
                      <Icon className="size-5 text-brand" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-medium uppercase tracking-[0.2em] text-ink-faint">
                        {card.label}
                      </span>
                      <span className="mt-1 block break-words text-base text-ink">{card.value}</span>
                    </span>
                  </a>
                </Reveal>
              );
            })}

            {social.length > 0 && (
              <Reveal delay={cards.length * 80}>
                <div className="flex flex-wrap gap-3 pt-2">
                  {social.map(([key, url]) => (
                    <Link
                      key={key}
                      href={url as string}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-line-strong px-5 py-2 text-sm font-medium text-ink-muted transition-colors duration-300 hover:border-brand-line hover:text-brand"
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Link>
                  ))}
                </div>
              </Reveal>
            )}
          </div>

          {hasHours && (
            <Reveal delay={120} className="lg:col-span-2">
              <div className="rounded-2xl border border-line bg-surface-1 p-6">
                <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-ink">
                  <Clock className="size-5 text-brand" aria-hidden /> Opening hours
                </h2>
                <ul className="mt-4 divide-y divide-line text-sm">
                  {DAY_LABELS.map(([key, label]) => (
                    <li key={key} className="flex justify-between gap-4 py-2.5">
                      <span className="text-ink-muted">{label}</span>
                      <span className="text-right font-medium text-ink">
                        {hours[key as keyof typeof hours] || "Closed"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )}
        </div>
      )}

      {(directions || wa) && (
        <Reveal delay={200} className="mt-12 flex flex-wrap justify-center gap-3">
          {directions && (
            <SiteLinkButton href={directions} target="_blank" rel="noreferrer" size="lg">
              Get directions
            </SiteLinkButton>
          )}
          {wa && (
            <SiteLinkButton
              href={wa}
              target="_blank"
              rel="noreferrer"
              size="lg"
              variant="outline"
            >
              Message on WhatsApp
            </SiteLinkButton>
          )}
        </Reveal>
      )}
    </div>
  );
}
