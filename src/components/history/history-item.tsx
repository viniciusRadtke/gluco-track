import { ArrowDown, ArrowUp, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { ClinicalBadge } from '@/components/ui/clinical-badge'
import {
  BLOOD_PRESSURE_CLASSIFICATION_LABEL,
  BLOOD_PRESSURE_CLASSIFICATION_TONE,
  classifyBloodPressure,
  classifyGlucose,
  GLUCOSE_CLASSIFICATION_LABEL,
  GLUCOSE_CLASSIFICATION_TONE,
  GLUCOSE_CONTEXT_LABEL,
  type GlucoseClassification,
  type Thresholds,
} from '@/lib/clinical'
import { formatTime } from '@/lib/datetime'
import type { HistoryEntry } from '@/lib/records'

/**
 * Only the two alert states carry an icon (§9.2). It marks them apart from the
 * caution band without relying on the color, and the direction says which end
 * of the range the value fell outside.
 */
const GLUCOSE_ALERT_ICON: Partial<Record<GlucoseClassification, LucideIcon>> = {
  low: ArrowDown,
  high: ArrowUp,
}

/** `82,4` — the decimal separator shown is the comma (RNF-LOC-04). */
function formatWeight(weightKg: number): string {
  return weightKg.toFixed(1).replace('.', ',')
}

type ItemContent = {
  value: string
  unit: string
  badge: ReactNode
  /** Second line: what the value means, not what to do about it (§9.3). */
  detail: string | null
}

function describe(entry: HistoryEntry, thresholds: Thresholds): ItemContent {
  if (entry.kind === 'glucose') {
    // RF-ALE-04: the same classification the value had when it was recorded,
    // read from the configured thresholds rather than from a stored column, so
    // the list follows the range the patient has set today.
    const classification = classifyGlucose(entry.value, thresholds)
    return {
      value: String(entry.value),
      unit: 'mg/dL',
      badge: (
        <ClinicalBadge
          tone={GLUCOSE_CLASSIFICATION_TONE[classification]}
          label={GLUCOSE_CLASSIFICATION_LABEL[classification]}
          icon={GLUCOSE_ALERT_ICON[classification]}
        />
      ),
      detail: GLUCOSE_CONTEXT_LABEL[entry.context],
    }
  }

  if (entry.kind === 'blood-pressure') {
    const classification = classifyBloodPressure(entry.systolic, entry.diastolic, thresholds)
    return {
      value: `${entry.systolic}/${entry.diastolic}`,
      unit: 'mmHg',
      badge: (
        <ClinicalBadge
          tone={BLOOD_PRESSURE_CLASSIFICATION_TONE[classification]}
          label={BLOOD_PRESSURE_CLASSIFICATION_LABEL[classification]}
        />
      ),
      detail: entry.pulse === null ? null : `Pulso ${entry.pulse} bpm`,
    }
  }

  // Weight carries no classification: no target weight is configured and the
  // app comments on no trend (§9.3, principle 4).
  return { value: formatWeight(entry.weightKg), unit: 'kg', badge: null, detail: null }
}

/**
 * One recorded measurement, as the history lists it (RF-HIS-03): the value, its
 * classification, the context, the time and the note.
 */
export function HistoryItem({
  entry,
  thresholds,
}: {
  entry: HistoryEntry
  thresholds: Thresholds
}) {
  const { value, unit, badge, detail } = describe(entry, thresholds)

  return (
    <article className="flex flex-col gap-1.5 px-4 py-3.5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <p className="flex items-baseline gap-1.5">
          <span className="tabular text-2xl font-semibold">{value}</span>
          <span className="text-text-muted text-sm">{unit}</span>
        </p>

        {badge}

        <time
          dateTime={entry.measuredAt.toISOString()}
          className="text-text-muted tabular ml-auto text-sm"
        >
          {formatTime(entry.measuredAt)}
        </time>
      </div>

      {detail && <p className="text-text-muted text-sm">{detail}</p>}
      {entry.note && <p className="text-text-subtle text-sm">{entry.note}</p>}
    </article>
  )
}
