import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-[0.95rem] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55'

const variants = {
  // The accent is the one non-clinical use of color in the interface, reserved
  // for the primary action (§9.4).
  primary: 'bg-accent text-accent-foreground hover:bg-accent-hover',
  secondary: 'border-border-base text-text hover:bg-surface-sunken border',
} as const

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(base, variants[variant], className)} {...props} />
}
