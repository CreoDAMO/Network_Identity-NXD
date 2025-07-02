import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cosmic-purple focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";
    
    const variants = {
      primary: "bg-gradient-to-r from-cosmic-purple to-nebula-blue text-white hover:shadow-lg hover:shadow-cosmic-purple/25",
      secondary: "bg-gradient-to-r from-starlight-pink to-solar-orange text-white hover:shadow-lg hover:shadow-starlight-pink/25",
      outline: "border-2 border-transparent bg-gradient-to-r from-cosmic-purple to-nebula-blue bg-clip-border text-transparent bg-gradient-to-r from-cosmic-purple to-nebula-blue bg-clip-text hover:bg-clip-padding hover:text-white"
    };
    
    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg"
    };
    
    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GradientButton.displayName = "GradientButton";

export { GradientButton };
