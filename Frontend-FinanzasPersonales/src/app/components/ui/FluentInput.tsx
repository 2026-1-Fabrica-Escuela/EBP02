import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FluentInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  error?: string;
  size?: "sm" | "md";
}

export function FluentInput({
  label,
  error,
  type,
  size = "md",
  className = "",
  id,
  ...props
}: FluentInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
  const isPassword = type === "password";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-[0.8125rem] text-[#1a1a2e]/70">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={isPassword && showPassword ? "text" : type}
          className={`w-full rounded-[10px] border px-4 ${size === "sm" ? "py-2" : "py-2.5"} bg-white transition-all duration-200 outline-none
            ${error ? "border-[#FF5252] focus:ring-2 focus:ring-[#FF5252]/20" : "border-[#e0e0e0] focus:border-[#1A237E] focus:ring-2 focus:ring-[#1A237E]/10"}
            ${isPassword ? "pr-10" : ""}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#1A237E] transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="text-[0.75rem] text-[#FF5252]">{error}</p>}
    </div>
  );
}
