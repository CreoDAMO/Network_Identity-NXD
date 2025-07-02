import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GradientButtonProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "cosmic" | "nebula" | "meteor" | "solar";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function GradientButton({ 
  children, 
  className, 
  size = "md", 
  variant = "cosmic",
  onClick,
  disabled = false,
  type = "button"
}: GradientButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  const variantClasses = {
    cosmic: "bg-gradient-to-r from-cosmic-purple to-nebula-blue hover:from-cosmic-purple/80 hover:to-nebula-blue/80",
    nebula: "bg-gradient-to-r from-nebula-blue to-starlight-pink hover:from-nebula-blue/80 hover:to-starlight-pink/80",
    meteor: "bg-gradient-to-r from-meteor-green to-solar-orange hover:from-meteor-green/80 hover:to-solar-orange/80",
    solar: "bg-gradient-to-r from-solar-orange to-cosmic-purple hover:from-solar-orange/80 hover:to-cosmic-purple/80"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "font-semibold text-white rounded-lg transition-all duration-300",
        "shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </button>
  );
}