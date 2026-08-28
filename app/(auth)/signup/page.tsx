import { notFound, redirect } from "next/navigation"

export const metadata = {
  title: "Not Found · Personal OS",
  robots: { index: false, follow: false },
}

export default function SignupPage() {
  // Public registration is disabled — redirect directly to sign in
  redirect("/login")
}
