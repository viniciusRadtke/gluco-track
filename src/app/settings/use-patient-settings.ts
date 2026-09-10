import { useEffect, useState } from 'react'

import { DEFAULT_THRESHOLDS, type Thresholds } from '@/lib/clinical'
import { fetchPatientSettings } from '@/lib/records'

/**
 * The patient's configured thresholds, used to classify a value as it is typed.
 *
 * Classification is advisory, so a failed load is not something the patient can
 * act on: the hook falls back to the documented defaults (§5.1) and the screen
 * stays usable. Saving a measurement never depends on this.
 */
export function usePatientSettings(patientId: string | null): {
  thresholds: Thresholds
  loading: boolean
} {
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS)
  const [loading, setLoading] = useState(patientId !== null)

  useEffect(() => {
    if (!patientId) {
      setThresholds(DEFAULT_THRESHOLDS)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    fetchPatientSettings(patientId)
      .then((settings) => {
        if (!active) return
        setThresholds(settings ?? DEFAULT_THRESHOLDS)
        setLoading(false)
      })
      .catch((error: unknown) => {
        if (!active) return
        console.error('Could not load patient settings; falling back to defaults.', error)
        setThresholds(DEFAULT_THRESHOLDS)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [patientId])

  return { thresholds, loading }
}
