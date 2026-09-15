"use client";

import { useActionState, useState } from "react";
import type { ColorMode, WebsiteSettings } from "@/lib/database.types";
import type { FormState } from "@/lib/actions/auth";
import { updateWebsiteSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageField } from "@/components/admin/image-field";
import { DEFAULT_PRIMARY, DEFAULT_SECONDARY } from "@/lib/theme";

const initialState: FormState = {};

/** Colour input + hex text box, kept in sync. */
function ColorField({
  name,
  label,
  hint,
  defaultValue,
  value,
  onChange,
}: {
  name: string;
  label: string;
  hint: string;
  defaultValue: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          id={name}
          type="color"
          value={value || defaultValue}
          onChange={(event) => onChange(event.target.value)}
          className="size-11 shrink-0 cursor-pointer rounded-lg border border-ink-700 bg-ink-900 p-1"
          aria-label={`${label} colour picker`}
        />
        <Input
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={7}
          spellCheck={false}
          className="font-mono"
        />
      </div>
      <p className="mt-1 text-xs text-ink-500">{hint}</p>
    </div>
  );
}

export function WebsiteForm({ settings }: { settings: WebsiteSettings | null }) {
  const [state, formAction, isPending] = useActionState(updateWebsiteSettings, initialState);
  const [primary, setPrimary] = useState(settings?.primary_color || DEFAULT_PRIMARY);
  const [secondary, setSecondary] = useState(settings?.secondary_color || DEFAULT_SECONDARY);
  const [mode, setMode] = useState<ColorMode>(settings?.color_mode === "light" ? "light" : "dark");

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Look</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          <div>
            <Label htmlFor="color_mode">Website background</Label>
            <div className="mt-1 grid grid-cols-2 gap-3">
              {(
                [
                  {
                    value: "light" as const,
                    title: "Light",
                    hint: "Ivory and blush. Best for pale product photos — skincare, beauty, jewellery.",
                    swatch: "#fbf6f3",
                    ink: "#1b1211",
                  },
                  {
                    value: "dark" as const,
                    title: "Dark",
                    hint: "Near-black and deep colour. Best for rich, moody photography.",
                    swatch: "#08060a",
                    ink: "#f8f3ea",
                  },
                ]
              ).map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                    mode === option.value
                      ? "border-accent bg-accent/10"
                      : "border-ink-700 hover:border-ink-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="color_mode"
                    value={option.value}
                    checked={mode === option.value}
                    onChange={() => setMode(option.value)}
                    className="sr-only"
                  />
                  <span
                    className="flex h-14 items-center justify-center rounded-lg border border-ink-700 font-display text-lg"
                    style={{ background: option.swatch, color: option.ink }}
                  >
                    Aa
                  </span>
                  <span className="mt-2.5 block text-sm font-medium text-ink-50">
                    {option.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                    {option.hint}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ColorField
              name="primary_color"
              label="Primary colour"
              hint="Deep background tone — used for the hero and highlights."
              defaultValue={DEFAULT_PRIMARY}
              value={primary}
              onChange={setPrimary}
            />
            <ColorField
              name="secondary_color"
              label="Accent colour"
              hint="Buttons, links and fine detail."
              defaultValue={DEFAULT_SECONDARY}
              value={secondary}
              onChange={setSecondary}
            />
          </div>

          {/* Live preview of exactly what the site will use. */}
          <div
            className="overflow-hidden rounded-xl border border-ink-800"
            style={{
              background: `linear-gradient(120deg, ${primary} 0%, ${
                mode === "light" ? "#fbf6f3" : "#0b0709"
              } 75%)`,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p
                  className="text-[0.6875rem] uppercase tracking-[0.3em]"
                  style={{ color: mode === "light" ? primary : secondary }}
                >
                  Preview
                </p>
                <p
                  className="mt-1 font-display text-2xl"
                  style={{ color: mode === "light" ? "#1b1211" : "#f8f3ea" }}
                >
                  {settings?.business_name || "Your business"}
                </p>
              </div>
              <span
                className="rounded-full px-5 py-2 text-xs font-medium uppercase tracking-[0.16em]"
                style={{ background: secondary, color: "#14100f" }}
              >
                Call to action
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hero section</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="hero_title">Headline</Label>
            <Input
              id="hero_title"
              name="hero_title"
              defaultValue={settings?.hero_title}
              maxLength={120}
              placeholder="The line people read first"
            />
          </div>
          <div>
            <Label htmlFor="hero_subtitle">Supporting text</Label>
            <Textarea
              id="hero_subtitle"
              name="hero_subtitle"
              defaultValue={settings?.hero_subtitle}
              rows={3}
              maxLength={300}
            />
          </div>
          <div>
            <Label htmlFor="hero_cta_label">Button label</Label>
            <Input
              id="hero_cta_label"
              name="hero_cta_label"
              defaultValue={settings?.hero_cta_label}
              maxLength={40}
              placeholder="Shop the collection"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          <ImageField
            name="logo"
            label="Logo"
            currentPath={settings?.logo_path ?? null}
            hint="Square works best. Without one, we show a monogram. Max 5MB."
            maxDimension={800}
          />
          <ImageField
            name="hero"
            label="Hero background"
            currentPath={settings?.hero_image_path ?? null}
            hint="Wide photo, 1600px or more. Leave empty to keep the animated brand scene."
            maxDimension={2000}
          />
          <ImageField
            name="og"
            label="Social share image"
            currentPath={settings?.og_image_path ?? null}
            hint="Shown when your link is shared on WhatsApp, Instagram or Facebook. 1200×630 is ideal."
            maxDimension={1200}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing display</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="max-w-40">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              name="currency"
              defaultValue={settings?.currency || "USD"}
              maxLength={3}
              className="uppercase"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-200">
            <input
              type="checkbox"
              name="show_prices"
              defaultChecked={settings?.show_prices ?? true}
              className="rounded border-ink-600"
            />
            Show prices on the public website
          </label>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order notifications</CardTitle>
        </CardHeader>
        <CardBody>
          <Label htmlFor="order_email">Send new orders to</Label>
          <Input
            id="order_email"
            name="order_email"
            type="email"
            defaultValue={settings?.order_email}
            placeholder="you@example.com"
          />
          <p className="mt-1 text-xs text-ink-500">
            Every new order is emailed here with the customer&apos;s details and a button that
            opens it in this dashboard to confirm or cancel. Leave empty to turn the emails off.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search engines &amp; sharing</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="seo_title">Page title</Label>
            <Input
              id="seo_title"
              name="seo_title"
              defaultValue={settings?.seo_title}
              maxLength={70}
              placeholder="Business name | What you sell"
            />
            <p className="mt-1 text-xs text-ink-500">Up to 70 characters.</p>
          </div>
          <div>
            <Label htmlFor="seo_description">Description</Label>
            <Textarea
              id="seo_description"
              name="seo_description"
              defaultValue={settings?.seo_description}
              rows={3}
              maxLength={200}
            />
            <p className="mt-1 text-xs text-ink-500">
              The sentence shown under your link in search results. Up to 200 characters.
            </p>
          </div>
        </CardBody>
      </Card>

      <FieldError>{state.error}</FieldError>

      <div className="sticky bottom-16 flex flex-wrap items-center gap-3 rounded-xl border border-ink-800 bg-ink-900/95 p-4 backdrop-blur md:bottom-0">
        <Button type="submit" loading={isPending}>
          Save website settings
        </Button>
        {state.message && <p className="text-sm text-green-400">{state.message}</p>}
      </div>
    </form>
  );
}
