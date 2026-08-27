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
import type { Metadata } from "next"

export const metadata: Metadata = {
  metadataBase: new URL("https://pos.techwithgalvan.in"),
  title: {
    default: "DLRS Personal OS — Your AI Chief-of-Staff",
    template: "%s | DLRS",
  },
  description:
    "Autonomous Personal OS for creators & operators. Capture via screenshot, email, or voice — AI extracts tasks, links Drive assets, and plans your day. PWA + Telegram + live sync, workspace-isolated.",
  keywords: ["personal OS", "AI chief of staff", "task automation", "PWA", "productivity", "DLRS"],
  authors: [{ name: "Galvan", url: "https://techwithgalvan.in" }],
  creator: "Galvan",
  publisher: "DLRS",
  robots: { index: true, follow: true, "max-image-preview": "large" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://pos.techwithgalvan.in",
    siteName: "DLRS Personal OS",
    title: "DLRS Personal OS — Your AI Chief-of-Staff",
    description: "Capture → AI extracts → links assets → plans your day. The system that actually thinks for you.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "DLRS Personal OS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DLRS Personal OS",
    description: "Autonomous inbox, asset discovery, daily copilot — PWA + live sync.",
    images: ["/og-image.png"],
    creator: "@techwithgalvan",
  },
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
  manifest: "/manifest.json",
  alternates: { canonical: "https://pos.techwithgalvan.in" },
}

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function handleChunkError(errStr) {
                  var isChunk = /Loading chunk/i.test(errStr) || /Failed to load chunk/i.test(errStr) || /ChunkLoadError/i.test(errStr) || /turbopack/i.test(errStr);
                  if (isChunk) {
                    var now = Date.now();
                    var last = parseInt(sessionStorage.getItem('chunk_retry_ts') || '0', 10);
                    if (now - last > 5000) {
                      sessionStorage.setItem('chunk_retry_ts', String(now));
                      window.location.reload();
                    }
                  }
                }

                window.addEventListener('error', function(event) {
                  var msg = (event && (event.message || (event.error && event.error.message))) || '';
                  var isScriptTag = event && event.target && event.target.tagName === 'SCRIPT' && event.target.src && event.target.src.indexOf('/_next/static/chunks/') !== -1;
                  if (isScriptTag) {
                    handleChunkError('Failed to load chunk');
                  } else if (msg) {
                    handleChunkError(msg);
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(event) {
                  var reason = (event && event.reason && (event.reason.message || event.reason.name || String(event.reason))) || '';
                  if (reason) {
                    handleChunkError(reason);
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
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
