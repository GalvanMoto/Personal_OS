import { Geist, Geist_Mono, Inter } from "next/font/google"
import Script from "next/script"

import "./globals.css"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

import { PushNotificationProvider } from "@/components/notifications/push-provider"
import { Toaster } from "@/components/ui/toast"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FSRQ8XNWYF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-FSRQ8XNWYF');
          `}
        </Script>
        <ThemeProvider>
          <Toaster>
            <TooltipProvider>
              <PushNotificationProvider>{children}</PushNotificationProvider>
            </TooltipProvider>
          </Toaster>
        </ThemeProvider>
      </body>
    </html>
  )
}
