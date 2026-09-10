import { useCallback, useEffect, useState } from 'react'

import { startOfDaysAgo } from '@/lib/datetime'
import { fetchHistory, type HistoryEntry } from '@/lib/records'

/**
 * The patient's entries over a period, newest first (RF-HIS-01).
 *
 * `days` is the number of local days the period covers, or null for the whole
 * history. Only the period reaches the query: the type filter (RF-HIS-02) is
 * applied to the returned list, so switching between glucose, blood pressure
 * and weight costs no round trip.
 *
 * A failed load is reported rather than swallowed. This screen exists to prove
 * an entry was saved, so an empty list must never be the answer to an error.
 */
export function useHistory(input: { patientId: string | null; days: number | null }): {
  entries: HistoryEntry[]
  loading: boolean
  error: string | null
  reload: () => void
} {
  const { patientId, days } = input
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(patientId !== null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => {
    setAttempt((previous) => previous + 1)
  }, [])

  useEffect(() => {
    if (!patientId) {
      setEntries([])
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    fetchHistory({ patientId, since: days === null ? null : startOfDaysAgo(days) })
      .then((loaded) => {
        if (!active) return
        setEntries(loaded)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (!active) return
        setEntries([])
        setError((cause as Error).message)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [patientId, days, attempt])

  return { entries, loading, error, reload }
}
