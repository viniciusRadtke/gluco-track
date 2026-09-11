import type { PostgrestError } from '@supabase/supabase-js'

import type { Thresholds } from './clinical'
import type {
  BloodPressureReading,
  GlucoseContext,
  GlucoseReading,
  PatientSettings,
  WeightEntry,
} from './models'
import { supabase } from './supabase'

/**
 * Postgres messages are in English and speak of constraints and policies. The
 * patient gets a single sentence in his own language; the original is kept as
 * the cause so it still reaches the console.
 */
function failed(action: string, error: PostgrestError): Error {
  return new Error(`Não foi possível ${action}. Tente novamente.`, { cause: error })
}

export async function fetchPatientSettings(patientId: string): Promise<PatientSettings | null> {
  const { data, error } = await supabase
    .from('patient_settings')
    .select('*')
    .eq('patient_id', patientId)
    .maybeSingle()

  if (error) {
    throw failed('carregar as faixas configuradas', error)
  }
  return data
}

/**
 * Saves the thresholds the patient configured (RF-CFG-01 … RF-CFG-03).
 *
 * The row is created by a trigger when the patient is created, so this updates
 * and never inserts. A caregiver reaching here is refused by the policy, which
 * is the enforcement; the interface only mirrors it (RF-AUT-06).
 */
export async function updatePatientSettings(input: {
  patientId: string
  thresholds: Thresholds
}): Promise<PatientSettings> {
  const { data, error } = await supabase
    .from('patient_settings')
    .update({
      glucose_target_min: input.thresholds.glucose_target_min,
      glucose_target_max: input.thresholds.glucose_target_max,
      alert_low: input.thresholds.alert_low,
      alert_high: input.thresholds.alert_high,
      bp_target_systolic: input.thresholds.bp_target_systolic,
      bp_target_diastolic: input.thresholds.bp_target_diastolic,
    })
    .eq('patient_id', input.patientId)
    .select()
    .single()

  if (error) {
    throw failed('salvar as faixas configuradas', error)
  }
  return data
}

export async function createGlucoseReading(input: {
  patientId: string
  value: number
  context: GlucoseContext
  measuredAt: Date
  note: string | null
}): Promise<GlucoseReading> {
  const { data, error } = await supabase
    .from('glucose_readings')
    .insert({
      patient_id: input.patientId,
      value: input.value,
      context: input.context,
      measured_at: input.measuredAt.toISOString(),
      note: input.note,
    })
    .select()
    .single()

  if (error) {
    throw failed('salvar a medição', error)
  }
  return data
}

export async function createBloodPressureReading(input: {
  patientId: string
  systolic: number
  diastolic: number
  pulse: number | null
  measuredAt: Date
  note: string | null
}): Promise<BloodPressureReading> {
  const { data, error } = await supabase
    .from('blood_pressure_readings')
    .insert({
      patient_id: input.patientId,
      systolic: input.systolic,
      diastolic: input.diastolic,
      pulse: input.pulse,
      measured_at: input.measuredAt.toISOString(),
      note: input.note,
    })
    .select()
    .single()

  if (error) {
    throw failed('salvar a pressão arterial', error)
  }
  return data
}

export async function createWeightEntry(input: {
  patientId: string
  weightKg: number
  measuredAt: Date
  note: string | null
}): Promise<WeightEntry> {
  const { data, error } = await supabase
    .from('weight_entries')
    .insert({
      patient_id: input.patientId,
      weight_kg: input.weightKg,
      measured_at: input.measuredAt.toISOString(),
      note: input.note,
    })
    .select()
    .single()

  if (error) {
    throw failed('salvar o peso', error)
  }
  return data
}

/**
 * RF-GLI-09: tell the patient when a reading already exists for the same day
 * and context. It informs, it never blocks — a day can legitimately hold two
 * fasting readings.
 *
 * The window is the local day, not the UTC day: a reading taken at 06:00 in
 * São Paulo belongs to that morning, not to the previous UTC date (§8.2).
 */
export async function countGlucoseReadingsOnDay(input: {
  patientId: string
  context: GlucoseContext
  day: Date
}): Promise<number> {
  const start = new Date(input.day)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const { count, error } = await supabase
    .from('glucose_readings')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', input.patientId)
    .eq('context', input.context)
    .gte('measured_at', start.toISOString())
    .lt('measured_at', end.toISOString())

  if (error) {
    throw failed('verificar as medições do dia', error)
  }
  return count ?? 0
}

