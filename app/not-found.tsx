"use client"

import Link from "next/link"
import { ArrowLeft, Home, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full border-border/80 bg-card/90 backdrop-blur-xl shadow-2xl p-6 text-center space-y-4">
        <div className="size-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto text-xl font-bold font-mono">
          404
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Workspace or Page Not Found
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The workspace or resource you requested could not be found or you don&apos;t have membership access.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="sm" className="w-full h-9 bg-primary text-primary-foreground gap-1.5 font-medium text-xs">
              <Home className="size-3.5" />
              <span>Go to My Dashboard</span>
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full h-9 gap-1.5 text-xs font-medium">
              <ArrowLeft className="size-3.5" />
              <span>Home Page</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
