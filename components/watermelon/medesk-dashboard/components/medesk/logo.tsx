import type { HTMLAttributes } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function MedeskLogo({ className }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-md shadow-indigo-500/20",
        className,
      )}
    >
      <Image
        src="/logo.png"
        alt="Logo"
        width={32}
        height={32}
        className="size-full object-contain"
      />
    </div>
  );
}
