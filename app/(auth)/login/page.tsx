import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { SignInFooter, SignInForm } from "@/components/auth/sign-in-form"
import { getCurrentUser } from "@/lib/auth/dal"

export const metadata = { title: "Sign in · DLRS Personal OS" }

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/")

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your workspace."
      footer={<SignInFooter />}
    >
      <SignInForm />
    </AuthShell>
  )
}
