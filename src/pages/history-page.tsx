import { useState } from 'react'
import { Link } from 'react-router'

import { useHistory } from '@/app/history/use-history'
import { useSession } from '@/app/session/use-session'
import { usePatientSettings } from '@/app/settings/use-patient-settings'
import {
  HISTORY_KIND_LABEL,
  HISTORY_PERIODS,
  type HistoryKindFilter,
  type HistoryPeriodValue,
} from '@/components/history/filter-options'
import { HistoryFilters } from '@/components/history/history-filters'
import { HistoryList } from '@/components/history/history-list'
import { Button } from '@/components/ui/button'

/** A quiet panel for the states in which no list can be shown. */
function Notice({ children }: { children: string }) {
  return (
    <div className="border-border-base bg-surface-raised rounded-xl border p-6">
      <p className="text-text-muted text-[0.95rem]">{children}</p>
    </div>
  )
}

/**
 * Thirty days on arrival: long enough to cover the interval between
 * appointments, short enough that the first screen is not a year of readings.
 */
const DEFAULT_PERIOD: HistoryPeriodValue = '30'

/**
 * The history: every entry of every kind, newest first, filtered by type and by
 * period (RF-HIS-01, RF-HIS-02).
 *
 * Both roles reach this screen. The caregiver's access is read-only by policy
 * (RF-AUT-06) and nothing here writes, so the only difference is that the empty
 * state offers the patient a way to record the first measurement.
 */
export function HistoryPage() {
  // Every hook runs before any early return: the session state decides what is
  // displayed, never whether a hook is called.
  const session = useSession()
  const patientId = session.status === 'signed-in' ? session.patientId : null
  const { thresholds } = usePatientSettings(patientId)

  const [kind, setKind] = useState<HistoryKindFilter>('all')
  const [period, setPeriod] = useState<HistoryPeriodValue>(DEFAULT_PERIOD)
  const days = HISTORY_PERIODS.find((option) => option.value === period)?.days ?? null

  const { entries, loading, error, reload } = useHistory({ patientId, days })

  if (session.status === 'loading') {
    return <Notice>Carregando a sessão.</Notice>
  }

  if (session.status === 'signed-out') {
    return <Notice>É necessário entrar na conta para ver o histórico.</Notice>
  }

  if (session.status === 'error') {
    return <Notice>{session.message}</Notice>
  }

  if (!patientId) {
    return <Notice>Não foi possível identificar o paciente desta conta.</Notice>
  }

  // The type filter is applied here rather than in the query: the period is
  // already loaded, so switching between the three kinds is immediate.
  const visible = kind === 'all' ? entries : entries.filter((entry) => entry.kind === kind)

  return (
    <div className="flex flex-col gap-6">
      <HistoryFilters
        kind={kind}
        period={period}
        onKindChange={setKind}
        onPeriodChange={setPeriod}
      />

      {loading && <Notice>Carregando os registros.</Notice>}

      {!loading && error && (
        <div className="border-border-base bg-surface-raised rounded-xl border p-6">
          <p role="alert" className="text-clinical-alert text-[0.95rem]">
            {error}
          </p>
          <Button variant="secondary" className="mt-4" onClick={reload}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <EmptyState kind={kind} days={days} canRecord={session.role === 'patient'} />
      )}

      {!loading && !error && visible.length > 0 && (
        <HistoryList entries={visible} thresholds={thresholds} />
      )}
    </div>
  )
}

/**
 * Says plainly that there is nothing to show and, for the patient, points at
 * the one action that changes that. No illustration and no encouragement
 * (§9.4).
 */
function EmptyState({
  kind,
  days,
  canRecord,
}: {
  kind: HistoryKindFilter
  days: number | null
  canRecord: boolean
}) {
  const wholeHistory = kind === 'all' && days === null

  let message: string
  if (kind === 'all') {
    message = wholeHistory
      ? 'Nenhuma medição registrada.'
      : 'Nenhuma medição registrada no período selecionado.'
  } else {
    const label = HISTORY_KIND_LABEL[kind].toLocaleLowerCase('pt-BR')
    message =
      days === null
        ? `Nenhum registro de ${label}.`
        : `Nenhum registro de ${label} no período selecionado.`
  }

  return (
    <div className="border-border-base bg-surface-raised rounded-xl border p-6">
      <p className="text-text-muted text-[0.95rem]">{message}</p>

      {canRecord && (
        <Link
          to="/registrar"
          className="border-border-base text-text hover:bg-surface-sunken mt-4 inline-flex min-h-11 items-center rounded-lg border px-4 text-[0.95rem] font-medium transition-colors"
        >
          Registrar medição
        </Link>
      )}
    </div>
  )
}
