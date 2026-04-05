import { cn } from "@/lib/utils";
import { Boxes, Sparkles } from "lucide-react";

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
        className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border"
        style={{
          borderColor: "var(--color-border)",
          background: "linear-gradient(140deg, rgba(16,185,129,0.28), rgba(6,182,212,0.22))",
          boxShadow: "0 8px 18px rgba(0, 0, 0, 0.22)",
        }}
        aria-label="Gudangku logo"
      >
        <Boxes className="h-4 w-4" style={{ color: "var(--color-text-primary)" }} />
        <Sparkles className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5" style={{ color: "var(--color-safe)" }} />
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
