import { useEffect, useState, type ReactNode } from 'react'

import { supabase } from '@/lib/supabase'
import { devSignIn } from './dev-sign-in'
import { SessionContext, type SessionState } from './session-context'

/**
 * Owns the Supabase session and the signed-in user's role.
 *
 * The role and the patient link are read from the database rather than kept in
 * the token, because they are administrative facts the user cannot change: the
 * caregiver's read-only access is enforced by the row level security policies
 * (RF-AUT-06), and this only mirrors it so the interface can explain itself.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  // `undefined` while the stored session is still being read; `null` once we
  // know there is no one signed in.
  const [userId, setUserId] = useState<string | null | undefined>(undefined)
  const [state, setState] = useState<SessionState>({ status: 'loading' })

  useEffect(() => {
    // The callback deliberately does no Supabase work of its own: calls made
    // from inside it run while the client holds its auth lock and can deadlock.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (userId !== null) {
      return
    }
    let active = true
    devSignIn().catch((error: unknown) => {
      if (active) {
        setState({ status: 'error', message: (error as Error).message })
      }
    })
    return () => {
      active = false
    }
  }, [userId])

  useEffect(() => {
    if (userId === undefined) {
      return
    }
    if (userId === null) {
      setState({ status: 'signed-out' })
      return
    }

    let active = true

    async function loadProfile(id: string) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', id)
        .single()

      if (!active) return

      if (error || !profile) {
        setState({
          status: 'error',
          message: error?.message ?? 'Perfil não encontrado para a conta atual.',
        })
        return
      }

      if (profile.role === 'patient') {
        setState({ status: 'signed-in', userId: id, role: 'patient', patientId: id })
        return
      }

      const { data: link } = await supabase
        .from('patient_access')
        .select('patient_id')
        .eq('caregiver_id', id)
        .maybeSingle()

      if (!active) return

      setState({
        status: 'signed-in',
        userId: id,
        role: 'caregiver',
        patientId: link?.patient_id ?? null,
      })
    }

    setState({ status: 'loading' })
    void loadProfile(userId)

    return () => {
      active = false
    }
  }, [userId])

  return <SessionContext value={state}>{children}</SessionContext>
}
