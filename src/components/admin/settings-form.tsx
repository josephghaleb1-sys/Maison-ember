"use client";

import { useActionState, useState } from "react";
import { X } from "lucide-react";
import type { WebsiteSettings } from "@/lib/database.types";
import type { FormState } from "@/lib/actions/auth";
import { updateSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Thumb } from "@/components/admin/thumb";
import { compressImageFile } from "@/lib/image-compress";

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

function ImageField({
  name,
  label,
  currentPath,
  hint,
}: {
  name: "logo" | "hero";
  label: string;
  currentPath: string | null;
  hint: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  return (
    <div>
      <Label htmlFor={`${name}_image`}>{label}</Label>
      <div className="flex items-center gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Selected preview" className="size-16 rounded-lg object-cover" />
        ) : (
          !remove && <Thumb path={currentPath} alt={label} size={64} />
        )}
        <div className="flex-1">
          <input
            id={`${name}_image`}
            name={`${name}_image`}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="block w-full text-sm text-charcoal-600 file:mr-3 file:rounded-lg file:border-0 file:bg-charcoal-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-charcoal-700 hover:file:bg-charcoal-200"
            onChange={async (e) => {
              const input = e.target;
              const file = input.files?.[0];
              setRemove(false);
              if (!file) {
                setPreview(null);
                return;
              }
              setPreview(URL.createObjectURL(file));
              setIsCompressing(true);
              const compressed = await compressImageFile(file, {
                maxDimension: name === "hero" ? 2000 : 800,
              });
              setIsCompressing(false);
              if (compressed !== file) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(compressed);
                input.files = dataTransfer.files;
              }
            }}
          />
          <p className="mt-1 text-xs text-charcoal-400">{isCompressing ? "Optimizing image…" : hint}</p>
        </div>
      </div>
      {currentPath && !preview && (
        <label className="mt-2 flex items-center gap-2 text-sm text-charcoal-600">
          <input
            type="checkbox"
            name={`remove_${name}_image`}
            checked={remove}
            onChange={(e) => setRemove(e.target.checked)}
            className="rounded border-charcoal-300"
          />
          <X className="size-3.5" aria-hidden /> Remove current image
        </label>
      )}
    </div>
  );
}

export function SettingsForm({ settings }: { settings: WebsiteSettings | null }) {
  const [state, formAction, isPending] = useActionState(updateSettings, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business info</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="business_name">Business name</Label>
            <Input id="business_name" name="business_name" defaultValue={settings?.business_name} required />
          </div>
          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" name="tagline" defaultValue={settings?.tagline} maxLength={160} />
          </div>
          <div>
            <Label htmlFor="about_text">About</Label>
            <Textarea id="about_text" name="about_text" defaultValue={settings?.about_text} rows={6} />
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
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={settings?.email} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={settings?.address} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hours</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {DAYS.map(([key, label]) => (
            <div key={key}>
              <Label htmlFor={`hours_${key}`}>{label}</Label>
              <Input
                id={`hours_${key}`}
                name={`hours_${key}`}
                placeholder="e.g. 5:00 PM - 10:00 PM, or Closed"
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
          <div>
            <Label htmlFor="social_instagram">Instagram URL</Label>
            <Input id="social_instagram" name="social_instagram" defaultValue={settings?.social_links?.instagram} />
          </div>
          <div>
            <Label htmlFor="social_facebook">Facebook URL</Label>
            <Input id="social_facebook" name="social_facebook" defaultValue={settings?.social_links?.facebook} />
          </div>
          <div>
            <Label htmlFor="social_twitter">Twitter / X URL</Label>
            <Input id="social_twitter" name="social_twitter" defaultValue={settings?.social_links?.twitter} />
          </div>
          <div>
            <Label htmlFor="social_tiktok">TikTok URL</Label>
            <Input id="social_tiktok" name="social_tiktok" defaultValue={settings?.social_links?.tiktok} />
          </div>
          <div>
            <Label htmlFor="social_yelp">Yelp URL</Label>
            <Input id="social_yelp" name="social_yelp" defaultValue={settings?.social_links?.yelp} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding images</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          <ImageField
            name="logo"
            label="Logo"
            currentPath={settings?.logo_path ?? null}
            hint="Square image works best. Max 5MB."
          />
          <ImageField
            name="hero"
            label="Homepage hero image"
            currentPath={settings?.hero_image_path ?? null}
            hint="Wide image, at least 1600px, works best. Max 5MB."
          />
        </CardBody>
      </Card>

      <FieldError>{state.error}</FieldError>

      <div className="sticky bottom-16 flex items-center gap-3 rounded-xl border border-charcoal-100 bg-white/95 p-4 backdrop-blur md:bottom-0">
        <Button type="submit" loading={isPending}>
          Save changes
        </Button>
        {state.message && <p className="text-sm text-green-700">{state.message}</p>}
      </div>
    </form>
  );
}
