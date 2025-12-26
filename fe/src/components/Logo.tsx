import { cn } from "@/lib/utils";

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
      <div className="relative">
        <img src="/1.png" alt="Logo" className="w-8 h-8 rounded-md" />
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
