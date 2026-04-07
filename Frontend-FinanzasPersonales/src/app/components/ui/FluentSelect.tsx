import React from "react";
import { ChevronDown } from "lucide-react";

interface FluentSelectProps {
  label: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export function FluentSelect({
  label,
  error,
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  className = "",
}: FluentSelectProps) {
  const inputId = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-[0.8125rem] text-[#1a1a2e]/70">
        {label}
      </label>
      <div className="relative">
        <select
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none rounded-[10px] border px-4 py-2.5 bg-white transition-all duration-200 outline-none cursor-pointer
            ${error ? "border-[#FF5252] focus:ring-2 focus:ring-[#FF5252]/20" : "border-[#e0e0e0] focus:border-[#1A237E] focus:ring-2 focus:ring-[#1A237E]/10"}
          `}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none" />
      </div>
      {error && <p className="text-[0.75rem] text-[#FF5252]">{error}</p>}
    </div>
  );
}
