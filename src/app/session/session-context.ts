import { createContext } from 'react'

import type { UserRole } from '@/lib/models'

export type SessionState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  /**
   * `patientId` is the patient whose records the session may read. For a
   * patient it is their own id; for a caregiver it is the patient they are
   * linked to. It is null when a caregiver has no link yet, which the
   * database treats as access to nothing.
   */
  | { status: 'signed-in'; userId: string; role: UserRole; patientId: string | null }
  | { status: 'error'; message: string }

export const SessionContext = createContext<SessionState | null>(null)
