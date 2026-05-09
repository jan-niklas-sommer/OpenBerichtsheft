import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
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
        <input
          id={inputId}
          ref={ref}
          className={`h-10 w-full rounded-lg border border-stroke-base bg-surface-base px-3 text-sm text-content-base placeholder:text-content-subtle focus:border-stroke-strong focus:outline-none focus:ring-1 focus:ring-stroke-strong disabled:cursor-not-allowed disabled:opacity-50 ${error ? "border-danger focus:border-danger focus:ring-danger" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
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
        <textarea
          id={inputId}
          ref={ref}
          className={`min-h-[200px] w-full rounded-lg border border-stroke-base bg-surface-base px-3 py-2 text-sm text-content-base placeholder:text-content-subtle focus:border-stroke-strong focus:outline-none focus:ring-1 focus:ring-stroke-strong disabled:cursor-not-allowed disabled:opacity-50 ${error ? "border-danger focus:border-danger focus:ring-danger" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-danger">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
