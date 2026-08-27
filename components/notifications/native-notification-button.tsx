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
    if (typeof window === "undefined") return

    // Special guidance for iOS Safari where Web Push requires Add to Home Screen
    if (!("Notification" in window)) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      try {
        toast.add({
          title: isIOS ? "Enable on iPhone / iPad" : "Notifications Unsupported",
          description: isIOS
            ? "Tap Share (⬆️) → 'Add to Home Screen', open DLRS from your home screen, then tap Enable Alerts."
            : "Your current browser does not support native push notifications.",
          type: "info",
        } as unknown as Parameters<typeof toast.add>[0])
      } catch {}
      return
    }

    if (permission === "granted") {
      // Test notification dispatch
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready
          if (reg && reg.showNotification) {
            await reg.showNotification("DLRS Personal OS", {
              body: "Native notifications are active and ready!",
              icon: "/icon-192.png",
              badge: "/icon-192.png",
              tag: "dlrs-test",
            })
          } else {
            new Notification("DLRS Personal OS", {
              body: "Native notifications are active and ready!",
              icon: "/icon-192.png",
            })
          }
        } else {
          new Notification("DLRS Personal OS", {
            body: "Native notifications are active and ready!",
            icon: "/icon-192.png",
          })
        }
        toast.add({
          title: "Alerts Active",
          description: "Test notification dispatched to your device.",
          type: "success",
        } as unknown as Parameters<typeof toast.add>[0])
      } catch (err) {
        console.warn("Notification dispatch failed", err)
      }
      return
    }

    if (permission === "denied") {
      try {
        toast.add({
          title: "Notifications Blocked",
          description: "Please allow notifications in your browser or site settings (tap the lock icon in the URL bar).",
          type: "info",
        } as unknown as Parameters<typeof toast.add>[0])
      } catch {}
      return
    }

    setIsPrompting(true)
    try {
      let result: NotificationPermission = "default"

      // Handle both modern Promise-based and legacy callback-based requestPermission
      if (typeof Notification.requestPermission === "function") {
        try {
          const p = Notification.requestPermission((res) => {
            if (res) {
              result = res
              setPermission(res)
            }
          })
          if (p && typeof p.then === "function") {
            result = await p
          }
        } catch {
          result = Notification.permission
        }
      }

      setPermission(result)

      if (result === "granted") {
        try {
          if ("serviceWorker" in navigator) {
            const reg = await navigator.serviceWorker.ready
            if (reg && reg.showNotification) {
              await reg.showNotification("DLRS Personal OS", {
                body: "Native alerts enabled! You will receive updates for tasks and briefings.",
                icon: "/icon-192.png",
                badge: "/icon-192.png",
              })
            } else {
              new Notification("DLRS Personal OS", {
                body: "Native alerts enabled! You will receive updates for tasks and briefings.",
                icon: "/icon-192.png",
              })
            }
          } else {
            new Notification("DLRS Personal OS", {
              body: "Native alerts enabled! You will receive updates for tasks and briefings.",
              icon: "/icon-192.png",
            })
          }
          toast.add({
            title: "Alerts Enabled",
            description: "Native notifications are now active on your device.",
            type: "success",
          } as unknown as Parameters<typeof toast.add>[0])
        } catch {}
      } else if (result === "denied") {
        toast.add({
          title: "Permission Denied",
          description: "Notifications were declined. You can enable them anytime from browser settings.",
          type: "info",
        } as unknown as Parameters<typeof toast.add>[0])
      }
    } catch (err) {
      console.warn("Permission request error", err)
    } finally {
      setIsPrompting(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isPrompting}
      title={
        permission === "granted"
          ? "Native alerts active (Tap to send test alert)"
          : permission === "denied"
          ? "Alerts blocked in browser settings"
          : "Tap to enable native device alerts"
      }
      className={cn(
        "h-8 gap-1.5 px-2 text-xs font-medium rounded-full transition-all border shrink-0",
        permission === "granted"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : permission === "denied"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
          : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {permission === "granted" ? (
        <>
          <BellRing className="size-3.5 text-emerald-500 animate-pulse" />
          <span className="hidden xs:inline sm:inline text-[0.6875rem]">Alerts On</span>
        </>
      ) : permission === "denied" ? (
        <>
          <BellOff className="size-3.5 text-rose-500" />
          <span className="hidden xs:inline sm:inline text-[0.6875rem]">Blocked</span>
        </>
      ) : (
        <>
          <Bell className="size-3.5 text-indigo-500" />
          <span className="text-[0.6875rem]">Enable Alerts</span>
        </>
      )}
    </Button>
  )
}
