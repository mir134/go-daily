// Health Daily Recorder - Shared Types

export interface DailyRecord {
  id: number
  date: string
  period: string
  overall_status: string
  breathing_status: string
  sleep_position: string
  appetite_status: string
  vomit_status: string
  mental_status: string
  emotion_status: string
  is_dialysis_day: boolean
  dialysis_phase: string
  pre_weight: number | null
  post_weight: number | null
  ultrafiltration_volume: number | null
  blood_pressure: string
  oxygen_saturation: number | null
  has_black_stool: boolean
  has_blood_vomiting: boolean
  notes: string
  created_at: string
  updated_at: string
}

export interface AppConfig {
  id: number
  user_name: string
  target_weight: number
  dry_weight: number
  dialysis_schedule: string
  blood_pressure_threshold: string
  oxygen_saturation_threshold: number
  created_at: string
  updated_at: string
}

export interface RiskAlert {
  type: string
  severity: string
  description: string
  date: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
}
