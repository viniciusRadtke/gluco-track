import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { CLINICAL_TONE_CLASSES } from '@/components/ui/clinical-tone'
import { Field, inputClassName } from '@/components/ui/field'
import { cn } from '@/lib/cn'
import {
  BLOOD_PRESSURE_CLASSIFICATION_LABEL,
  BLOOD_PRESSURE_CLASSIFICATION_TONE,
  classifyBloodPressure,
  INPUT_RANGES,
  type Thresholds,
} from '@/lib/clinical'
import { fromDateTimeInputs, toDateInputValue, toTimeInputValue } from '@/lib/datetime'
import { createBloodPressureReading } from '@/lib/records'
import { FormStatus, type StatusTone } from './form-status'
import { MeasuredAtFields } from './measured-at-fields'
import { NoteField } from './note-field'

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 3)
}

/**
 * Recording a blood pressure reading.
 *
 * The three numbers are entered as the device shows them (RF-BIO-01): systolic,
 * diastolic and, when the device reports one, the pulse. Nothing on this screen
 * implies a daily cadence or asks for a missing entry (RF-BIO-04).
 */
export function BloodPressureForm({
  patientId,
  thresholds,
}: {
  patientId: string
  thresholds: Thresholds
}) {
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [pulse, setPulse] = useState('')
  const [dateValue, setDateValue] = useState(() => toDateInputValue(new Date()))
  const [timeValue, setTimeValue] = useState(() => toTimeInputValue(new Date()))
  const [note, setNote] = useState('')

  const [systolicError, setSystolicError] = useState<string | undefined>(undefined)
  const [diastolicError, setDiastolicError] = useState<string | undefined>(undefined)
  const [pulseError, setPulseError] = useState<string | undefined>(undefined)
  const [measuredAtError, setMeasuredAtError] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<{ tone: StatusTone; message: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const parsedSystolic = systolic === '' ? Number.NaN : Number(systolic)
  const parsedDiastolic = diastolic === '' ? Number.NaN : Number(diastolic)

  const bothValid =
    Number.isInteger(parsedSystolic) &&
    parsedSystolic >= INPUT_RANGES.systolic.min &&
    parsedSystolic <= INPUT_RANGES.systolic.max &&
    Number.isInteger(parsedDiastolic) &&
    parsedDiastolic >= INPUT_RANGES.diastolic.min &&
    parsedDiastolic <= INPUT_RANGES.diastolic.max &&
    parsedSystolic > parsedDiastolic

  // RF-BIO-06: a reading above the configured target is flagged, in words as
  // well as in color (RNF-USA-05).
  const classification = bothValid
    ? classifyBloodPressure(parsedSystolic, parsedDiastolic, thresholds)
    : null

  function rangeMessage(label: string, range: { min: number; max: number }): string {
    return `${label} fora da faixa aceita (${range.min} a ${range.max}).`
  }

  function validate(): { measuredAt: Date } | null {
    let systolicMessage: string | undefined
    if (systolic === '') {
      systolicMessage = 'Informe a pressão sistólica.'
    } else if (
      parsedSystolic < INPUT_RANGES.systolic.min ||
      parsedSystolic > INPUT_RANGES.systolic.max
    ) {
      systolicMessage = rangeMessage('Sistólica', INPUT_RANGES.systolic)
    }

    let diastolicMessage: string | undefined
    if (diastolic === '') {
      diastolicMessage = 'Informe a pressão diastólica.'
    } else if (
      parsedDiastolic < INPUT_RANGES.diastolic.min ||
      parsedDiastolic > INPUT_RANGES.diastolic.max
    ) {
      diastolicMessage = rangeMessage('Diastólica', INPUT_RANGES.diastolic)
    } else if (!systolicMessage && parsedSystolic <= parsedDiastolic) {
      // The database enforces this too; catching it here explains it instead of
      // returning a constraint name.
      diastolicMessage = 'A diastólica deve ser menor que a sistólica.'
    }

    let pulseMessage: string | undefined
    const parsedPulse = pulse === '' ? null : Number(pulse)
    if (
      parsedPulse !== null &&
      (parsedPulse < INPUT_RANGES.pulse.min || parsedPulse > INPUT_RANGES.pulse.max)
    ) {
      pulseMessage = rangeMessage('Pulso', INPUT_RANGES.pulse)
    }

    const measuredAt = fromDateTimeInputs(dateValue, timeValue)
    let measuredAtMessage: string | undefined
    if (!measuredAt) {
      measuredAtMessage = 'Informe uma data e uma hora válidas.'
    } else if (measuredAt.getTime() > Date.now()) {
      measuredAtMessage = 'A medição não pode estar no futuro.'
    }

    setSystolicError(systolicMessage)
    setDiastolicError(diastolicMessage)
    setPulseError(pulseMessage)
    setMeasuredAtError(measuredAtMessage)

    if (systolicMessage || diastolicMessage || pulseMessage || measuredAtMessage || !measuredAt) {
      return null
    }
    return { measuredAt }
  }

  async function save(measuredAt: Date) {
    setSaving(true)
    setStatus(null)

    try {
      await createBloodPressureReading({
        patientId,
        systolic: parsedSystolic,
        diastolic: parsedDiastolic,
        pulse: pulse === '' ? null : Number(pulse),
        measuredAt,
        note: note.trim() || null,
      })

      setSystolic('')
      setDiastolic('')
      setPulse('')
      setNote('')
      setStatus({ tone: 'success', message: 'Pressão arterial registrada.' })
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
      void save(valid.measuredAt)
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Sistólica" hint="mmHg" error={systolicError}>
          {({ id, describedBy }) => (
            <input
              id={id}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="120"
              className={cn(inputClassName, 'tabular')}
              value={systolic}
              aria-describedby={describedBy}
              onChange={(event) => {
                setSystolic(digitsOnly(event.target.value))
                setSystolicError(undefined)
                setStatus(null)
              }}
            />
          )}
        </Field>

        <Field label="Diastólica" hint="mmHg" error={diastolicError}>
          {({ id, describedBy }) => (
            <input
              id={id}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="80"
              className={cn(inputClassName, 'tabular')}
              value={diastolic}
              aria-describedby={describedBy}
              onChange={(event) => {
                setDiastolic(digitsOnly(event.target.value))
                setDiastolicError(undefined)
                setStatus(null)
              }}
            />
          )}
        </Field>
      </div>

      <div aria-live="polite">
        {classification && (
          <div
            className={cn(
              'flex flex-wrap items-baseline justify-between gap-2 rounded-lg px-3 py-2.5',
              CLINICAL_TONE_CLASSES[BLOOD_PRESSURE_CLASSIFICATION_TONE[classification]],
            )}
          >
            <span className="text-[0.95rem] font-semibold">
              {BLOOD_PRESSURE_CLASSIFICATION_LABEL[classification]}
            </span>
            <span className="tabular text-sm">
              Alvo {thresholds.bp_target_systolic}/{thresholds.bp_target_diastolic} mmHg
            </span>
          </div>
        )}
      </div>

      <Field label="Pulso (opcional)" hint="bpm" error={pulseError}>
        {({ id, describedBy }) => (
          <input
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="72"
            className={cn(inputClassName, 'tabular')}
            value={pulse}
            aria-describedby={describedBy}
            onChange={(event) => {
              setPulse(digitsOnly(event.target.value))
              setPulseError(undefined)
              setStatus(null)
            }}
          />
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
          {saving ? 'Registrando…' : 'Registrar pressão'}
        </Button>
      </div>
    </form>
  )
}
