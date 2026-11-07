/**
 * Date display helpers — the whole app shows dates the Indian way: DD/MM/YYYY.
 *
 * Plain "YYYY-MM-DD" values and zone-less "YYYY-MM-DDTHH:mm[:ss]" values from the server are shown
 * exactly as written. Date objects, timestamps and values carrying a zone are shown in IST.
 * These are for display only: values sent to the server stay "YYYY-MM-DD".
 */

type DateInput = string | number | Date | null | undefined;

const IST = "Asia/Kolkata";
const AS_WRITTEN = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?$/;

function resolve(value: DateInput): { date: Date; timeZone: string } | null {
  if (value == null || value === "") return null;
  if (typeof value === "string") {
    const m = AS_WRITTEN.exec(value.trim());
    if (m) {
      const [, y, mo, d, h = "0", mi = "0", s = "0"] = m;
      return { date: new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)), timeZone: "UTC" };
    }
  }
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : { date, timeZone: IST };
}

function fmt(value: DateInput, options: Intl.DateTimeFormatOptions, locale = "en-GB"): string | null {
  const r = resolve(value);
  return r ? new Intl.DateTimeFormat(locale, { ...options, timeZone: r.timeZone }).format(r.date) : null;
}

/** 07/11/2026 */
export function formatDate(value: DateInput, fallback = ""): string {
  return fmt(value, { day: "2-digit", month: "2-digit", year: "numeric" }) ?? fallback;
}

/** 07/11 — for compact chart labels where the year is obvious */
export function formatDayMonth(value: DateInput, fallback = ""): string {
  return fmt(value, { day: "2-digit", month: "2-digit" }) ?? fallback;
}

/** 10:22 am (or 10:22:05 am with seconds) */
export function formatTime(value: DateInput, fallback = "", seconds = false): string {
  return fmt(value, { hour: "2-digit", minute: "2-digit", ...(seconds ? { second: "2-digit" } : {}), hour12: true }, "en-IN") ?? fallback;
}

/** 07/11/2026, 10:22 am */
export function formatDateTime(value: DateInput, fallback = "", seconds = false): string {
  const d = formatDate(value);
  return d ? `${d}, ${formatTime(value, "", seconds)}` : fallback;
}

/** Sat, 07/11/2026 (weekday "long" gives Saturday, 07/11/2026) */
export function formatWeekdayDate(value: DateInput, fallback = "", weekday: "short" | "long" = "short"): string {
  const d = formatDate(value);
  return d ? `${fmt(value, { weekday })}, ${d}` : fallback;
}
