import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/cn'
import type { ClinicalTone } from '@/lib/clinical'
import { CLINICAL_TONE_CLASSES } from './clinical-tone'

/**
 * The classification of one value, as shown next to it in a list.
 *
 * The label is always written out and the icon only reinforces it: color never
 * carries the classification on its own (RNF-USA-05).
 */
export function ClinicalBadge({
  tone,
  label,
  icon: Icon,
}: {
  tone: ClinicalTone
  label: string
  icon?: LucideIcon
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium',
        CLINICAL_TONE_CLASSES[tone],
      )}
    >
      {Icon && <Icon size={15} strokeWidth={2} aria-hidden="true" />}
      {label}
    </span>
  )
}
