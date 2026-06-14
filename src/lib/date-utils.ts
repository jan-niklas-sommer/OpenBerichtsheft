export const MS_PER_DAY = 86400000;

export function addMonths(d: Date, months: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function toMonday(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  r.setDate(r.getDate() + offset);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function toSunday(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const offset = day === 0 ? 0 : 7 - day;
  r.setDate(r.getDate() + offset);
  r.setHours(0, 0, 0, 0);
  return r;
}
