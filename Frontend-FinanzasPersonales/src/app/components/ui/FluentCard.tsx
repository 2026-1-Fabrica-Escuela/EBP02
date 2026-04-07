import React from "react";

interface FluentCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

export function FluentCard({ children, className = "", padding = "md" }: FluentCardProps) {
  const paddings = { sm: "p-4", md: "p-6", lg: "p-8" };
  return (
    <div className={`bg-white rounded-xl border border-[#e0e0e0]/50 shadow-sm ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}
