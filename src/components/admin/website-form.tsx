"use client";

import { useActionState, useState } from "react";
import type { WebsiteSettings } from "@/lib/database.types";
import type { FormState } from "@/lib/actions/auth";
import { updateWebsite } from "@/lib/actions/website";
import { DEFAULT_PRIMARY, DEFAULT_SECONDARY, safeHex } from "@/lib/theme";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorField } from "@/components/admin/color-field";
import { ThemePreview } from "@/components/admin/theme-preview";
import { ImageField } from "@/components/admin/image-field";
import { FormFooter } from "@/components/admin/form-footer";

const initialState: FormState = {};

export function WebsiteForm({
  settings,
  businessName,
}: {
  settings: WebsiteSettings | null;
  businessName: string;
}) {
  const [state, formAction, isPending] = useActionState(updateWebsite, initialState);

  // Mirrored in state purely so the preview updates as the colors change; the
  // form still submits the input values themselves.
  const [primary, setPrimary] = useState(safeHex(settings?.primary_color, DEFAULT_PRIMARY));
  const [secondary, setSecondary] = useState(
    safeHex(settings?.secondary_color, DEFAULT_SECONDARY),
  );

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand colors</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <ColorField
              name="primary_color"
              label="Primary color"
              hint="Buttons, links, headings accents."
              defaultValue={primary}
              onChange={setPrimary}
            />
            <ColorField
              name="secondary_color"
              label="Secondary color"
              hint="Your site's background. Every surface, border and text tone is derived from it."
              defaultValue={secondary}
              onChange={setSecondary}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-charcoal-200">Live preview</p>
            <ThemePreview primary={primary} secondary={secondary} businessName={businessName} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Homepage hero</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="hero_title">Hero title</Label>
            <Input
              id="hero_title"
              name="hero_title"
              defaultValue={settings?.hero_title}
              maxLength={120}
              placeholder={businessName}
            />
            <p className="mt-1 text-xs text-charcoal-500">
              The big headline. Leave blank to use your business name.
            </p>
          </div>
          <div>
            <Label htmlFor="hero_subtitle">Hero description</Label>
            <Textarea
              id="hero_subtitle"
              name="hero_subtitle"
              defaultValue={settings?.hero_subtitle}
              rows={3}
              maxLength={280}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo &amp; hero image</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          <ImageField
            name="logo"
            label="Logo"
            currentPath={settings?.logo_path ?? null}
            hint="Square image works best. Max 5MB."
            maxDimension={800}
          />
          <ImageField
            name="hero"
            label="Homepage hero image"
            currentPath={settings?.hero_image_path ?? null}
            hint="Wide image, at least 1600px. Max 5MB. Without one, a branded pattern is shown instead."
            maxDimension={2000}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search engines (SEO)</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="seo_title">SEO title</Label>
            <Input
              id="seo_title"
              name="seo_title"
              defaultValue={settings?.seo_title}
              maxLength={160}
              placeholder={businessName}
            />
            <p className="mt-1 text-xs text-charcoal-500">
              Shown as the clickable headline in Google. Around 60 characters reads best.
            </p>
          </div>
          <div>
            <Label htmlFor="seo_description">SEO description</Label>
            <Textarea
              id="seo_description"
              name="seo_description"
              defaultValue={settings?.seo_description}
              rows={3}
              maxLength={320}
            />
            <p className="mt-1 text-xs text-charcoal-500">
              The grey summary under your link in search results. Aim for 150–160 characters.
            </p>
          </div>
        </CardBody>
      </Card>

      <FormFooter isPending={isPending} error={state.error} message={state.message} />
    </form>
  );
}
