import { NavLink } from 'react-router'

import { primaryNav, secondaryNav, type NavItem } from '@/app/navigation'
import { cn } from '@/lib/cn'

function SideNavLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.95rem] transition-colors',
          isActive
            ? 'bg-surface-sunken text-text font-medium'
            : 'text-text-muted hover:text-text hover:bg-surface-sunken/60',
        )
      }
    >
      <Icon size={19} strokeWidth={1.75} aria-hidden />
      {item.label}
    </NavLink>
  )
}

/** Persistent navigation for large screens (RNF-RES-04). */
export function SideNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="border-border-base bg-surface-raised fixed inset-y-0 left-0 hidden w-64 flex-col border-r px-3 py-5 lg:flex"
    >
      <div className="px-3 pb-6">
        <span className="text-text text-base font-semibold">Registro de Glicemia</span>
      </div>

      <div className="flex flex-col gap-1">
        {primaryNav.map((item) => (
          <SideNavLink key={item.to} item={item} />
        ))}
      </div>

      <hr className="border-border-base my-4" />

      <div className="flex flex-col gap-1">
        {secondaryNav.map((item) => (
          <SideNavLink key={item.to} item={item} />
        ))}
      </div>
    </nav>
  )
}
