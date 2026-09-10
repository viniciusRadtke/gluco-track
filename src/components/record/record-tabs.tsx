import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

export type RecordTabId = 'glucose' | 'blood-pressure' | 'weight'

const TABS: { id: RecordTabId; label: string }[] = [
  { id: 'glucose', label: 'Glicemia' },
  { id: 'blood-pressure', label: 'Pressão' },
  { id: 'weight', label: 'Peso' },
]

/**
 * The three kinds of measurement, as a real tab list: arrow keys move between
 * tabs and only the selected one is in the tab order, which is what a screen
 * reader and a keyboard user expect of `role="tablist"`.
 *
 * Glicemia is selected on mount. RF-GLI-05 caps a glucose entry at three
 * interactions — open, type, save — so making the patient press a tab first
 * would be a fourth.
 *
 * Only the selected panel is rendered, so each form starts from a clean state
 * and the glucose input can take focus whenever its tab comes back.
 */
export function RecordTabs({ children }: { children: (active: RecordTabId) => ReactNode }) {
  const [active, setActive] = useState<RecordTabId>('glucose')
  const tabRefs = useRef(new Map<RecordTabId, HTMLButtonElement | null>())

  function select(id: RecordTabId) {
    setActive(id)
    tabRefs.current.get(id)?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = TABS.findIndex((tab) => tab.id === active)
    let next = current

    if (event.key === 'ArrowRight') next = (current + 1) % TABS.length
    else if (event.key === 'ArrowLeft') next = (current - 1 + TABS.length) % TABS.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = TABS.length - 1
    else return

    event.preventDefault()
    const target = TABS[next]
    if (target) select(target.id)
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Tipo de medição"
        className="border-border-base bg-surface-sunken flex gap-1 rounded-xl border p-1"
        onKeyDown={handleKeyDown}
      >
        {TABS.map((tab) => {
          const selected = tab.id === active
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current.set(tab.id, node)
              }}
              type="button"
              role="tab"
              id={`record-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`record-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={cn(
                'flex-1 rounded-lg px-3 py-2.5 text-[0.95rem] transition-colors',
                selected
                  ? 'bg-surface-raised text-text border-border-base border font-semibold'
                  : 'text-text-muted hover:text-text font-medium',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`record-panel-${active}`}
        aria-labelledby={`record-tab-${active}`}
        className="border-border-base bg-surface-raised rounded-xl border p-4 sm:p-6"
      >
        {children(active)}
      </div>
    </div>
  )
}
