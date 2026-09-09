"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type FormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";

const initialState: FormState = {};

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, action, isPending] = useActionState(signIn, initialState);

  return (
    <form action={action} className="space-y-4">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/admin/reset-password" className="text-xs font-medium text-ember-400 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" className="w-full" loading={isPending}>
        Sign in
      </Button>
    </form>
  );
}
