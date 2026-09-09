import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router'

import { primaryNav, secondaryNav, type NavItem } from '@/app/navigation'
import { cn } from '@/lib/cn'

const ITEM_CLASSES =
  'flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-xs transition-colors'

function BottomNavLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(ITEM_CLASSES, isActive ? 'text-accent font-medium' : 'text-text-subtle')
      }
    >
      <Icon size={21} strokeWidth={1.75} aria-hidden />
      {item.label}
    </NavLink>
  )
}

/**
 * Bottom navigation for phones (RNF-RES-04). The four most-used destinations
 * stay on the bar; the rest live behind "Mais", as specified in section 9.1.
 */
export function BottomNav() {
  const location = useLocation()

  /*
   * The sheet remembers which route it was opened on, so any navigation closes
   * it as a derived value. Storing a boolean instead would need an effect to
   * reset it, which costs an extra render for no benefit.
   */
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const moreOpen = openedAt === location.pathname
  const setMoreOpen = (open: boolean) => setOpenedAt(open ? location.pathname : null)

  const inSecondary = secondaryNav.some((item) => item.to === location.pathname)

  return (
    <>
      {moreOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMoreOpen(false)}
          className="fixed inset-0 z-30 bg-black/25 lg:hidden"
        />
      )}

      <nav
        aria-label="Navegação principal"
        className="border-border-base bg-surface-raised fixed inset-x-0 bottom-0 z-40 border-t lg:hidden"
      >
        {moreOpen && (
          <div className="border-border-base flex flex-col gap-1 border-b p-2">
            {secondaryNav.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 items-center gap-3 rounded-lg px-3 text-[0.95rem]',
                      isActive ? 'bg-surface-sunken text-text font-medium' : 'text-text-muted',
                    )
                  }
                >
                  <Icon size={19} strokeWidth={1.75} aria-hidden />
                  {item.label}
                </NavLink>
              )
            })}
          </div>
        )}

        <div
          className="flex items-stretch gap-1 px-2 pt-1"
          style={{ paddingBottom: 'calc(0.25rem + env(safe-area-inset-bottom))' }}
        >
          {primaryNav.map((item) => (
            <BottomNavLink key={item.to} item={item} />
          ))}

          <button
            type="button"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              ITEM_CLASSES,
              inSecondary || moreOpen ? 'text-accent font-medium' : 'text-text-subtle',
            )}
          >
            <MoreHorizontal size={21} strokeWidth={1.75} aria-hidden />
            Mais
          </button>
        </div>
      </nav>
    </>
  )
}
