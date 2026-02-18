import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-accent",
        className,
      )}
      {...props}
    />
  );
}
