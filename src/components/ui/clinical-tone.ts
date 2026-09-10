import type { ClinicalTone } from '@/lib/clinical'

/**
 * The three clinical colors (§9.2), and the only place in the interface where a
 * surface is tinted. Kept in one map because the recording forms tint a
 * full-width panel while the history tints a small badge, and the two must not
 * drift apart.
 */
export const CLINICAL_TONE_CLASSES: Record<ClinicalTone, string> = {
  alert: 'bg-clinical-alert-surface text-clinical-alert',
  caution: 'bg-clinical-caution-surface text-clinical-caution',
  'in-range': 'bg-clinical-in-range-surface text-clinical-in-range',
}
