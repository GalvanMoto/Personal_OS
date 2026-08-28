import type { ReactNode } from "react"
import "./home.css"

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="dark bg-[#09090b] text-[#f4f4f5] min-h-screen selection:bg-[#6FFF00] selection:text-[#09090b]">
      {children}
    </div>
  )
}
