import React from "react";

interface FluentButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function FluentButton({
  variant = "primary",
  size = "md",
  fullWidth = false,
  children,
  className = "",
  ...props
}: FluentButtonProps) {
  const base = "rounded-[10px] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2";

  const variants: Record<string, string> = {
    primary: "bg-[#1A237E] text-white hover:bg-[#283593] shadow-sm",
    secondary: "bg-[#00E676] text-[#1a1a2e] hover:bg-[#00C853] shadow-sm",
    outline: "border border-[#1A237E] text-[#1A237E] hover:bg-[#1A237E]/5",
    ghost: "text-[#1A237E] hover:bg-[#1A237E]/5",
    danger: "bg-[#FF5252] text-white hover:bg-[#E53935] shadow-sm",
  };

  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-[0.8125rem]",
    md: "px-5 py-2.5",
    lg: "px-7 py-3",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
