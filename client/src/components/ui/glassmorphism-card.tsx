import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface GlassmorphismCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "dark" | "colored";
  hover?: boolean;
  border?: boolean;
}

const GlassmorphismCard = forwardRef<HTMLDivElement, GlassmorphismCardProps>(
  ({ className, variant = "default", hover = true, border = true, children, ...props }, ref) => {
    const baseClasses = "backdrop-filter backdrop-blur-md rounded-xl";
    
    const variants = {
      default: "bg-white/10 border-white/20",
      dark: "bg-black/20 border-white/10",
      colored: "bg-gradient-to-br from-white/10 to-transparent border-gradient-to-br from-white/30 to-transparent"
    };
    
    const hoverClasses = hover ? "hover:bg-white/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-1" : "";
    const borderClasses = border ? "border" : "";
    
    return (
      <div
        className={cn(
          baseClasses,
          variants[variant],
          borderClasses,
          hoverClasses,
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassmorphismCard.displayName = "GlassmorphismCard";

export { GlassmorphismCard };
