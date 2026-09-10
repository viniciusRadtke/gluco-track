import { supabase } from '@/lib/supabase'

/**
 * Temporary bridge until the sign-in screen exists.
 *
 * Every table is behind row level security keyed to `auth.uid()`, so the
 * screens cannot read or write anything without a session. Rather than loosen
 * the policies while the sign-in screen (RF-AUT-01) is still to be built, the
 * development build signs in with credentials read from `.env.local`.
 *
 * The guard below is `import.meta.env.DEV`, which Vite replaces with a literal
 * at build time, so the whole function body is dropped from the production
 * bundle and no credential can reach a deployment.
 *
 * Delete this file, its call site in the session provider and the two
 * `VITE_DEV_PATIENT_*` variables when the sign-in screen lands.
 */
export async function devSignIn(): Promise<void> {
  if (!import.meta.env.DEV) {
    return
  }

  const email = import.meta.env.VITE_DEV_PATIENT_EMAIL
  const password = import.meta.env.VITE_DEV_PATIENT_PASSWORD
  if (!email || !password) {
    return
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(`Development sign-in failed: ${error.message}`)
  }
}
