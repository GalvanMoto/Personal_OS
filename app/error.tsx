"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Never intercept Next.js redirects or not-founds
  if (
    error.message === "NEXT_REDIRECT" ||
    error.digest?.startsWith("NEXT_REDIRECT") ||
    error.message === "NEXT_NOT_FOUND" ||
    error.digest?.startsWith("NEXT_NOT_FOUND")
  ) {
    throw error
  }

  React.useEffect(() => {
    console.error("[DLRS Error Boundary]", error)
  }, [error])

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full border-border/80 bg-card/90 backdrop-blur-xl shadow-2xl p-6 text-center space-y-4">
        <div className="size-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Something went wrong
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A temporary render exception occurred. You can retry or head back to your active dashboard.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-muted-foreground/60 pt-1">
              Error Digest: {error.digest}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => reset()}
            className="w-full sm:w-auto h-9 bg-primary text-primary-foreground gap-1.5 font-medium text-xs"
          >
            <RefreshCw className="size-3.5" />
            <span>Try Again</span>
          </Button>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full h-9 gap-1.5 text-xs font-medium">
              <Home className="size-3.5" />
              <span>Go to Dashboard</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
