"use client"

import { useActionState } from "react"

import { SubmitButton } from "@/components/auth/submit-button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createWorkspace, type FormState } from "@/lib/auth/actions"

export function CreateWorkspaceForm() {
  const [state, action] = useActionState<FormState, FormData>(createWorkspace, {})

  return (
    <form action={action}>
      <FieldGroup>
        <Field data-invalid={Boolean(state.fieldErrors?.name) || undefined}>
          <FieldLabel htmlFor="name">Workspace name</FieldLabel>
          <Input id="name" name="name" placeholder="Studio" required autoFocus />
          {state.fieldErrors?.name ? (
            <FieldError>{state.fieldErrors.name}</FieldError>
          ) : null}
        </Field>
        <SubmitButton>Create workspace</SubmitButton>
      </FieldGroup>
    </form>
  )
}
