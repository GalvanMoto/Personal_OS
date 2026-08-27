"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import {
  Bot,
  Calendar,
  CheckSquare,
  CreditCard,
  FileText,
  Inbox,
  Layers,
  LayoutDashboard,
  Lock,
  Mail,
  Menu,
  Sparkles,
} from "lucide-react"

import { AssistantPanel } from "@/components/assistant/assistant-panel"
import { NativeNotificationButton } from "@/components/notifications/native-notification-button"
import { ActivityCenterDrawer } from "@/components/activity/activity-center-drawer"
import { useShell } from "@/components/dashboard/shell-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export function MobileChatShell({
  children,
  workspace,
}: {
  children: React.ReactNode
  workspace: string
}) {
  const pathname = usePathname()
  const shell = useShell()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [mode, setMode] = useState<"chat" | "page">("chat")

  const navItems = [
    { label: "AI Chief-of-Staff", href: `/w/${workspace}/assistant`, icon: Bot, isChat: true },
    { label: "Dashboard", href: `/w/${workspace}/dashboard`, icon: LayoutDashboard },
    { label: "Today & Tasks", href: `/w/${workspace}/today`, icon: CheckSquare, badge: shell.badges.tasks },
    { label: "Universal Inbox", href: `/w/${workspace}/inbox`, icon: Inbox, badge: shell.badges.inbox },
    { label: "Recurring Commitments", href: `/w/${workspace}/commitments`, icon: Layers },
    { label: "Email & Newsletters", href: `/w/${workspace}/email`, icon: Mail },
    { label: "Finance & Accounts", href: `/w/${workspace}/finance`, icon: CreditCard },
    { label: "Calendar", href: `/w/${workspace}/calendar`, icon: Calendar },
    { label: "Files & Documents", href: `/w/${workspace}/files`, icon: FileText },
    { label: "Statement Vault", href: `/w/${workspace}/settings/vault`, icon: Lock },
  ]

  return (
    <div className="flex h-svh w-full flex-col overflow-hidden bg-background">
      {/* Top Mobile Header */}
      <header className="flex h-13 shrink-0 items-center justify-between border-b px-3.5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-20">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm text-white font-bold text-xs">
            OS
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs leading-none">DLRS Assistant</span>
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <span className="text-[0.625rem] text-muted-foreground leading-tight">
              {workspace} • Chief-of-Staff
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Live agent activity center */}
          <ActivityCenterDrawer />

          {/* Native Notification Bell & Permission Switch */}
          <NativeNotificationButton />

          {/* Navigation Menu Trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpenDrawer(true)}
            className="size-8 rounded-full"
          >
            <Menu className="size-4" />
            <span className="sr-only">Open navigation menu</span>
          </Button>

          {/* Navigation Sheet for other modules */}
          <Sheet open={openDrawer} onOpenChange={setOpenDrawer}>
            <SheetContent side="right" className="w-[80vw] max-w-xs p-0 flex flex-col">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-left text-sm flex items-center gap-2">
                  <Sparkles className="size-4 text-indigo-500" />
                  Personal OS Modules
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = pathname === item.href || (item.isChat && mode === "chat")
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        setOpenDrawer(false)
                        if (item.isChat) {
                          setMode("chat")
                        } else {
                          setMode("page")
                          window.location.href = item.href
                        }
                      }}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left",
                        active
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {typeof item.badge === "number" && item.badge > 0 && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 text-[0.625rem] rounded-full font-bold",
                            active
                              ? "bg-primary-foreground text-primary"
                              : "bg-muted-foreground/20 text-foreground"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="p-3 border-t bg-muted/20 text-[0.6875rem] text-muted-foreground text-center">
                Signed in as {shell.user.email || shell.user.name}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main View Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {mode === "chat" ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <AssistantPanel workspace={workspace} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
