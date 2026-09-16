"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type FormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";

const initialState: FormState = {};

export function ResetPasswordForm() {
  const [state, action, isPending] = useActionState(requestPasswordReset, initialState);

  if (state.message) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-charcoal-200">{state.message}</p>
        <Link href="/admin/login" className="text-sm font-medium text-accent-400 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-charcoal-400">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" className="w-full" loading={isPending}>
        Send reset link
      </Button>
      <Link
        href="/admin/login"
        className="block text-center text-sm font-medium text-charcoal-400 hover:text-charcoal-200"
      >
        Back to sign in
      </Link>
    </form>
  );
}
