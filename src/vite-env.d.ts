/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string

  /** Development only; see .env.example. Removed with the sign-in screen. */
  readonly VITE_DEV_PATIENT_EMAIL?: string
  /** Development only; see .env.example. Removed with the sign-in screen. */
  readonly VITE_DEV_PATIENT_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
