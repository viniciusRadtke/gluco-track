import { cn } from '@/lib/cn'

export type StatusTone = 'success' | 'notice' | 'alert'

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-clinical-in-range-surface text-clinical-in-range',
  notice: 'bg-surface-sunken text-text-muted',
  alert: 'bg-clinical-alert-surface text-clinical-alert',
}

/**
 * The outcome of a save, announced as well as shown.
 *
 * The element is always in the tree, empty when there is nothing to say: a live
 * region added at the same moment as its text is not reliably announced.
 *
 * Copy is sober by policy (§9.4): no exclamation marks, no praise, no emoji.
 */
export function FormStatus({ status }: { status: { tone: StatusTone; message: string } | null }) {
  return (
    <div role="status" aria-live="polite">
      {status && (
        <p className={cn('rounded-lg px-3 py-2.5 text-sm', TONE_CLASSES[status.tone])}>
          {status.message}
        </p>
      )}
    </div>
  )
}
