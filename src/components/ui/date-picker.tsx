"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  disabledDates?: (date: Date) => boolean;
}

function formatDateDE(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Datum wählen",
  disabled = false,
  className = "",
  disabledDates,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = value ? new Date(value + "T00:00:00") : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={value ? `Gewähltes Datum: ${formatDateDE(selectedDate!)}` : placeholder}
          className={`flex h-10 w-full items-center justify-between rounded-lg border border-stroke-base bg-surface-base px-3 text-sm text-content-base hover:border-stroke-strong hover:bg-surface-overlay focus:border-stroke-strong focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
          <span className={value ? "" : "text-content-subtle"}>
            {value ? formatDateDE(selectedDate!) : placeholder}
          </span>
          <CalendarIcon className="size-4 shrink-0 text-content-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          defaultMonth={selectedDate}
          disabled={disabledDates}
        />
      </PopoverContent>
    </Popover>
  );
}
