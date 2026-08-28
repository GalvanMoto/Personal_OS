import type { Root } from "fumadocs-core/page-tree"

export const pageTree: Root = {
  name: "DLRS Docs",
  children: [
    {
      type: "page",
      name: "Introduction",
      url: "/docs",
    },
    {
      type: "folder",
      name: "Getting Started",
      defaultOpen: true,
      children: [
        {
          type: "page",
          name: "Installation",
          url: "/docs/installation",
        },
        {
          type: "page",
          name: "Quick Start",
          url: "/docs/quick-start",
        },
        {
          type: "page",
          name: "Architecture",
          url: "/docs/architecture",
        },
      ],
    },
    {
      type: "folder",
      name: "Features",
      defaultOpen: true,
      children: [
        {
          type: "page",
          name: "Universal Inbox",
          url: "/docs/features/inbox",
        },
        {
          type: "page",
          name: "Tasks & Work",
          url: "/docs/features/tasks",
        },
        {
          type: "page",
          name: "Automations",
          url: "/docs/features/automations",
        },
        {
          type: "page",
          name: "Finance & Statements",
          url: "/docs/features/finance",
        },
        {
          type: "page",
          name: "Calendar & Planning",
          url: "/docs/features/calendar",
        },
        {
          type: "page",
          name: "Daily Journals",
          url: "/docs/features/journal",
        },
        {
          type: "page",
          name: "Files & Documents",
          url: "/docs/features/files",
        },
      ],
    },
    {
      type: "folder",
      name: "Agents",
      children: [
        {
          type: "page",
          name: "Agent System",
          url: "/docs/agents",
        },
        {
          type: "page",
          name: "Orchestrator",
          url: "/docs/agents/orchestrator",
        },
      ],
    },
    {
      type: "folder",
      name: "Integrations",
      defaultOpen: true,
      children: [
        {
          type: "page",
          name: "Gmail",
          url: "/docs/integrations/gmail",
        },
        {
          type: "page",
          name: "Google Drive",
          url: "/docs/integrations/drive",
        },
        {
          type: "page",
          name: "Google Calendar",
          url: "/docs/integrations/calendar",
        },
      ],
    },
    {
      type: "folder",
      name: "Reference",
      children: [
        {
          type: "page",
          name: "API Reference",
          url: "/docs/api",
        },
        {
          type: "page",
          name: "Database & Security",
          url: "/docs/security",
        },
        {
          type: "page",
          name: "Changelog",
          url: "/docs/changelog",
        },
      ],
    },
  ],
}

// Minimal source API mimicking fumadocs-core loader
// Provides getPageTree() for GlassLayout and helpers for future MDX expansion.
export const source = {
  getPageTree(locale?: string) {
    void locale
    return pageTree
  },
  // For future mdx pages: returns null currently since we use filesystem routes.
  getPage(slugs?: string[]) {
    void slugs
    return null
  },
  // Generate static params for catch-all routes if needed.
  generateParams() {
    const params: { slug?: string[] }[] = []
    const walk = (nodes: typeof pageTree.children, prefix: string[] = []) => {
      for (const node of nodes) {
        if (node.type === "page") {
          const url = (node as { url: string }).url.replace(/^\/docs\/?/, "")
          const slugs = url ? url.split("/") : []
          params.push({ slug: slugs.length ? slugs : undefined })
        } else if (node.type === "folder" && node.children) {
          walk(node.children as typeof pageTree.children, prefix)
        }
      }
    }
    walk(pageTree.children)
    return params
  },
}
