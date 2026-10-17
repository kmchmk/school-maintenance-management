import { TIME_ZONE, type Frequency } from "./constants";

/** Today's date (YYYY-MM-DD) in the school's time zone. */
export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: typeof value === "string" ? undefined : TIME_ZONE,
  }).format(d);
}

export function formatDateTime(value: Date | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(value);
}

export function addFrequency(dateStr: string, frequency: Frequency): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (frequency === "weekly") date.setUTCDate(date.getUTCDate() + 7);
  else {
    const months = { monthly: 1, quarterly: 3, half_yearly: 6, yearly: 12 }[frequency];
    const targetMonth = date.getUTCMonth() + months;
    date.setUTCDate(1);
    date.setUTCMonth(targetMonth);
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(d, lastDay));
  }
  return date.toISOString().slice(0, 10);
}

/** Hours between two timestamps, or null when either is missing. */
export function hoursBetween(a: Date | null, b: Date | null): number | null {
  if (!a || !b) return null;
  return (b.getTime() - a.getTime()) / 36e5;
}

export function formatHours(hours: number | null): string {
  if (hours === null || Number.isNaN(hours)) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export function workOrderRef(id: number): string {
  return `WO-${String(id).padStart(4, "0")}`;
}
