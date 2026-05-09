"use client";

import * as React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-content-muted"
          >
            {label}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          className={`h-10 w-full rounded-lg border border-stroke-base bg-surface-base px-3 text-sm text-content-base focus:border-stroke-strong focus:outline-none focus:ring-1 focus:ring-stroke-strong disabled:cursor-not-allowed disabled:opacity-50 ${error ? "border-danger" : ""} ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-xs text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
