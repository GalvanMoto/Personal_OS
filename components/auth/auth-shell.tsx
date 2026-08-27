import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/landing/theme-toggle"

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-muted/20 p-4 sm:p-6 overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-gradient-to-tr from-indigo-500/15 via-violet-500/15 to-cyan-400/15 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Top Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Home</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Main Card */}
      <div className="flex w-full max-w-sm flex-col gap-4 mx-auto my-auto">
        <Link href="/" className="flex items-center gap-2.5 self-center group">
          <Image
            src="/logo.png"
            alt="Personal OS Logo"
            width={36}
            height={36}
            className="size-9 rounded-xl object-contain shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform"
            priority
          />
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg tracking-tight text-foreground">DLRS</span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono h-4 bg-muted/50 border-border/80">
              OS v2.0
            </Badge>
          </div>
        </Link>

        <Card className="border border-border/80 bg-card/90 backdrop-blur-xl shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight">{title}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>

        {footer ? (
          <p className="text-center text-xs text-muted-foreground">{footer}</p>
        ) : null}
      </div>

      {/* Bottom Footer */}
      <div className="w-full text-center py-3 text-[11px] text-muted-foreground">
        <span suppressHydrationWarning>© {new Date().getFullYear()} DLRS OS. Secure tenant-isolated workspace.</span>
      </div>
    </div>
  )
}
