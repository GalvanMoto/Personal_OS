"use client"

import Link from "next/link"
import { useActionState } from "react"

import { SubmitButton } from "@/components/auth/submit-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signIn, type FormState } from "@/lib/auth/actions"

export function SignInForm() {
  const [state, action] = useActionState<FormState, FormData>(signIn, {})

  return (
    <form action={action}>
      <FieldGroup>
        {state.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        <Field data-invalid={Boolean(state.fieldErrors?.email) || undefined}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
          {state.fieldErrors?.email ? (
            <FieldError>{state.fieldErrors.email}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(state.fieldErrors?.password) || undefined}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          {state.fieldErrors?.password ? (
            <FieldError>{state.fieldErrors.password}</FieldError>
          ) : null}
        </Field>

        <SubmitButton>Sign in</SubmitButton>
      </FieldGroup>
    </form>
  )
}

export function SignInFooter() {
  return (
    <>
      New here?{" "}
      <Link href="/signup" className="text-foreground underline underline-offset-4">
        Create an account
      </Link>
    </>
  )
}
