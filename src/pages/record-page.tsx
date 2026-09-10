import { useSession } from '@/app/session/use-session'
import { usePatientSettings } from '@/app/settings/use-patient-settings'
import { BloodPressureForm } from '@/components/record/blood-pressure-form'
import { GlucoseForm } from '@/components/record/glucose-form'
import { RecordTabs } from '@/components/record/record-tabs'
import { WeightForm } from '@/components/record/weight-form'

/** A quiet panel for the states in which no form can be shown. */
function Notice({ children }: { children: string }) {
  return (
    <div className="border-border-base bg-surface-raised rounded-xl border p-6">
      <p className="text-text-muted text-[0.95rem]">{children}</p>
    </div>
  )
}

/**
 * The Registrar screen: glucose, blood pressure and weight, three tabs over one
 * panel, with Glicemia open on arrival.
 *
 * Only a patient sees the forms. A caregiver has read-only access by policy
 * (RF-AUT-06), so offering the forms would only produce a rejected write.
 */
export function RecordPage() {
  // Both hooks run on every render, before any early return: the session state
  // decides what is displayed, never whether a hook is called.
  const session = useSession()
  const patientId = session.status === 'signed-in' ? session.patientId : null
  const { thresholds } = usePatientSettings(patientId)

  if (session.status === 'loading') {
    return <Notice>Carregando a sessão.</Notice>
  }

  if (session.status === 'signed-out') {
    return <Notice>É necessário entrar na conta para registrar medições.</Notice>
  }

  if (session.status === 'error') {
    return <Notice>{session.message}</Notice>
  }

  if (session.role !== 'patient') {
    return <Notice>Seu acesso é somente de leitura. O registro é feito pelo paciente.</Notice>
  }

  if (!patientId) {
    return <Notice>Não foi possível identificar o paciente desta conta.</Notice>
  }

  return (
    <RecordTabs>
      {(active) => {
        if (active === 'glucose') {
          return <GlucoseForm patientId={patientId} thresholds={thresholds} />
        }
        if (active === 'blood-pressure') {
          return <BloodPressureForm patientId={patientId} thresholds={thresholds} />
        }
        return <WeightForm patientId={patientId} />
      }}
    </RecordTabs>
  )
}
