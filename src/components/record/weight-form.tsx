import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Field, inputSurfaceClassName } from '@/components/ui/field'
import { cn } from '@/lib/cn'
import { INPUT_RANGES } from '@/lib/clinical'
import { fromDateTimeInputs, toDateInputValue, toTimeInputValue } from '@/lib/datetime'
import { createWeightEntry } from '@/lib/records'
import { FormStatus, type StatusTone } from './form-status'
import { MeasuredAtFields } from './measured-at-fields'
import { NoteField } from './note-field'

const { min: MIN, max: MAX } = INPUT_RANGES.weightKg

/** `20,0` — the interface is Brazilian Portuguese, so the comma is the separator shown. */
function formatRange(value: number): string {
  return value.toFixed(1).replace('.', ',')
}

/**
 * Keeps only what a weight can contain: digits and a single separator, with at
 * most three whole digits and one decimal. The comma is what the patient sees
 * while typing, whichever key was pressed — a phone keypad offers a period and
 * a Brazilian keyboard a comma, and neither should be the wrong one.
 */
function normalizeWeightInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, '').replace(/\./g, ',')
  const [whole = '', ...rest] = cleaned.split(',')
  const digits = whole.slice(0, 3)
  if (rest.length === 0) {
    return digits
  }
  return `${digits},${rest.join('').slice(0, 1)}`
}

/** The stored value: a number with one decimal, or NaN while the field is incomplete. */
function parseWeight(value: string): number {
  if (!/^\d{1,3}(,\d)?$/.test(value)) {
    return Number.NaN
  }
  return Number(value.replace(',', '.'))
}

/**
 * Recording a weight entry (RF-BIO-02).
 *
 * Kilograms with one decimal place, which is what a domestic scale reports and
 * what the column stores. Nothing here suggests a target weight or comments on
 * a trend: the app records and classifies, it does not advise (§9.3).
 */
export function WeightForm({ patientId }: { patientId: string }) {
  const [weight, setWeight] = useState('')
  const [dateValue, setDateValue] = useState(() => toDateInputValue(new Date()))
  const [timeValue, setTimeValue] = useState(() => toTimeInputValue(new Date()))
  const [note, setNote] = useState('')

  const [weightError, setWeightError] = useState<string | undefined>(undefined)
  const [measuredAtError, setMeasuredAtError] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<{ tone: StatusTone; message: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const parsed = parseWeight(weight)

  function validate(): { measuredAt: Date; weightKg: number } | null {
    let weightMessage: string | undefined
    if (weight === '') {
      weightMessage = 'Informe o peso.'
    } else if (Number.isNaN(parsed)) {
      weightMessage = 'Informe um peso com no máximo uma casa decimal.'
    } else if (parsed < MIN || parsed > MAX) {
      weightMessage = `Peso fora da faixa aceita (${formatRange(MIN)} a ${formatRange(MAX)} kg).`
    }
    setWeightError(weightMessage)

    const measuredAt = fromDateTimeInputs(dateValue, timeValue)
    let measuredAtMessage: string | undefined
    if (!measuredAt) {
      measuredAtMessage = 'Informe uma data e uma hora válidas.'
    } else if (measuredAt.getTime() > Date.now()) {
      measuredAtMessage = 'A medição não pode estar no futuro.'
    }
    setMeasuredAtError(measuredAtMessage)

    if (weightMessage || measuredAtMessage || !measuredAt) {
      return null
    }
    return { measuredAt, weightKg: parsed }
  }

  async function save(measuredAt: Date, weightKg: number) {
    setSaving(true)
    setStatus(null)

    try {
      await createWeightEntry({
        patientId,
        weightKg,
        measuredAt,
        note: note.trim() || null,
      })

      setWeight('')
      setNote('')
      setStatus({ tone: 'success', message: 'Peso registrado.' })
    } catch (error) {
      setStatus({ tone: 'alert', message: (error as Error).message })
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const valid = validate()
    if (valid) {
      void save(valid.measuredAt, valid.weightKg)
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <Field
        label="Peso"
        hint={`De ${formatRange(MIN)} a ${formatRange(MAX)} kg, com uma casa decimal.`}
        error={weightError}
      >
        {({ id, describedBy }) => (
          <div className="flex items-baseline gap-3">
            <input
              id={id}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,0"
              className={cn(inputSurfaceClassName, 'tabular w-40 px-3 py-2 text-4xl font-semibold')}
              value={weight}
              aria-describedby={describedBy}
              onChange={(event) => {
                setWeight(normalizeWeightInput(event.target.value))
                setWeightError(undefined)
                setStatus(null)
              }}
            />
            <span className="text-text-muted text-base">kg</span>
          </div>
        )}
      </Field>

      <MeasuredAtFields
        dateValue={dateValue}
        timeValue={timeValue}
        error={measuredAtError}
        onDateChange={(next) => {
          setDateValue(next)
          setMeasuredAtError(undefined)
        }}
        onTimeChange={(next) => {
          setTimeValue(next)
          setMeasuredAtError(undefined)
        }}
      />

      <NoteField value={note} onChange={setNote} />

      <FormStatus status={status} />

      <div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Registrando…' : 'Registrar peso'}
        </Button>
      </div>
    </form>
  )
}
