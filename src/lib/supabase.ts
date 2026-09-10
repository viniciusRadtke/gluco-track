import { createClient } from '@supabase/supabase-js'

import type { Database } from './database.types'

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    )
  }
  return value
}

/**
 * The single Supabase client for the app. The front-end talks to Supabase
 * directly and security lives in the database's row level security policies,
 * so there is no back-end of our own (§8.2).
 *
 * `persistSession` and `autoRefreshToken` are what keep the user signed in
 * across visits and browser restarts (RF-AUT-02). `detectSessionInUrl` is off
 * because sign-in is email and password: no magic link ever returns tokens in
 * the address bar.
 */
export const supabase = createClient<Database>(
  required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  required('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
)
