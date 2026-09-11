import { useSession } from '@/app/session/use-session'
import { usePatientSettings } from '@/app/settings/use-patient-settings'
import { SettingsSection } from '@/components/settings/settings-section'
import { ThresholdsForm } from '@/components/settings/thresholds-form'
import { ThresholdsSummary } from '@/components/settings/thresholds-summary'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import type { Thresholds } from '@/lib/clinical'

/** A quiet panel for the states in which nothing can be configured. */
function Notice({ children }: { children: string }) {
  return (
    <div className="border-border-base bg-surface-raised rounded-xl border p-6">
      <p className="text-text-muted text-[0.95rem]">{children}</p>
    </div>
  )
}

/**
 * Configurações: the thresholds every other screen classifies against
 * (RF-CFG-01 … RF-CFG-03) and the theme preference (RF-CFG-04).
 *
 * The defaults are a starting point and never a recommendation (§5.1), which
 * is why this screen exists at all: the physician's targets are still to be
 * confirmed (P-02), so the patient has to be able to enter them himself.
 */
export function SettingsPage() {
  // Every hook runs before any early return: the session state decides what is
  // displayed, never whether a hook is called.
  const session = useSession()
  const patientId = session.status === 'signed-in' ? session.patientId : null
  const { configured, loading, error, reload } = usePatientSettings(patientId)

  if (session.status === 'loading') {
    return <Notice>Carregando a sessão.</Notice>
  }

  if (session.status === 'signed-out') {
    return <Notice>É necessário entrar na conta para ver as configurações.</Notice>
  }

  if (session.status === 'error') {
    return <Notice>{session.message}</Notice>
  }

  const canEdit = session.role === 'patient'

  return (
    <div className="flex flex-col gap-6">
      <SettingsSection
        title="Faixas e alertas"
        description={
          canEdit
            ? 'Os valores usados para classificar cada medição. Ajuste-os conforme a orientação do seu médico.'
            : 'Os valores usados para classificar cada medição. Só o paciente pode alterá-los.'
        }
      >
        <ThresholdsPanel
          patientId={patientId}
          configured={configured}
          canEdit={canEdit}
          loading={loading}
          error={error}
          onRetry={reload}
          onSaved={reload}
        />
      </SettingsSection>

      <SettingsSection
        title="Tema"
        description="Vale para este aparelho e fica guardado para as próximas visitas."
      >
        <ThemeToggle />
      </SettingsSection>
    </div>
  )
}

/**
 * The thresholds, in whichever state the load left them.
 *
 * Nothing is offered for editing until the patient's own row has been read: the
 * hook falls back to the documented defaults so the recording forms stay
 * usable, and saving those defaults over a failed load would quietly replace
 * the configuration.
 */
function ThresholdsPanel({
  patientId,
  configured,
  canEdit,
  loading,
  error,
  onRetry,
  onSaved,
}: {
  patientId: string | null
  configured: Thresholds | null
  canEdit: boolean
  loading: boolean
  error: string | null
  onRetry: () => void
  onSaved: () => void
}) {
  if (!patientId) {
    return (
      <p className="text-text-muted text-sm">
        Não foi possível identificar o paciente desta conta.
      </p>
    )
  }

  if (loading) {
    return <p className="text-text-muted text-sm">Carregando as faixas configuradas.</p>
  }

  if (error) {
    return (
      <div>
        <p role="alert" className="text-clinical-alert text-[0.95rem]">
          {error}
        </p>
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (!configured) {
    return (
      <p className="text-text-muted text-sm">Nenhuma configuração encontrada para esta conta.</p>
    )
  }

  if (!canEdit) {
    return <ThresholdsSummary thresholds={configured} />
  }

  return <ThresholdsForm patientId={patientId} thresholds={configured} onSaved={onSaved} />
}
