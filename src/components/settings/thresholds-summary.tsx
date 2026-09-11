import { THRESHOLD_LABEL, type Thresholds } from '@/lib/clinical'
import { GlucoseBands } from './glucose-bands'

/**
 * The configured thresholds, read only.
 *
 * A caregiver's access is read-only by policy (RF-AUT-06), so the screen shows
 * the values rather than offering controls the database would reject. The
 * numbers are the same ones the history and the report classify against, which
 * is why they are still worth reading here.
 */
export function ThresholdsSummary({ thresholds }: { thresholds: Thresholds }) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-5">
        <h3 className="text-text text-sm font-semibold">Glicemia</h3>
        <GlucoseBands thresholds={thresholds} />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-text text-sm font-semibold">Pressão arterial</h3>
        <dl className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-text-muted text-sm">{THRESHOLD_LABEL.bp_target_systolic}</dt>
            <dd className="tabular text-text text-sm">{thresholds.bp_target_systolic} mmHg</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-text-muted text-sm">{THRESHOLD_LABEL.bp_target_diastolic}</dt>
            <dd className="tabular text-text text-sm">{thresholds.bp_target_diastolic} mmHg</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
