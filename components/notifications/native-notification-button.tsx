"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, BellRing, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

export function NativeNotificationButton({ className }: { className?: string }) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default")
  const [isPrompting, setIsPrompting] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported")
      return
    }
    setPermission(Notification.permission)
  }, [])

  const handleToggle = async () => {
    if (permission === "unsupported") {
      try {
        toast.add({
          title: "Notifications Unsupported",
          description: "This browser or mode does not support native push notifications.",
          type: "info",
        } as unknown as Parameters<typeof toast.add>[0])
      } catch {}
      return
    }

    if (permission === "granted") {
      // Test notification
      try {
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "SHOW_NOTIFICATION",
            title: "DLRS Personal OS",
            body: "Native notifications are active and ready!",
            icon: "/icon-192.png",
          })
        } else {
          new Notification("DLRS Personal OS", {
            body: "Native notifications are active and ready!",
            icon: "/icon-192.png",
          })
        }
        toast.add({
          title: "Notifications Active",
          description: "Test notification sent to your device.",
          type: "success",
        } as unknown as Parameters<typeof toast.add>[0])
      } catch (err) {
        console.warn("Notification error", err)
      }
      return
    }

    setIsPrompting(true)
    try {
      const res = await Notification.requestPermission()
      setPermission(res)
      if (res === "granted") {
        try {
          new Notification("DLRS Personal OS", {
            body: "You will now receive alerts for tasks, emails, and briefings.",
            icon: "/icon-192.png",
          })
        } catch {}
      }
    } catch (err) {
      console.warn("Permission request error", err)
    } finally {
      setIsPrompting(false)
    }
  }

  if (permission === "unsupported") return null

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isPrompting}
      title={
        permission === "granted"
          ? "Native notifications enabled (Tap to test)"
          : "Enable native device notifications"
      }
      className={cn(
        "h-8 gap-1.5 px-2.5 text-xs font-medium rounded-full transition-all border",
        permission === "granted"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {permission === "granted" ? (
        <>
          <BellRing className="size-3.5 text-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">Alerts On</span>
        </>
      ) : permission === "denied" ? (
        <>
          <BellOff className="size-3.5 text-rose-500" />
          <span className="hidden sm:inline">Alerts Blocked</span>
        </>
      ) : (
        <>
          <Bell className="size-3.5" />
          <span>Enable Alerts</span>
        </>
      )}
    </Button>
  )
}
