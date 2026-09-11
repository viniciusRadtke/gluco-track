import { useState, type FormEvent } from 'react'

import { FormStatus, type StatusTone } from '@/components/record/form-status'
import { Button } from '@/components/ui/button'
import { Field, inputClassName } from '@/components/ui/field'
import { cn } from '@/lib/cn'
import {
  DEFAULT_THRESHOLDS,
  THRESHOLD_FIELDS,
  THRESHOLD_LABEL,
  validateThresholds,
  type ThresholdField,
  type Thresholds,
} from '@/lib/clinical'
import { updatePatientSettings } from '@/lib/records'
import { GlucoseBands } from './glucose-bands'

type Draft = Record<ThresholdField, string>
type Errors = Partial<Record<ThresholdField, string>>

const GLUCOSE_FIELDS: ThresholdField[] = [
  'alert_low',
  'glucose_target_min',
  'glucose_target_max',
  'alert_high',
]

const BLOOD_PRESSURE_FIELDS: ThresholdField[] = ['bp_target_systolic', 'bp_target_diastolic']

const UNIT: Record<ThresholdField, string> = {
  alert_low: 'mg/dL',
  glucose_target_min: 'mg/dL',
  glucose_target_max: 'mg/dL',
  alert_high: 'mg/dL',
  bp_target_systolic: 'mmHg',
  bp_target_diastolic: 'mmHg',
}

function toDraft(thresholds: Thresholds): Draft {
  return {
    alert_low: String(thresholds.alert_low),
    glucose_target_min: String(thresholds.glucose_target_min),
    glucose_target_max: String(thresholds.glucose_target_max),
    alert_high: String(thresholds.alert_high),
    bp_target_systolic: String(thresholds.bp_target_systolic),
    bp_target_diastolic: String(thresholds.bp_target_diastolic),
  }
}

/** An empty field reads as `NaN`, which every check below already rejects. */
function toNumber(raw: string): number {
  return raw === '' ? Number.NaN : Number(raw)
}

function toThresholds(draft: Draft): Thresholds {
  return {
    alert_low: toNumber(draft.alert_low),
    glucose_target_min: toNumber(draft.glucose_target_min),
    glucose_target_max: toNumber(draft.glucose_target_max),
    alert_high: toNumber(draft.alert_high),
    bp_target_systolic: toNumber(draft.bp_target_systolic),
    bp_target_diastolic: toNumber(draft.bp_target_diastolic),
  }
}

/**
 * Editing the thresholds every screen classifies against (RF-CFG-01,
 * RF-CFG-02, RF-CFG-03).
 *
 * The form starts from the row that was actually read, never from the
 * defaults, so a failed load can never be saved over the patient's own
 * configuration. Each field states its factory default (RF-CFG-05) and the
 * resulting bands are shown as they are typed, because a threshold on its own
 * says nothing about what it will do.
 */
export function ThresholdsForm({
  patientId,
  thresholds,
  onSaved,
}: {
  patientId: string
  thresholds: Thresholds
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(thresholds))
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<{ tone: StatusTone; message: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const values = toThresholds(draft)

  // The preview is gated on the values being coherent rather than on the
  // submitted errors: it follows what is typed, while the messages below the
  // fields appear only once the patient has tried to save.
  const pending = validateThresholds(values)
  const previewable = GLUCOSE_FIELDS.every((field) => !pending[field])

  function handleChange(field: ThresholdField, raw: string) {
    // Three digits covers every accepted range, so a fourth is a slip.
    const digits = raw.replace(/\D/g, '').slice(0, 3)
    setDraft((previous) => ({ ...previous, [field]: digits }))
    setErrors((previous) => ({ ...previous, [field]: undefined }))
    setStatus(null)
  }

  async function save(next: Thresholds) {
    setSaving(true)
    setStatus(null)

    try {
      const saved = await updatePatientSettings({ patientId, thresholds: next })
      // Redrawn from what the database returned, not from what was typed, so
      // the form shows what is actually stored.
      setDraft(toDraft(saved))
      setStatus({ tone: 'success', message: 'Faixas atualizadas.' })
      onSaved()
    } catch (error) {
      // What was typed stays on screen, so a failed save costs nothing
      // (RNF-CON-01).
      setStatus({ tone: 'alert', message: (error as Error).message })
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const found: Errors = { ...validateThresholds(values) }
    for (const field of THRESHOLD_FIELDS) {
      if (draft[field] === '') {
        found[field] = 'Informe o valor.'
      }
    }
    setErrors(found)

    if (THRESHOLD_FIELDS.some((field) => found[field])) {
      return
    }
    void save(values)
  }

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit} noValidate>
      <fieldset className="flex flex-col gap-5">
        <legend className="text-text text-sm font-semibold">Glicemia</legend>

        <div className="grid gap-5 pt-1.5 sm:grid-cols-2">
          {GLUCOSE_FIELDS.map((field) => (
            <ThresholdField
              key={field}
              field={field}
              value={draft[field]}
              error={errors[field]}
              onChange={handleChange}
            />
          ))}
        </div>

        <div className="border-border-base border-t pt-5">
          <p className="text-text-muted mb-3 text-sm">Classificação resultante</p>
          {previewable ? (
            <GlucoseBands thresholds={values} />
          ) : (
            <p className="text-text-subtle text-sm">
              Os quatro valores precisam subir em ordem para formar as faixas.
            </p>
          )}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="text-text text-sm font-semibold">Pressão arterial</legend>

        <p className="text-text-muted text-sm">
          Uma medição acima de qualquer um dos dois valores é sinalizada.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {BLOOD_PRESSURE_FIELDS.map((field) => (
            <ThresholdField
              key={field}
              field={field}
              value={draft[field]}
              error={errors[field]}
              onChange={handleChange}
            />
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-5">
        <FormStatus status={status} />

        <div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar faixas'}
          </Button>
        </div>
      </div>
    </form>
  )
}

/** One threshold: its label, its unit, and the factory default (RF-CFG-05). */
function ThresholdField({
  field,
  value,
  error,
  onChange,
}: {
  field: ThresholdField
  value: string
  error: string | undefined
  onChange: (field: ThresholdField, raw: string) => void
}) {
  const unit = UNIT[field]

  return (
    <Field
      label={THRESHOLD_LABEL[field]}
      hint={`Padrão ${DEFAULT_THRESHOLDS[field]} ${unit}`}
      error={error}
    >
      {({ id, describedBy }) => (
        <div className="flex items-baseline gap-2">
          <input
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className={cn(inputClassName, 'tabular')}
            value={value}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            onChange={(event) => onChange(field, event.target.value)}
          />
          <span className="text-text-muted text-sm">{unit}</span>
        </div>
      )}
    </Field>
  )
}
