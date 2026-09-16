"use client";

import { useActionState } from "react";
import type { Business } from "@/lib/database.types";
import type { FormState } from "@/lib/actions/auth";
import { updateBusinessSettings } from "@/lib/actions/business-settings";
import { BUSINESS_TYPE_OPTIONS } from "@/lib/business-types";
import { Input, Label } from "@/components/ui/input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { FormFooter } from "@/components/admin/form-footer";

const initialState: FormState = {};

export function BusinessSettingsForm({
  business,
  canManage,
}: {
  business: Business;
  canManage: boolean;
}) {
  const [state, formAction, isPending] = useActionState(updateBusinessSettings, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business type</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="business_type">Industry</Label>
            <select
              id="business_type"
              name="business_type"
              defaultValue={business.business_type}
              disabled={!canManage}
              className="h-10 w-full rounded-lg border border-charcoal-700 bg-charcoal-900 px-3 text-sm text-cream-50 focus:border-accent-500 focus:outline-none disabled:opacity-50"
            >
              {BUSINESS_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-charcoal-500">
              Changes the wording across your site and the address of your catalog page —
              a restaurant gets <code className="text-charcoal-300">/menu</code>, a shop gets{" "}
              <code className="text-charcoal-300">/shop</code>, a salon gets{" "}
              <code className="text-charcoal-300">/services</code>.
            </p>
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              name="currency"
              defaultValue={business.currency}
              maxLength={3}
              disabled={!canManage}
              className="w-32 font-mono uppercase"
            />
            <p className="mt-1.5 text-xs text-charcoal-500">
              Three-letter code (USD, EUR, GBP, LBP). Used to format every price on your site.
            </p>
          </div>
        </CardBody>
      </Card>

      {canManage ? (
        <FormFooter isPending={isPending} error={state.error} message={state.message} />
      ) : (
        <p className="text-sm text-charcoal-400">
          Your role can view these settings but not change them.
        </p>
      )}
    </form>
  );
}
