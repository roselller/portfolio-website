// Formats the time the project data was retrieved, e.g. "21 Oct 2026, 13:43".
// The month is spelled out so day and month cannot be mixed up, and the 24-hour
// clock avoids AM/PM. Without a time zone it uses the visitor's own.
export function formatRetrievedAt(
  iso: string,
  timeZone?: string,
): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(date);
}
