import type { Database } from './database.types'

/**
 * Readable aliases over the generated database types. `database.types.ts` is
 * produced by `npm run db:types` and must not be edited by hand, so anything
 * we name ourselves lives here.
 */
type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

export type UserRole = Enums['user_role']
export type GlucoseContext = Enums['glucose_context']

export type Profile = Tables['profiles']['Row']
export type PatientSettings = Tables['patient_settings']['Row']

export type GlucoseReading = Tables['glucose_readings']['Row']
export type NewGlucoseReading = Tables['glucose_readings']['Insert']

export type BloodPressureReading = Tables['blood_pressure_readings']['Row']
export type NewBloodPressureReading = Tables['blood_pressure_readings']['Insert']

export type WeightEntry = Tables['weight_entries']['Row']
export type NewWeightEntry = Tables['weight_entries']['Insert']
