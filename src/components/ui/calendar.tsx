"use client";

import { DayPicker } from "react-day-picker";
import { de } from "date-fns/locale/de";

const calendarClassNames = {
  months: "flex flex-col",
  month: "space-y-4",
  month_caption: "flex justify-center pt-1 relative items-center",
  caption_label: "text-sm font-medium text-content-base",
  nav: "space-x-1 flex items-center",
  button_previous:
    "absolute left-1 inline-flex items-center justify-center rounded-md size-7 bg-transparent p-0 text-content-muted hover:bg-surface-overlay hover:text-content-base transition-colors",
  button_next:
    "absolute right-1 inline-flex items-center justify-center rounded-md size-7 bg-transparent p-0 text-content-muted hover:bg-surface-overlay hover:text-content-base transition-colors",
  month_grid: "w-full border-collapse space-y-1",
  weekdays: "flex",
  weekday:
    "text-content-muted rounded-md w-9 font-normal text-[0.8rem]",
  week: "flex w-full mt-2",
  day: "text-sm text-center p-0 relative focus-within:relative focus-within:z-20",
  day_button:
    "inline-flex items-center justify-center rounded-md size-9 font-normal text-content-base hover:bg-surface-overlay hover:text-content-base transition-colors",
  range_end: "day-range-end",
  selected:
    "bg-accent text-accent-fg hover:bg-accent hover:text-accent-fg focus:bg-accent focus:text-accent-fg rounded-md",
  today:
    "font-semibold rounded-md relative after:content-[''] after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-accent",
  outside:
    "text-content-subtle opacity-50",
  disabled: "text-content-subtle opacity-50",
  range_middle:
    "aria-selected:bg-surface-overlay aria-selected:text-content-base rounded-md",
  hidden: "invisible",
  chevron: "size-4",
};

interface CalendarProps {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  defaultMonth?: Date;
  disabled?: (date: Date) => boolean;
  className?: string;
}

export function Calendar({
  mode = "single",
  selected,
  onSelect,
  defaultMonth,
  disabled,
  className = "",
}: CalendarProps) {
  return (
    <DayPicker
      mode={mode}
      selected={selected}
      onSelect={onSelect}
      defaultMonth={defaultMonth}
      disabled={disabled}
      locale={de}
      weekStartsOn={1}
      showOutsideDays={true}
      classNames={calendarClassNames}
      className={className}
    />
  );
}
