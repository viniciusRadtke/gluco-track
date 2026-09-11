import { useCallback, useEffect, useState } from 'react'

import { DEFAULT_THRESHOLDS, type Thresholds } from '@/lib/clinical'
import { fetchPatientSettings } from '@/lib/records'

/**
 * The patient's configured thresholds, used to classify a value as it is typed.
 *
 * Two readings of the same load, because two screens need different things
 * from it. `thresholds` always holds usable numbers: classification is
 * advisory, so a failed load is not something the patient can act on and the
 * recording forms carry on with the documented defaults (§5.1). `configured`
 * holds the row itself and is null until it has actually been read, so the
 * settings screen never offers the defaults for editing over values it failed
 * to load — saving those would overwrite the patient's own configuration.
 */
export function usePatientSettings(patientId: string | null): {
  thresholds: Thresholds
  configured: Thresholds | null
  loading: boolean
  error: string | null
  reload: () => void
} {
  const [configured, setConfigured] = useState<Thresholds | null>(null)
  const [loading, setLoading] = useState(patientId !== null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => {
    setAttempt((previous) => previous + 1)
  }, [])

  useEffect(() => {
    if (!patientId) {
      setConfigured(null)
      setError(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    fetchPatientSettings(patientId)
      .then((settings) => {
        if (!active) return
        setConfigured(settings)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (!active) return
        console.error('Could not load patient settings; falling back to defaults.', cause)
        setConfigured(null)
        setError((cause as Error).message)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [patientId, attempt])

  return { thresholds: configured ?? DEFAULT_THRESHOLDS, configured, loading, error, reload }
}
