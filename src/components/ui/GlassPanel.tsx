import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GlassPanel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass-panel", className)} {...props} />;
}
