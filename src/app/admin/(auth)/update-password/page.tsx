import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/admin/update-password-form";

export const metadata: Metadata = { title: "Set new password" };

export default function UpdatePasswordPage() {
  return (
    <>
      <h2 className="mb-6 text-lg font-semibold text-cream-50">Set a new password</h2>
      <UpdatePasswordForm />
    </>
  );
}
