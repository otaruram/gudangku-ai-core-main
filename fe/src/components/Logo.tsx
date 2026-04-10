import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
  showText?: boolean;
}

export function Logo({ className, variant = "dark", showText = true }: LogoProps) {
  const isLight = variant === "light";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Logo Mark */}
      <div
        className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
        aria-label="Gudangku logo"
      >
        <Package className="h-5 w-5" />
      </div>


      {showText && (
        <span className={cn(
          "text-xl font-bold tracking-tight",
          isLight ? "text-primary-foreground" : "text-foreground"
        )}>
          Gudangku
        </span>
      )}
    </div>
  );
}
