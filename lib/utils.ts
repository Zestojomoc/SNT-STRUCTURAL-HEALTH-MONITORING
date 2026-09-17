export function formatLocalTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function formatNumber(
  value: number | null | undefined,
  digits = 2,
  signed = false,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const formatted = value.toFixed(digits);
  return signed && value > 0 ? `+${formatted}` : formatted;
}

export function formatDelay(seconds: number): string {
  if (seconds <= 0) return "Near real time";
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60} min source delay`;
  return `${seconds} sec source delay`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
