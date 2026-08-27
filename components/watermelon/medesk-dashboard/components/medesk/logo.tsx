import type { SVGProps } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function MedeskLogo({ className }: SVGProps<SVGSVGElement>) {
  return (
    <div
      className={cn(
        "flex size-8 items-center justify-center rounded-xl bg-linear-to-tr from-indigo-600 via-violet-600 to-cyan-400 text-white shadow-md shadow-indigo-500/20",
        className,
      )}
    >
      <Sparkles className="size-4" />
    </div>
  );
}
