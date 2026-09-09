import { Monitor, Moon, Sun } from 'lucide-react'

import { useTheme } from '@/app/theme/use-theme'
import { cn } from '@/lib/cn'
import type { ThemePreference } from '@/app/theme/theme-context'

const OPTIONS: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Tema claro', icon: Sun },
  { value: 'dark', label: 'Tema escuro', icon: Moon },
  { value: 'system', label: 'Seguir o sistema', icon: Monitor },
]

/**
 * Three-way theme control (RF-CFG-04). `system` is offered explicitly so the
 * user can go back to following the operating system after picking a theme.
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="border-border-base bg-surface-raised inline-flex rounded-lg border p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = preference === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => setPreference(value)}
            className={cn(
              'flex size-9 items-center justify-center rounded-md transition-colors',
              selected
                ? 'bg-surface-sunken text-text'
                : 'text-text-subtle hover:text-text cursor-pointer',
            )}
          >
            <Icon size={18} strokeWidth={1.75} aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
