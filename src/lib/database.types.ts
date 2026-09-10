export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      blood_pressure_readings: {
        Row: {
          created_at: string
          diastolic: number
          id: string
          measured_at: string
          note: string | null
          patient_id: string
          pulse: number | null
          systolic: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          diastolic: number
          id?: string
          measured_at?: string
          note?: string | null
          patient_id: string
          pulse?: number | null
          systolic: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          diastolic?: number
          id?: string
          measured_at?: string
          note?: string | null
          patient_id?: string
          pulse?: number | null
          systolic?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'blood_pressure_readings_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      glucose_readings: {
        Row: {
          context: Database['public']['Enums']['glucose_context']
          created_at: string
          id: string
          measured_at: string
          note: string | null
          patient_id: string
          updated_at: string
          value: number
        }
        Insert: {
          context?: Database['public']['Enums']['glucose_context']
          created_at?: string
          id?: string
          measured_at?: string
          note?: string | null
          patient_id: string
          updated_at?: string
          value: number
        }
        Update: {
          context?: Database['public']['Enums']['glucose_context']
          created_at?: string
          id?: string
          measured_at?: string
          note?: string | null
          patient_id?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: 'glucose_readings_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      patient_access: {
        Row: {
          caregiver_id: string
          created_at: string
          patient_id: string
        }
        Insert: {
          caregiver_id: string
          created_at?: string
          patient_id: string
        }
        Update: {
          caregiver_id?: string
          created_at?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'patient_access_caregiver_id_fkey'
            columns: ['caregiver_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'patient_access_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      patient_settings: {
        Row: {
          alert_high: number
          alert_low: number
          bp_target_diastolic: number
          bp_target_systolic: number
          created_at: string
          glucose_target_max: number
          glucose_target_min: number
          patient_id: string
          updated_at: string
        }
        Insert: {
          alert_high?: number
          alert_low?: number
          bp_target_diastolic?: number
          bp_target_systolic?: number
          created_at?: string
          glucose_target_max?: number
          glucose_target_min?: number
          patient_id: string
          updated_at?: string
        }
        Update: {
          alert_high?: number
          alert_low?: number
          bp_target_diastolic?: number
          bp_target_systolic?: number
          created_at?: string
          glucose_target_max?: number
          glucose_target_min?: number
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'patient_settings_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: Database['public']['Enums']['user_role']
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Relationships: []
      }
      weight_entries: {
        Row: {
          created_at: string
          id: string
          measured_at: string
          note: string | null
          patient_id: string
          updated_at: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          measured_at?: string
          note?: string | null
          patient_id: string
          updated_at?: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          measured_at?: string
          note?: string | null
          patient_id?: string
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: 'weight_entries_patient_id_fkey'
            columns: ['patient_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_patient: { Args: { target_id: string }; Returns: boolean }
      is_patient: { Args: { target_id: string }; Returns: boolean }
    }
    Enums: {
      glucose_context: 'fasting' | 'pre_meal' | 'post_meal' | 'bedtime' | 'random'
      user_role: 'patient' | 'caregiver'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      glucose_context: ['fasting', 'pre_meal', 'post_meal', 'bedtime', 'random'],
      user_role: ['patient', 'caregiver'],
    },
  },
} as const
