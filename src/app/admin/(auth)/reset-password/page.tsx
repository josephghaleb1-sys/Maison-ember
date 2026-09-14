import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <>
      <h2 className="mb-6 text-lg font-semibold text-ink-50">Reset your password</h2>
      <ResetPasswordForm />
    </>
  );
}
