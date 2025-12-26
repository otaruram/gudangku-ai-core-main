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
      {/* Logo Mark - Minimalist warehouse box with AI core */}
      <div className="relative">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 hover:scale-105"
        >
          {/* Outer box */}
          <rect
            x="4"
            y="8"
            width="24"
            height="20"
            rx="2"
            stroke={isLight ? "white" : "black"}
            strokeWidth="2"
            fill="none"
          />
          {/* Roof */}
          <path
            d="M4 10L16 4L28 10"
            stroke={isLight ? "white" : "black"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* AI Core - Emerald dot */}
          <circle
            cx="16"
            cy="18"
            r="4"
            className="fill-accent animate-pulse-slow"
          />
          {/* Inner glow effect */}
          <circle
            cx="16"
            cy="18"
            r="2"
            className="fill-accent-foreground"
          />
        </svg>
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
