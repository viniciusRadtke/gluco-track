import { useEffect, useId, useRef, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { CLINICAL_TONE_CLASSES } from '@/components/ui/clinical-tone'
import { Field, inputSurfaceClassName } from '@/components/ui/field'
import { cn } from '@/lib/cn'
import {
  classifyGlucose,
  GLUCOSE_CLASSIFICATION_LABEL,
  GLUCOSE_CLASSIFICATION_TONE,
  GLUCOSE_CONTEXT_LABEL,
  GLUCOSE_CONTEXTS,
  GLUCOSE_IMPLAUSIBLE,
  INPUT_RANGES,
  type Thresholds,
} from '@/lib/clinical'
import { fromDateTimeInputs, toDateInputValue, toTimeInputValue } from '@/lib/datetime'
import type { GlucoseContext } from '@/lib/models'
import { countGlucoseReadingsOnDay, createGlucoseReading } from '@/lib/records'
import { FormStatus, type StatusTone } from './form-status'
import { MeasuredAtFields } from './measured-at-fields'
import { NoteField } from './note-field'

const { min: MIN, max: MAX } = INPUT_RANGES.glucose

/**
 * Recording a glucose reading, the path the requirements are strictest about.
 *
 * The value is the only thing the patient must touch: the context defaults to
 * fasting, the moment defaults to now, and the note is optional, so a reading
 * costs three interactions — open, type, save (RF-GLI-05).
 */
export function GlucoseForm({
  patientId,
  thresholds,
}: {
  patientId: string
  thresholds: Thresholds
}) {
  const [value, setValue] = useState('')
  const [context, setContext] = useState<GlucoseContext>('fasting')
  const [dateValue, setDateValue] = useState(() => toDateInputValue(new Date()))
  const [timeValue, setTimeValue] = useState(() => toTimeInputValue(new Date()))
  const [note, setNote] = useState('')

  const [valueError, setValueError] = useState<string | undefined>(undefined)
  const [measuredAtError, setMeasuredAtError] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<{ tone: StatusTone; message: string } | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)

  const valueInput = useRef<HTMLInputElement>(null)
  const contextGroupName = useId()

  // The value field takes focus on mount so the patient can type straight away.
  useEffect(() => {
    valueInput.current?.focus()
  }, [])

  // RF-GLI-06: classified while typing, before anything is saved. Nothing is
  // shown until the digits form a value that could actually be recorded.
  const parsed = value === '' ? Number.NaN : Number(value)
  const classification =
    Number.isInteger(parsed) && parsed >= MIN && parsed <= MAX
      ? classifyGlucose(parsed, thresholds)
      : null

  function handleValueChange(raw: string) {
    // Three digits is the whole accepted range, so a fourth is a slip.
    setValue(raw.replace(/\D/g, '').slice(0, 3))
    setValueError(undefined)
    setConfirming(false)
    setStatus(null)
  }

  function validate(): { measuredAt: Date; numeric: number } | null {
    let valueMessage: string | undefined
    if (value === '') {
      valueMessage = 'Informe o valor da medição.'
    } else if (!Number.isInteger(parsed)) {
      valueMessage = 'Informe um número inteiro.'
    } else if (parsed < MIN || parsed > MAX) {
      valueMessage = `Valor fora da faixa aceita (${MIN} a ${MAX} mg/dL).`
    }
    setValueError(valueMessage)

    const measuredAt = fromDateTimeInputs(dateValue, timeValue)
    let measuredAtMessage: string | undefined
    if (!measuredAt) {
      measuredAtMessage = 'Informe uma data e uma hora válidas.'
    } else if (measuredAt.getTime() > Date.now()) {
      measuredAtMessage = 'A medição não pode estar no futuro.'
    }
    setMeasuredAtError(measuredAtMessage)

    if (valueMessage || measuredAtMessage || !measuredAt) {
      return null
    }
    return { measuredAt, numeric: parsed }
  }

  async function save(measuredAt: Date, numeric: number) {
    setSaving(true)
    setStatus(null)

    try {
      // RF-GLI-09: counted before the insert, so the count describes what was
      // already there. It informs and never blocks — a day can legitimately
      // hold two fasting readings.
      const existing = await countGlucoseReadingsOnDay({ patientId, context, day: measuredAt })

      await createGlucoseReading({
        patientId,
        value: numeric,
        context,
        measuredAt,
        note: note.trim() || null,
      })

      // The value is cleared and the context kept: the next reading is usually
      // of the same kind. The date and time stay as they are so several
      // readings copied from paper can be entered without resetting them.
      setValue('')
      setNote('')
      setConfirming(false)
      setStatus({
        tone: 'success',
        message:
          existing > 0
            ? `Medição registrada. Este dia já tinha ${existing} ${
                existing === 1 ? 'registro' : 'registros'
              } no contexto "${GLUCOSE_CONTEXT_LABEL[context]}".`
            : 'Medição registrada.',
      })
      valueInput.current?.focus()
    } catch (error) {
      setStatus({ tone: 'alert', message: (error as Error).message })
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const valid = validate()
    if (!valid) {
      return
    }

    // RF-GLI-07: an implausible but possible value is confirmed, never
    // rejected. A genuine severe hypoglycaemia has to be recordable.
    const implausible =
      valid.numeric < GLUCOSE_IMPLAUSIBLE.below || valid.numeric > GLUCOSE_IMPLAUSIBLE.above
    if (implausible && !confirming) {
      setConfirming(true)
      setStatus(null)
      return
    }

    void save(valid.measuredAt, valid.numeric)
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <Field label="Glicemia" error={valueError}>
        {({ id, describedBy }) => (
          <div className="flex items-baseline gap-3">
            <input
              id={id}
              ref={valueInput}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              className={cn(inputSurfaceClassName, 'tabular w-36 px-3 py-2 text-5xl font-semibold')}
              value={value}
              aria-describedby={describedBy}
              onChange={(event) => handleValueChange(event.target.value)}
            />
            <span className="text-text-muted text-base">mg/dL</span>
          </div>
        )}
      </Field>

      {/*
        The live region is always present so that the classification is
        announced when it appears. The written label is not decoration: color
        must never carry the meaning on its own (RNF-USA-05).
      */}
      <div aria-live="polite">
        {classification && (
          <div
            className={cn(
              'flex flex-wrap items-baseline justify-between gap-2 rounded-lg px-3 py-2.5',
              CLINICAL_TONE_CLASSES[GLUCOSE_CLASSIFICATION_TONE[classification]],
            )}
          >
            <span className="text-[0.95rem] font-semibold">
              {GLUCOSE_CLASSIFICATION_LABEL[classification]}
            </span>
            <span className="tabular text-sm">
              Faixa alvo {thresholds.glucose_target_min}–{thresholds.glucose_target_max} mg/dL
            </span>
          </div>
        )}
      </div>

      {/*
        A radio group rather than a select: every option is visible and costs
        one interaction instead of two (RF-GLI-02).
      */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-text-muted text-sm font-medium">Contexto</legend>
        <div className="flex flex-wrap gap-2 pt-1.5">
          {GLUCOSE_CONTEXTS.map((option) => {
            const selected = option === context
            return (
              <label
                key={option}
                className={cn(
                  'cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors',
                  'has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
                  selected
                    ? 'border-border-strong bg-accent-subtle text-text font-semibold'
                    : 'border-border-base text-text-muted hover:bg-surface-sunken',
                )}
              >
                <input
                  type="radio"
                  name={contextGroupName}
                  value={option}
                  checked={selected}
                  className="sr-only"
                  onChange={() => {
                    setContext(option)
                    setStatus(null)
                  }}
                />
                {GLUCOSE_CONTEXT_LABEL[option]}
              </label>
            )
          })}
        </div>
      </fieldset>

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

      {confirming && (
        <p
          role="alert"
          className="bg-clinical-caution-surface text-clinical-caution rounded-lg px-3 py-2.5 text-sm"
        >
          {parsed} mg/dL está fora do usual. Confirme para registrar assim mesmo.
        </p>
      )}

      <FormStatus status={status} />

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Registrando…' : confirming ? 'Confirmar e registrar' : 'Registrar medição'}
        </Button>

        {confirming && (
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => {
              setConfirming(false)
              valueInput.current?.focus()
            }}
          >
            Revisar valor
          </Button>
        )}
      </div>
    </form>
  )
}
