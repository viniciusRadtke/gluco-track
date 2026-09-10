import { useContext } from 'react'

import { SessionContext, type SessionState } from './session-context'

export function useSession(): SessionState {
  const state = useContext(SessionContext)
  if (!state) {
    throw new Error('useSession must be used inside a SessionProvider')
  }
  return state
}
