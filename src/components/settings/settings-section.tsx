import type { ReactNode } from 'react'

/**
 * One subject of the settings screen: a heading, a line saying what it governs,
 * and the controls. The description is not decoration — it is where the screen
 * says what a value does, so the control itself can stay a bare number.
 */
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="border-border-base bg-surface-raised rounded-xl border p-6">
      <h2 className="text-text text-base font-semibold">{title}</h2>
      <p className="text-text-muted mt-1 text-sm">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}
