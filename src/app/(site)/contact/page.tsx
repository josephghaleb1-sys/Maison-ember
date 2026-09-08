import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { getPublicSettings } from "@/lib/business";

export const metadata: Metadata = { title: "Contact" };

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
  const settings = await getPublicSettings();
  const hours = settings?.hours ?? {};

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="font-display text-4xl font-semibold text-charcoal-900">Visit us</h1>
        <p className="mt-2 text-charcoal-500">We&apos;d love to have you.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="space-y-5">
          {settings?.address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(settings.address)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3 rounded-xl border border-charcoal-100 bg-white p-4 hover:border-ember-200"
            >
              <MapPin className="mt-0.5 size-5 shrink-0 text-ember-600" aria-hidden />
              <span className="text-charcoal-800">{settings.address}</span>
            </a>
          )}
          {settings?.phone && (
            <a
              href={`tel:${settings.phone}`}
              className="flex items-center gap-3 rounded-xl border border-charcoal-100 bg-white p-4 hover:border-ember-200"
            >
              <Phone className="size-5 shrink-0 text-ember-600" aria-hidden />
              <span className="text-charcoal-800">{settings.phone}</span>
            </a>
          )}
          {settings?.email && (
            <a
              href={`mailto:${settings.email}`}
              className="flex items-center gap-3 rounded-xl border border-charcoal-100 bg-white p-4 hover:border-ember-200"
            >
              <Mail className="size-5 shrink-0 text-ember-600" aria-hidden />
              <span className="text-charcoal-800">{settings.email}</span>
            </a>
          )}

          {Object.values(settings?.social_links ?? {}).some(Boolean) && (
            <div className="flex flex-wrap gap-3 pt-2">
              {Object.entries(settings?.social_links ?? {}).map(
                ([key, url]) =>
                  url && (
                    <Link
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-charcoal-200 px-4 py-1.5 text-sm font-medium text-charcoal-700 hover:border-ember-300 hover:text-ember-700"
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Link>
                  ),
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-charcoal-100 bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-charcoal-900">Hours</h2>
          <ul className="mt-3 divide-y divide-charcoal-100 text-sm">
            {DAY_LABELS.map(([key, label]) => (
              <li key={key} className="flex justify-between py-2">
                <span className="text-charcoal-600">{label}</span>
                <span className="font-medium text-charcoal-900">
                  {hours[key as keyof typeof hours] || "Closed"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
