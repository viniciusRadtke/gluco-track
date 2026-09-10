import type { Thresholds } from '@/lib/clinical'
import { formatDate, formatWeekday } from '@/lib/datetime'
import type { HistoryEntry } from '@/lib/records'
import { HistoryItem } from './history-item'

type DayGroup = { date: string; weekday: string; entries: HistoryEntry[] }

/**
 * Splits the timeline into local days (§8.2): the date shown is the São Paulo
 * one, so a reading taken at 06:00 heads that morning and not the day before.
 *
 * The entries arrive sorted, newest first, so a single pass is enough and the
 * order inside each day is preserved.
 */
function groupByDay(entries: HistoryEntry[]): DayGroup[] {
  const groups: DayGroup[] = []

  for (const entry of entries) {
    const date = formatDate(entry.measuredAt)
    const current = groups.at(-1)

    if (current && current.date === date) {
      current.entries.push(entry)
    } else {
      groups.push({ date, weekday: formatWeekday(entry.measuredAt), entries: [entry] })
    }
  }

  return groups
}

/** The timeline itself: one panel per day, newest first (RF-HIS-01). */
export function HistoryList({
  entries,
  thresholds,
}: {
  entries: HistoryEntry[]
  thresholds: Thresholds
}) {
  return (
    <div className="flex flex-col gap-6">
      {groupByDay(entries).map((group) => (
        <section key={group.date} className="flex flex-col gap-2">
          <h2 className="flex flex-wrap items-baseline gap-2 text-sm font-medium">
            <span className="text-text-muted tabular">{group.date}</span>
            <span className="text-text-subtle font-normal">{group.weekday}</span>
          </h2>

          <ul className="border-border-base bg-surface-raised divide-border-base divide-y rounded-xl border">
            {group.entries.map((entry) => (
              <li key={`${entry.kind}-${entry.id}`}>
                <HistoryItem entry={entry} thresholds={thresholds} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
