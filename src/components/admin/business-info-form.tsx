"use client";

import { useActionState } from "react";
import type { Business, WebsiteSettings } from "@/lib/database.types";
import type { FormState } from "@/lib/actions/auth";
import { updateBusinessInfo } from "@/lib/actions/settings";
import { INDUSTRY_OPTIONS } from "@/lib/industry";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: FormState = {};

const DAYS = [
  ["mon", "Monday"],
  ["tue", "Tuesday"],
  ["wed", "Wednesday"],
  ["thu", "Thursday"],
  ["fri", "Friday"],
  ["sat", "Saturday"],
  ["sun", "Sunday"],
] as const;

const SOCIALS = [
  ["social_instagram", "Instagram URL", "instagram"],
  ["social_facebook", "Facebook URL", "facebook"],
  ["social_tiktok", "TikTok URL", "tiktok"],
  ["social_twitter", "X / Twitter URL", "twitter"],
  ["social_yelp", "Yelp URL", "yelp"],
] as const;

export function BusinessInfoForm({
  business,
  settings,
}: {
  business: Business;
  settings: WebsiteSettings | null;
}) {
  const [state, formAction, isPending] = useActionState(updateBusinessInfo, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>The basics</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="business_name">Business name</Label>
            <Input
              id="business_name"
              name="business_name"
              defaultValue={settings?.business_name || business.name}
              required
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="industry">Type of business</Label>
            <Select id="industry" name="industry" defaultValue={business.industry}>
              {INDUSTRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-ink-500">
              Sets the wording across your site — “Menu”, “Services” or “Shop”.
            </p>
          </div>
          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              name="tagline"
              defaultValue={settings?.tagline}
              maxLength={160}
              placeholder="One short line that sums you up"
            />
          </div>
          <div>
            <Label htmlFor="about_text">About</Label>
            <Textarea
              id="about_text"
              name="about_text"
              defaultValue={settings?.about_text}
              rows={7}
            />
            <p className="mt-1 text-xs text-ink-500">
              Blank lines start a new paragraph on your About page.
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={settings?.phone} />
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp number</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              defaultValue={settings?.whatsapp}
              placeholder="+961 70 000 000"
            />
            <p className="mt-1 text-xs text-ink-500">
              Adds a chat button and “Order” links. Leave empty to hide them.
            </p>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={settings?.email} />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={settings?.address} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opening hours</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {DAYS.map(([key, label]) => (
            <div key={key}>
              <Label htmlFor={`hours_${key}`}>{label}</Label>
              <Input
                id={`hours_${key}`}
                name={`hours_${key}`}
                placeholder="e.g. 10:00 - 19:00, or Closed"
                defaultValue={settings?.hours?.[key]}
              />
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social links</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SOCIALS.map(([name, label, key]) => (
            <div key={name}>
              <Label htmlFor={name}>{label}</Label>
              <Input
                id={name}
                name={name}
                inputMode="url"
                defaultValue={settings?.social_links?.[key]}
                placeholder="https://"
              />
            </div>
          ))}
        </CardBody>
      </Card>

      <FieldError>{state.error}</FieldError>

      <div className="sticky bottom-16 flex flex-wrap items-center gap-3 rounded-xl border border-ink-800 bg-ink-900/95 p-4 backdrop-blur md:bottom-0">
        <Button type="submit" loading={isPending}>
          Save changes
        </Button>
        {state.message && <p className="text-sm text-green-400">{state.message}</p>}
      </div>
    </form>
  );
}
