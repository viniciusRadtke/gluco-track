import type { PostgrestError } from '@supabase/supabase-js'

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
