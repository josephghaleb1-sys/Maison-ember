import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/admin/login">) {
  const searchParams = await props.searchParams;
  const redirectTo = typeof searchParams.redirectTo === "string" ? searchParams.redirectTo : undefined;

  return (
    <>
      <h2 className="mb-6 text-lg font-semibold text-ink-50">Sign in</h2>
      <LoginForm redirectTo={redirectTo} />
    </>
  );
}
