import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { getSiteContext } from "@/lib/business";
import { whatsappHref } from "@/lib/contact";
import { Reveal } from "@/components/site/reveal";
import { Section } from "@/components/site/section";
import { SOCIAL_META, WhatsAppIcon } from "@/components/site/social-icons";
import { ButtonLink } from "@/components/ui/button";

const DAY_LABELS: [string, string][] = [
  ["mon", "Monday"],
  ["tue", "Tuesday"],
  ["wed", "Wednesday"],
  ["thu", "Thursday"],
  ["fri", "Friday"],
  ["sat", "Saturday"],
  ["sun", "Sunday"],
];

export async function generateMetadata(): Promise<Metadata> {
  const { businessName, preset } = await getSiteContext();
  return {
    title: preset.contactHeading,
    description: `Contact ${businessName}.`,
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const { businessName, settings, preset } = await getSiteContext();
  const hours = settings?.hours ?? {};
  const hourEntries = DAY_LABELS.filter(([key]) => hours[key as keyof typeof hours]);
  const social = settings?.social_links ?? {};
  const socialEntries = SOCIAL_META.filter(({ key }) => social[key]);
  const whatsapp = whatsappHref(
    settings?.whatsapp || settings?.phone,
    `Hi ${businessName}! I'd like to know more.`,
  );

  return (
    <>
      <Section className="pb-0 pt-32 sm:pt-36">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-accent">{businessName}</p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-ink-50 sm:text-5xl">
            {preset.contactHeading}
          </h1>
          <p className="mt-5 text-base text-ink-300">
            We reply to every message — usually within a few hours.
          </p>
        </Reveal>
      </Section>

      <Section>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal className="space-y-4">
            {settings?.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(settings.address)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-start gap-4 rounded-2xl border border-ink-800 bg-ink-900/60 p-5 transition-colors duration-300 hover:border-accent/40"
              >
                <MapPin className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                <span>
                  <span className="block text-xs uppercase tracking-[0.16em] text-ink-500">Address</span>
                  <span className="mt-1 block text-ink-100">{settings.address}</span>
                </span>
              </a>
            )}

            {settings?.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="flex items-start gap-4 rounded-2xl border border-ink-800 bg-ink-900/60 p-5 transition-colors duration-300 hover:border-accent/40"
              >
                <Phone className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                <span>
                  <span className="block text-xs uppercase tracking-[0.16em] text-ink-500">Phone</span>
                  <span className="mt-1 block text-ink-100">{settings.phone}</span>
                </span>
              </a>
            )}

            {settings?.email && (
              <a
                href={`mailto:${settings.email}`}
                className="flex items-start gap-4 rounded-2xl border border-ink-800 bg-ink-900/60 p-5 transition-colors duration-300 hover:border-accent/40"
              >
                <Mail className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-xs uppercase tracking-[0.16em] text-ink-500">Email</span>
                  <span className="mt-1 block break-all text-ink-100">{settings.email}</span>
                </span>
              </a>
            )}

            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-start gap-4 rounded-2xl border border-accent/30 bg-brand/15 p-5 transition-colors duration-300 hover:border-accent/60"
              >
                <WhatsAppIcon className="mt-0.5 size-5 shrink-0 text-accent" />
                <span>
                  <span className="block text-xs uppercase tracking-[0.16em] text-ink-500">WhatsApp</span>
                  <span className="mt-1 block text-ink-100">Message us to order</span>
                </span>
              </a>
            )}

            {socialEntries.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pt-2">
                {socialEntries.map(({ key, label, Icon }) => (
                  <a
                    key={key}
                    href={social[key]!}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 rounded-full border border-ink-700 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-ink-200 transition-colors hover:border-accent/60 hover:text-accent"
                  >
                    <Icon className="size-4" />
                    {label}
                  </a>
                ))}
              </div>
            )}
          </Reveal>

          {hourEntries.length > 0 && (
            <Reveal delay={120}>
              <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-6">
                <h2 className="font-display text-xl font-semibold text-ink-50">Opening hours</h2>
                <ul className="mt-4 divide-y divide-ink-800 text-sm">
                  {hourEntries.map(([key, label]) => (
                    <li key={key} className="flex justify-between gap-4 py-3">
                      <span className="text-ink-400">{label}</span>
                      <span className="text-ink-100">{hours[key as keyof typeof hours]}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <ButtonLink href={preset.catalogPath} className="w-full">
                    {preset.heroCta}
                  </ButtonLink>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </Section>
    </>
  );
}
