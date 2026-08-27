"use client"

import Link from "next/link"
import { useActionState } from "react"

import { SubmitButton } from "@/components/auth/submit-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signUp, type FormState } from "@/lib/auth/actions"

export function SignUpForm() {
  const [state, action] = useActionState<FormState, FormData>(signUp, {})

  return (
    <form action={action}>
      <FieldGroup>
        {state.error ? (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        <Field data-invalid={Boolean(state.fieldErrors?.name) || undefined}>
          <FieldLabel htmlFor="name">Your name</FieldLabel>
          <Input id="name" name="name" autoComplete="name" placeholder="Gautam" required />
          {state.fieldErrors?.name ? (
            <FieldError>{state.fieldErrors.name}</FieldError>
          ) : null}
        </Field>

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
            autoComplete="new-password"
            required
          />
          <FieldDescription>At least 10 characters.</FieldDescription>
          {state.fieldErrors?.password ? (
            <FieldError>{state.fieldErrors.password}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(state.fieldErrors?.workspace) || undefined}>
          <FieldLabel htmlFor="workspace">Workspace</FieldLabel>
          <Input id="workspace" name="workspace" placeholder="Studio" required />
          <FieldDescription>
            Your first workspace. You can create more later.
          </FieldDescription>
          {state.fieldErrors?.workspace ? (
            <FieldError>{state.fieldErrors.workspace}</FieldError>
          ) : null}
        </Field>

        <SubmitButton>Create account</SubmitButton>
      </FieldGroup>
    </form>
  )
}

export function SignUpFooter() {
  return (
    <>
      Already have an account?{" "}
      <Link href="/login" className="text-foreground underline underline-offset-4">
        Sign in
      </Link>
    </>
  )
}
