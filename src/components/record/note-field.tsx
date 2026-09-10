import { Field, inputClassName } from '@/components/ui/field'

/**
 * Optional short note carried by all three measurement types (RF-GLI-04).
 * Length matches the database constraint, so the limit is felt in the field
 * rather than discovered on save.
 */
export const NOTE_MAX_LENGTH = 500

export function NoteField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field label="Observação (opcional)">
      {({ id }) => (
        <input
          id={id}
          type="text"
          className={inputClassName}
          value={value}
          maxLength={NOTE_MAX_LENGTH}
          placeholder="Após caminhada, refeição diferente, mal-estar"
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  )
}
