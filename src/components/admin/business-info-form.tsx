"use client";

import { useActionState } from "react";
import type { WebsiteSettings } from "@/lib/database.types";
import type { FormState } from "@/lib/actions/auth";
import { updateBusinessInfo } from "@/lib/actions/business-info";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { FormFooter } from "@/components/admin/form-footer";

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

export function BusinessInfoForm({ settings }: { settings: WebsiteSettings | null }) {
  const [state, formAction, isPending] = useActionState(updateBusinessInfo, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="business_name">Business name</Label>
            <Input
              id="business_name"
              name="business_name"
              defaultValue={settings?.business_name}
              required
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" name="tagline" defaultValue={settings?.tagline} maxLength={160} />
            <p className="mt-1 text-xs text-charcoal-500">
              One short line, shown above your headline and in the footer.
            </p>
          </div>
          <div>
            <Label htmlFor="about_text">About</Label>
            <Textarea
              id="about_text"
              name="about_text"
              defaultValue={settings?.about_text}
              rows={7}
              maxLength={4000}
            />
            <p className="mt-1 text-xs text-charcoal-500">
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
              placeholder="+961 71 234 567"
            />
            <p className="mt-1 text-xs text-charcoal-500">
              Include the country code — this becomes a “Message on WhatsApp” button.
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
                placeholder="e.g. 9:00 AM - 7:00 PM, or Closed"
                defaultValue={settings?.hours?.[key]}
              />
            </div>
          ))}
          <p className="text-xs text-charcoal-500 sm:col-span-2">
            Leave every day blank to hide opening hours from your website entirely.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social links</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(
            [
              ["social_instagram", "Instagram URL", settings?.social_links?.instagram],
              ["social_facebook", "Facebook URL", settings?.social_links?.facebook],
              ["social_twitter", "Twitter / X URL", settings?.social_links?.twitter],
              ["social_tiktok", "TikTok URL", settings?.social_links?.tiktok],
              ["social_yelp", "Yelp URL", settings?.social_links?.yelp],
            ] as const
          ).map(([name, label, value]) => (
            <div key={name}>
              <Label htmlFor={name}>{label}</Label>
              <Input id={name} name={name} defaultValue={value} placeholder="https://" />
            </div>
          ))}
        </CardBody>
      </Card>

      <FormFooter isPending={isPending} error={state.error} message={state.message} />
    </form>
  );
}
