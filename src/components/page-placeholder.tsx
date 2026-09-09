/**
 * Stand-in for screens whose behavior lands in a later pull request. It states
 * plainly what the screen will do, with no filler and no illustration.
 */
export function PagePlaceholder({ description }: { description: string }) {
  return (
    <div className="border-border-base bg-surface-raised rounded-xl border p-6">
      <p className="text-text-muted text-[0.95rem]">{description}</p>
      <p className="text-text-subtle mt-3 text-sm">Tela ainda não implementada.</p>
    </div>
  )
}