/** The three kinds of measurement, as one list can hold them (RF-HIS-01). */
export type HistoryEntryKind = 'glucose' | 'blood-pressure' | 'weight'

/**
 * One entry of the merged timeline.
 *
 * The three tables have different shapes, so the discriminated union keeps each
 * one's own fields instead of flattening them into a string. The PDF report
 * (RF-REL) needs the same timeline later, which is why this type lives here
 * rather than inside the history screen.
 *
 * `measuredAt` is a `Date`: the column is a UTC timestamp string and every
 * screen that shows it needs it parsed, so it is parsed once, here.
 */
type HistoryEntryBase = { id: string; measuredAt: Date; note: string | null }

export type HistoryEntry =
  | (HistoryEntryBase & { kind: 'glucose'; value: number; context: GlucoseContext })
  | (HistoryEntryBase & {
      kind: 'blood-pressure'
      systolic: number
      diastolic: number
      pulse: number | null
    })
  | (HistoryEntryBase & { kind: 'weight'; weightKg: number })

/**
 * Every entry of every kind from `since` onwards, newest first (RF-HIS-01).
 *
 * `since` is null for the whole history. The three queries run in parallel and
 * are merged in the browser: the volume is a few hundred rows a year, so a
 * database view would buy nothing.
 *
 * The type filter (RF-HIS-02) is applied to the result rather than to the
 * query, so changing it costs no round trip.
 */
export async function fetchHistory(input: {
  patientId: string
  since: Date | null
}): Promise<HistoryEntry[]> {
  const [glucose, bloodPressure, weight] = await Promise.all([
    fetchGlucoseHistory(input),
    fetchBloodPressureHistory(input),
    fetchWeightHistory(input),
  ])

  return [...glucose, ...bloodPressure, ...weight].sort(
    (a, b) => b.measuredAt.getTime() - a.measuredAt.getTime(),
  )
}

async function fetchGlucoseHistory(input: {
  patientId: string
  since: Date | null
}): Promise<HistoryEntry[]> {
  let query = supabase
    .from('glucose_readings')
    .select('id, value, context, measured_at, note')
    .eq('patient_id', input.patientId)

  if (input.since) {
    query = query.gte('measured_at', input.since.toISOString())
  }

  const { data, error } = await query.order('measured_at', { ascending: false })
  if (error) {
    throw failed('carregar o histórico', error)
  }

  return data.map((row) => ({
    kind: 'glucose',
    id: row.id,
    measuredAt: new Date(row.measured_at),
    note: row.note,
    value: row.value,
    context: row.context,
  }))
}

async function fetchBloodPressureHistory(input: {
  patientId: string
  since: Date | null
}): Promise<HistoryEntry[]> {
  let query = supabase
    .from('blood_pressure_readings')
    .select('id, systolic, diastolic, pulse, measured_at, note')
    .eq('patient_id', input.patientId)

  if (input.since) {
    query = query.gte('measured_at', input.since.toISOString())
  }

  const { data, error } = await query.order('measured_at', { ascending: false })
  if (error) {
    throw failed('carregar o histórico', error)
  }

  return data.map((row) => ({
    kind: 'blood-pressure',
    id: row.id,
    measuredAt: new Date(row.measured_at),
    note: row.note,
    systolic: row.systolic,
    diastolic: row.diastolic,
    pulse: row.pulse,
  }))
}

async function fetchWeightHistory(input: {
  patientId: string
  since: Date | null
}): Promise<HistoryEntry[]> {
  let query = supabase
    .from('weight_entries')
    .select('id, weight_kg, measured_at, note')
    .eq('patient_id', input.patientId)

  if (input.since) {
    query = query.gte('measured_at', input.since.toISOString())
  }

  const { data, error } = await query.order('measured_at', { ascending: false })
  if (error) {
    throw failed('carregar o histórico', error)
  }

  return data.map((row) => ({
    kind: 'weight',
    id: row.id,
    measuredAt: new Date(row.measured_at),
    note: row.note,
    weightKg: row.weight_kg,
  }))
}
