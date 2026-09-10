import type { HistoryEntryKind } from '@/lib/records'

export type HistoryKindFilter = HistoryEntryKind | 'all'
export type HistoryPeriodValue = '7' | '30' | '90' | 'all'

export const HISTORY_KIND_LABEL: Record<HistoryEntryKind, string> = {
  glucose: 'Glicemia',
  'blood-pressure': 'Pressão',
  weight: 'Peso',
}

export const HISTORY_KIND_OPTIONS: { value: HistoryKindFilter; label: string }[] = [
  { value: 'all', label: 'Tudo' },
  { value: 'glucose', label: HISTORY_KIND_LABEL.glucose },
  { value: 'blood-pressure', label: HISTORY_KIND_LABEL['blood-pressure'] },
  { value: 'weight', label: HISTORY_KIND_LABEL.weight },
]

/**
 * The periods offered by RF-HIS-02. `days` counts local days including today,
 * and null is the whole history — the option that keeps an old entry reachable
 * once the patient has months of records.
 */
export const HISTORY_PERIODS: { value: HistoryPeriodValue; days: number | null; label: string }[] =
  [
    { value: '7', days: 7, label: '7 dias' },
    { value: '30', days: 30, label: '30 dias' },
    { value: '90', days: 90, label: '90 dias' },
    { value: 'all', days: null, label: 'Tudo' },
  ]
