"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Globe, Star, Trash2 } from "lucide-react";
import type { BusinessDomain } from "@/lib/database.types";
import { addDomain, removeDomain, setPrimaryDomain } from "@/lib/actions/domains";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * Connect a customer's own domain. Adding the hostname here is what makes
 * requests to it resolve to this business; DNS + the hosting provider's
 * domain settings are the other half (documented in the README).
 */
export function DomainManager({ domains }: { domains: BusinessDomain[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addDomain(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      toast.success("Domain connected.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {domains.length > 0 && (
        <ul className="divide-y divide-ink-800">
          {domains.map((domain) => (
            <li key={domain.id} className="flex items-center gap-3 py-3 first:pt-0">
              <Globe className="size-4 shrink-0 text-ink-500" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm text-ink-100">
                {domain.hostname}
              </span>
              {domain.is_primary ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
                  <Star className="size-3" aria-hidden /> Primary
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    startTransition(async () => {
                      const result = await setPrimaryDomain(domain.id);
                      if (result.error) toast.error(result.error);
                      else router.refresh();
                    })
                  }
                  disabled={isPending}
                  className="rounded-full border border-ink-700 px-2.5 py-1 text-xs font-medium text-ink-300 transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
                >
                  Make primary
                </button>
              )}
              <ConfirmDialog
                title="Remove this domain?"
                description={`Visitors reaching ${domain.hostname} will no longer see this website.`}
                confirmLabel="Remove"
                successMessage="Domain removed."
                action={() => removeDomain(domain.id)}
                trigger={
                  <button
                    type="button"
                    aria-label={`Remove ${domain.hostname}`}
                    className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-800 hover:text-red-400"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                }
              />
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="hostname">Add a domain</Label>
          <Input
            id="hostname"
            name="hostname"
            placeholder="mybusiness.com"
            autoComplete="off"
            spellCheck={false}
            required
          />
          <p className="mt-1 text-xs text-ink-500">
            Hostname only — no https:// and no trailing slash. Add both{" "}
            <code className="text-ink-300">example.com</code> and{" "}
            <code className="text-ink-300">www.example.com</code> if you use both.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-200">
          <input type="checkbox" name="is_primary" className="rounded border-ink-600" />
          Use as the primary address (for links shared on social media)
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" size="sm" loading={isPending}>
          Connect domain
        </Button>
      </form>
    </div>
  );
}
