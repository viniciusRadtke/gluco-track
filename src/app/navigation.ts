import {
  ChartLine,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Paperclip,
  Plus,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

/**
 * Route paths are written in Portuguese because the address bar is part of the
 * interface the end user sees (RNF-LOC-01). Code identifiers stay in English.
 */

/** Shown in the mobile bottom bar and at the top of the desktop sidebar. */
export const primaryNav: NavItem[] = [
  { to: '/', label: 'Início', icon: LayoutDashboard },
  { to: '/registrar', label: 'Registrar', icon: Plus },
  { to: '/historico', label: 'Histórico', icon: ClipboardList },
  { to: '/graficos', label: 'Gráficos', icon: ChartLine },
]

/** Reached through "Mais" on mobile; always visible in the desktop sidebar. */
export const secondaryNav: NavItem[] = [
  { to: '/exames', label: 'Exames', icon: Paperclip },
  { to: '/relatorio', label: 'Relatório', icon: FileText },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

export const allNavItems: NavItem[] = [...primaryNav, ...secondaryNav]
