import { useId, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

/**
 * Border, background and focus treatment shared by every control. Kept apart
 * from size and spacing so a control that is deliberately larger — the glucose
 * value (§9.3, principle 2) — can size itself without two competing width or
 * font-size utilities landing in the same class attribute.
 */
export const inputSurfaceClassName =
  'border-border-base bg-surface-raised text-text placeholder:text-text-subtle rounded-lg border transition-colors focus:border-border-strong'

/** Shared input appearance, so the three forms cannot drift apart. */
export const inputClassName = `${inputSurfaceClassName} w-full px-3 py-2.5 text-[0.95rem]`

type FieldProps = {
  label: string
  /** Rendered with the control it describes; use for units and short rules. */
  hint?: string
  error?: string
  children: (props: { id: string; describedBy: string | undefined }) => ReactNode
}

/**
 * Label, control and message for one input.
 *
 * The error is announced rather than only colored: color never carries meaning
 * on its own in this interface (RNF-USA-05).
 */
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = cn(hint && hintId, error && errorId) || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-text-muted text-sm font-medium">
        {label}
      </label>

      {children({ id, describedBy })}

      {hint && !error && (
        <p id={hintId} className="text-text-subtle text-sm">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-clinical-alert text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
