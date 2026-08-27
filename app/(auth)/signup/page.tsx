import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { SignUpFooter, SignUpForm } from "@/components/auth/sign-up-form"
import { getCurrentUser } from "@/lib/auth/dal"

export const metadata = { title: "Create account · DLRS Personal OS", robots: { index: false, follow: false } }

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/")

  return (
    <AuthShell
      title="Create your account"
      description="One place for everything you are working on."
      footer={<SignUpFooter />}
    >
      <SignUpForm />
    </AuthShell>
  )
}
