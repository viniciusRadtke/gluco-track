import type { GlucoseContext, PatientSettings } from './models'

/**
 * Thresholds fall back to these until the patient's settings row loads. They
 * match the defaults written by the database (§5.1). The physician's actual
 * targets are still to be confirmed (P-02), which is why nothing here is
 * treated as clinical truth: the app classifies against the configured range
 * and never recommends a course of action (§9.3, principle 4).
 */
export const DEFAULT_THRESHOLDS = {
  glucose_target_min: 100,
  glucose_target_max: 150,
  alert_low: 70,
  alert_high: 180,
  bp_target_systolic: 130,
  bp_target_diastolic: 80,
} as const

export type Thresholds = Pick<PatientSettings, keyof typeof DEFAULT_THRESHOLDS>

/** Accepted input ranges (§5.1). Anything outside is rejected, not confirmed. */
export const INPUT_RANGES = {
  glucose: { min: 20, max: 600 },
  systolic: { min: 60, max: 260 },
  diastolic: { min: 30, max: 160 },
  pulse: { min: 30, max: 220 },
  weightKg: { min: 20, max: 300 },
} as const

/**
 * Values inside the accepted range but rare enough to be worth a second look.
 * RF-GLI-07 asks for a confirmation here, never a block: a genuine severe
 * hypoglycaemia must still be recordable.
 */
export const GLUCOSE_IMPLAUSIBLE = { below: 40, above: 400 } as const

export type GlucoseClassification = 'low' | 'below-target' | 'in-range' | 'above-target' | 'high'

/** Which of the three clinical colors a classification uses (§9.2). */
export type ClinicalTone = 'alert' | 'caution' | 'in-range'

/**
 * Classifies a glucose value against the configured range (§9.2).
 *
 * Boundaries are inclusive at both ends of the target range: a reading exactly
 * on the target is in range.
 */
export function classifyGlucose(value: number, thresholds: Thresholds): GlucoseClassification {
  if (value < thresholds.alert_low) return 'low'
  if (value < thresholds.glucose_target_min) return 'below-target'
  if (value <= thresholds.glucose_target_max) return 'in-range'
  if (value <= thresholds.alert_high) return 'above-target'
  return 'high'
}

export const GLUCOSE_CLASSIFICATION_TONE: Record<GlucoseClassification, ClinicalTone> = {
  low: 'alert',
  'below-target': 'caution',
  'in-range': 'in-range',
  'above-target': 'caution',
  high: 'alert',
}

/**
 * The text label is not decoration: color alone must never carry the
 * classification, so that it survives both themes and color blindness
 * (RNF-USA-05).
 */
export const GLUCOSE_CLASSIFICATION_LABEL: Record<GlucoseClassification, string> = {
  low: 'Baixo',
  'below-target': 'Abaixo do alvo',
  'in-range': 'Na faixa',
  'above-target': 'Acima do alvo',
  high: 'Alto',
}

export const GLUCOSE_CONTEXT_LABEL: Record<GlucoseContext, string> = {
  fasting: 'Jejum',
  pre_meal: 'Antes da refeição',
  post_meal: 'Depois da refeição',
  bedtime: 'Ao deitar',
  random: 'Casual',
}

/** Order shown in the interface; fasting first because it is the default. */
export const GLUCOSE_CONTEXTS: GlucoseContext[] = [
  'fasting',
  'pre_meal',
  'post_meal',
  'bedtime',
  'random',
]

export type BloodPressureClassification = 'in-range' | 'above-target'

/** RF-BIO-06: flag a reading above the configured target, either number. */
export function classifyBloodPressure(
  systolic: number,
  diastolic: number,
  thresholds: Thresholds,
): BloodPressureClassification {
  const above =
    systolic > thresholds.bp_target_systolic || diastolic > thresholds.bp_target_diastolic
  return above ? 'above-target' : 'in-range'
}

export const BLOOD_PRESSURE_CLASSIFICATION_LABEL: Record<BloodPressureClassification, string> = {
  'in-range': 'Na faixa',
  'above-target': 'Acima do alvo',
}
