import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassmorphismCardProps {
  children: ReactNode;
  className?: string;
  blur?: "sm" | "md" | "lg";
  opacity?: "low" | "medium" | "high";
}

export function GlassmorphismCard({ 
  children, 
  className, 
  blur = "md", 
  opacity = "medium" 
}: GlassmorphismCardProps) {
  const blurClasses = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg"
  };

  const opacityClasses = {
    low: "bg-white/5 border-white/10",
    medium: "bg-white/10 border-white/20",
    high: "bg-white/20 border-white/30"
  };

  return (
    <div className={cn(
      "rounded-xl border",
      blurClasses[blur],
      opacityClasses[opacity],
      "shadow-xl shadow-cosmic-purple/20",
      "transition-all duration-300 hover:shadow-cosmic-purple/30",
      className
    )}>
      {children}
    </div>
  );
}