import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2.5" suppressHydrationWarning>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="DLRS"
            width={28}
            height={28}
            className="size-7 rounded-lg object-contain border border-fd-border bg-fd-card shadow-sm"
            suppressHydrationWarning
          />
          <span className="font-semibold tracking-tight">
            DLRS <span className="font-normal text-fd-muted-foreground hidden sm:inline">Personal OS</span>
          </span>
        </span>
      ),
      url: "/",
      transparentMode: "top",
    },
    githubUrl: "https://github.com/GalvanMoto/Personal_OS",
    links: [
      {
        text: "Documentation",
        url: "/docs",
        active: "nested-url",
      },
      {
        text: "Changelog",
        url: "/docs/changelog",
        active: "nested-url",
      },
      {
        text: "Dashboard",
        url: "/dashboard",
        active: "url",
      },
      {
        type: "icon",
        url: "https://pos.techwithgalvan.in",
        text: "Live Site",
        label: "Live Site",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19Zm0 2a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm1.5 3.5L8.5 12l5 4v-8Z"
              fill="currentColor"
            />
          </svg>
        ),
        external: true,
      },
    ],
  }
}

export function homeOptions(): BaseLayoutProps {
  return {
    ...baseOptions(),
    nav: {
      ...baseOptions().nav,
      transparentMode: "top",
    },
  }
}
