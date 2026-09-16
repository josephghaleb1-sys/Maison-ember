"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Globe, Star, Trash2 } from "lucide-react";
import type { BusinessDomain } from "@/lib/database.types";
import type { FormState } from "@/lib/actions/auth";
import { addDomain, removeDomain, setPrimaryDomain } from "@/lib/actions/business-settings";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";

const initialState: FormState = {};

/**
 * Connects custom domains to this business. Adding a row here is what makes
 * the deployment serve this business's site for that hostname — pointing DNS
 * at the host is the separate, manual half of the job.
 */
export function DomainManager({
  domains,
  canManage,
}: {
  domains: BusinessDomain[];
  canManage: boolean;
}) {
  const [state, formAction, isPending] = useActionState(addDomain, initialState);
  const [isBusy, startTransition] = useTransition();
  const router = useRouter();

  function makePrimary(id: string) {
    startTransition(async () => {
      const result = await setPrimaryDomain(id);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Primary domain updated.");
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom domains</CardTitle>
      </CardHeader>
      <CardBody className="space-y-5">
        {domains.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="No domains connected"
            description="Your site is served from this deployment's default address. Add a domain to publish it on your own web address."
          />
        ) : (
          <ul className="divide-y divide-charcoal-800">
            {domains.map((domain) => (
              <li key={domain.id} className="flex flex-wrap items-center gap-3 py-3">
                <Globe className="size-4 shrink-0 text-charcoal-500" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-cream-50">
                  {domain.hostname}
                </span>
                {domain.is_primary && <Badge variant="success">Primary</Badge>}
                {canManage && (
                  <div className="flex items-center gap-2">
                    {!domain.is_primary && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => makePrimary(domain.id)}
                      >
                        <Star className="size-4" aria-hidden /> Make primary
                      </Button>
                    )}
                    <ConfirmDialog
                      trigger={
                        <Button variant="outline" size="sm" aria-label={`Remove ${domain.hostname}`}>
                          <Trash2 className="size-4 text-red-500" aria-hidden />
                        </Button>
                      }
                      title="Remove this domain?"
                      description={`${domain.hostname} will stop serving this business's website. DNS is not changed — you'll also want to remove it from your hosting project.`}
                      confirmLabel="Remove"
                      action={() => removeDomain(domain.id)}
                      successMessage="Domain removed."
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {canManage && (
          <form action={formAction} className="border-t border-charcoal-800 pt-5">
            <Label htmlFor="hostname">Add a domain</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="hostname"
                name="hostname"
                placeholder="example.com"
                spellCheck={false}
                autoCapitalize="none"
                className="flex-1"
              />
              <Button type="submit" loading={isPending}>
                Add domain
              </Button>
            </div>
            {state.error && <p className="mt-2 text-sm text-red-400">{state.error}</p>}
            {state.message && <p className="mt-2 text-sm text-green-500">{state.message}</p>}
            <p className="mt-2 text-xs text-charcoal-500">
              Add the same domain to your hosting project and point its DNS there. Until both are
              done, the domain won&apos;t resolve to your site.
            </p>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
