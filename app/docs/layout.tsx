import { DocsLayout as FumadocsLayout } from "fumadocs-ui/layouts/docs"
import { RootProvider } from "fumadocs-ui/provider/next"
import { baseOptions } from "@/lib/layout.shared"
import { source } from "@/lib/source"
import type { ReactNode } from "react"

import "./docs.css"

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      search={{
        enabled: false,
      }}
      theme={{
        enabled: false,
      }}
    >
      <FumadocsLayout {...baseOptions()} tree={source.getPageTree()} tabMode="auto">
        {children}
      </FumadocsLayout>
    </RootProvider>
  )
}
