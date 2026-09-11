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

/**
 * Blood pressure has no caution band of its own: a reading is either inside the
 * configured target or above it (RF-BIO-06). The map exists so the recording
 * form and the history classify from one source, as glucose already does.
 */
export const BLOOD_PRESSURE_CLASSIFICATION_TONE: Record<BloodPressureClassification, ClinicalTone> =
  {
    'in-range': 'in-range',
    'above-target': 'caution',
  }

/**
 * The six values the patient can configure (RF-CFG-01, RF-CFG-02, RF-CFG-03),
 * in the order the settings screen shows them: the four glucose thresholds
 * read as one ascending scale, and the two blood pressure targets follow.
 */
export type ThresholdField = keyof Thresholds

export const THRESHOLD_FIELDS: ThresholdField[] = [
  'alert_low',
  'glucose_target_min',
  'glucose_target_max',
  'alert_high',
  'bp_target_systolic',
  'bp_target_diastolic',
]

export const THRESHOLD_LABEL: Record<ThresholdField, string> = {
  alert_low: 'Limite de hipoglicemia',
  glucose_target_min: 'Mínimo da faixa alvo',
  glucose_target_max: 'Máximo da faixa alvo',
  alert_high: 'Limite de hiperglicemia',
  bp_target_systolic: 'Sistólica máxima',
  bp_target_diastolic: 'Diastólica máxima',
}

/** A threshold is a measurement, so it accepts the same range one does (§5.1). */
export const THRESHOLD_INPUT_RANGE: Record<ThresholdField, { min: number; max: number }> = {
  alert_low: INPUT_RANGES.glucose,
  glucose_target_min: INPUT_RANGES.glucose,
  glucose_target_max: INPUT_RANGES.glucose,
  alert_high: INPUT_RANGES.glucose,
  bp_target_systolic: INPUT_RANGES.systolic,
  bp_target_diastolic: INPUT_RANGES.diastolic,
}

/**
 * Checks a set of thresholds before it is saved.
 *
 * The four glucose values must rise strictly, which is the rule the database
 * holds as a check constraint. Catching it here explains what is wrong in the
 * patient's own language instead of surfacing a constraint name.
 *
 * Blood pressure carries no ordering rule: the two targets are independent and
 * a reading above either one is flagged (RF-BIO-06).
 */
export function validateThresholds(values: Thresholds): Partial<Record<ThresholdField, string>> {
  const errors: Partial<Record<ThresholdField, string>> = {}

  for (const field of THRESHOLD_FIELDS) {
    const value = values[field]
    const range = THRESHOLD_INPUT_RANGE[field]
    if (!Number.isInteger(value)) {
      errors[field] = 'Informe um número inteiro.'
    } else if (value < range.min || value > range.max) {
      errors[field] = `Valor fora da faixa aceita (${range.min} a ${range.max}).`
    }
  }

  // Each message lands on the later value of the pair, because that is the one
  // the patient has to raise for the scale to make sense.
  if (!errors.alert_low && !errors.glucose_target_min) {
    if (values.glucose_target_min <= values.alert_low) {
      errors.glucose_target_min = 'Deve ser maior que o limite de hipoglicemia.'
    }
  }
  if (!errors.glucose_target_min && !errors.glucose_target_max) {
    if (values.glucose_target_max <= values.glucose_target_min) {
      errors.glucose_target_max = 'Deve ser maior que o mínimo da faixa alvo.'
    }
  }
  if (!errors.glucose_target_max && !errors.alert_high) {
    if (values.alert_high <= values.glucose_target_max) {
      errors.alert_high = 'Deve ser maior que o máximo da faixa alvo.'
    }
  }

  return errors
}

export type GlucoseBand = { classification: GlucoseClassification; range: string }

/**
 * The five bands a set of thresholds produces (§9.2), written out.
 *
 * The settings screen shows them so the patient sees what a change does before
 * saving it. The boundaries are the ones `classifyGlucose` applies, stated in
 * whole numbers because the column is an integer.
 */
export function describeGlucoseBands(thresholds: Thresholds): GlucoseBand[] {
  return [
    { classification: 'low', range: `Abaixo de ${thresholds.alert_low}` },
    {
      classification: 'below-target',
      range: `${thresholds.alert_low} a ${thresholds.glucose_target_min - 1}`,
    },
    {
      classification: 'in-range',
      range: `${thresholds.glucose_target_min} a ${thresholds.glucose_target_max}`,
    },
    {
      classification: 'above-target',
      range: `${thresholds.glucose_target_max + 1} a ${thresholds.alert_high}`,
    },
    { classification: 'high', range: `Acima de ${thresholds.alert_high}` },
  ]
}
