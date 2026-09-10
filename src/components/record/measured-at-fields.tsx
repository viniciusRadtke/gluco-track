import { Field, inputClassName } from '@/components/ui/field'
import { toDateInputValue } from '@/lib/datetime'

type MeasuredAtFieldsProps = {
  dateValue: string
  timeValue: string
  onDateChange: (value: string) => void
  onTimeChange: (value: string) => void
  error?: string
}

/**
 * Date and time of the measurement.
 *
 * Both are filled with the current moment by the form that owns them and stay
 * editable, so a reading written down on paper earlier can be entered later
 * (RF-GLI-03).
 */
export function MeasuredAtFields({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  error,
}: MeasuredAtFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Data" error={error}>
        {({ id, describedBy }) => (
          <input
            id={id}
            type="date"
            className={inputClassName}
            value={dateValue}
            max={toDateInputValue(new Date())}
            aria-describedby={describedBy}
            onChange={(event) => onDateChange(event.target.value)}
          />
        )}
      </Field>

      <Field label="Hora">
        {({ id }) => (
          <input
            id={id}
            type="time"
            className={inputClassName}
            value={timeValue}
            onChange={(event) => onTimeChange(event.target.value)}
          />
        )}
      </Field>
    </div>
  )
}
