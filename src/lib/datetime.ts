/**
 * Helpers for the `<input type="date">` and `<input type="time">` pair used to
 * edit when a measurement was taken.
 *
 * Both inputs speak the browser's local time. Timestamps are stored in UTC by
 * the database, so the conversion happens here and nowhere else.
 */

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** `2026-09-09`, in local time — never `toISOString`, which shifts to UTC. */
export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** `08:15`, in local time. Seconds are dropped: the patient reads a meter. */
export function toTimeInputValue(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * Rebuilds a Date from the two inputs, or returns null when either is empty or
 * malformed — which happens while the user is still typing.
 */
export function fromDateTimeInputs(dateValue: string, timeValue: string): Date | null {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue)
  const timeParts = /^(\d{2}):(\d{2})$/.exec(timeValue)
  if (!dateParts || !timeParts) {
    return null
  }

  const [, year, month, day] = dateParts
  const [, hours, minutes] = timeParts
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
  )

  return Number.isNaN(parsed.getTime()) ? null : parsed
}
