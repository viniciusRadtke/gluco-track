import { useId } from 'react'

import { cn } from '@/lib/cn'
import {
  HISTORY_KIND_OPTIONS,
  HISTORY_PERIODS,
  type HistoryKindFilter,
  type HistoryPeriodValue,
} from './filter-options'

/**
 * One row of filter chips.
 *
 * Radios rather than buttons: the selection reaches assistive technology as a
 * group with one active option, and arrow keys move between them for free.
 * Every chip is at least 44px tall (RNF-USA-03).
 */
function ChipGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string
  options: { value: T; label: string }[]
  value: T
  onChange: (next: T) => void
}) {
  const name = useId()

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-text-muted text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2 pt-1.5">
        {options.map((option) => {
          const selected = option.value === value
          return (
            <label
              key={option.value}
              className={cn(
                'flex min-h-11 cursor-pointer items-center rounded-lg border px-3.5 text-sm transition-colors',
                'has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
                selected
                  ? 'border-border-strong bg-accent-subtle text-text font-semibold'
                  : 'border-border-base text-text-muted hover:bg-surface-sunken',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                className="sr-only"
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Type and period, the two filters the history screen offers (RF-HIS-02). */
export function HistoryFilters({
  kind,
  period,
  onKindChange,
  onPeriodChange,
}: {
  kind: HistoryKindFilter
  period: HistoryPeriodValue
  onKindChange: (next: HistoryKindFilter) => void
  onPeriodChange: (next: HistoryPeriodValue) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <ChipGroup
        legend="Tipo"
        options={HISTORY_KIND_OPTIONS}
        value={kind}
        onChange={onKindChange}
      />
      <ChipGroup
        legend="Período"
        options={HISTORY_PERIODS}
        value={period}
        onChange={onPeriodChange}
      />
    </div>
  )
}
