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

/**
 * Records are read against São Paulo time rather than the browser's own zone
 * (RNF-LOC-04), so a reading keeps the date and hour it was taken at even when
 * the caregiver opens the history from somewhere else.
 */
const TIME_ZONE = 'America/Sao_Paulo'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  weekday: 'long',
})

/** `09/09/2026` (RNF-LOC-03). */
export function formatDate(date: Date): string {
  return dateFormatter.format(date)
}

/** `08:15`, 24-hour (RNF-LOC-03). */
export function formatTime(date: Date): string {
  return timeFormatter.format(date)
}

/** `terça-feira` — context for a date heading, never the heading itself. */
export function formatWeekday(date: Date): string {
  return weekdayFormatter.format(date)
}

/**
 * Midnight, local time, `days` days back. Used as the lower bound of a history
 * period: the day is the local one, so a period that starts today includes a
 * reading taken at 06:00 this morning (§8.2).
 */
export function startOfDaysAgo(days: number): Date {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - days + 1)
  return start
}
