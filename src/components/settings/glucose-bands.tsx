import { CLINICAL_TONE_CLASSES } from '@/components/ui/clinical-tone'
import { cn } from '@/lib/cn'
import {
  describeGlucoseBands,
  GLUCOSE_CLASSIFICATION_LABEL,
  GLUCOSE_CLASSIFICATION_TONE,
  type Thresholds,
} from '@/lib/clinical'

/**
 * The five bands the configured thresholds produce (§9.2).
 *
 * The settings screen shows the consequence of the numbers above it, because a
 * threshold on its own says nothing: this is where the patient reads what
 * "Abaixo do alvo" will mean for him. It states the classification and never a
 * course of action (§9.3, principle 4).
 */
export function GlucoseBands({ thresholds }: { thresholds: Thresholds }) {
  return (
    <dl className="flex flex-col gap-1.5">
      {describeGlucoseBands(thresholds).map(({ classification, range }) => (
        <div key={classification} className="flex flex-wrap items-baseline justify-between gap-2">
          <dt
            className={cn(
              'rounded-md px-2 py-1 text-sm font-medium',
              CLINICAL_TONE_CLASSES[GLUCOSE_CLASSIFICATION_TONE[classification]],
            )}
          >
            {GLUCOSE_CLASSIFICATION_LABEL[classification]}
          </dt>
          <dd className="tabular text-text-muted text-sm">{range} mg/dL</dd>
        </div>
      ))}
    </dl>
  )
}
