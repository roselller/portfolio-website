import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function NeumorphicCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("neu-card", className)} {...props} />;
}
