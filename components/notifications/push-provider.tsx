"use client"

import { useEffect } from "react"

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Service worker registered
        })
        .catch((err) => {
          console.warn("ServiceWorker registration failed", err)
        })
    }
  }, [])

  return <>{children}</>
}
