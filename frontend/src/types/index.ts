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
  blood_sugar: number | null
  has_black_stool: boolean
  has_blood_vomiting: boolean
  notes: string
  created_at: string
  updated_at: string
}

export interface AppSettings {
  patient_name: string
  basic_info: string
  dialysis_enabled: boolean
  dry_weight: string
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

// ─── AI Analysis Types ──────────────────────────────────────────────────────────

export interface RiskFactor {
  name: string
  score: number
}

export interface RiskScoreResult {
  risk_score: number
  risk_level: string
  factors: RiskFactor[]
}

export interface PatientStatus {
  overall_trend: string
  risk_level: string
  key_changes: string[]
}

export interface DialysisAnalysis {
  dialysis_days_count: number
  types: string[]
  improving: boolean
  post_dialysis_improvement_count: number
}

export interface NutritionAnalysis {
  appetite_trend: string
}

export interface SummaryResult {
  patient_status: PatientStatus
  dialysis_analysis: DialysisAnalysis
  nutrition_analysis: NutritionAnalysis
  warning_signals: string[]
}

export interface PatientProfile {
  name: string
  conditions: string[]
}

export interface RecordSummary {
  date: string
  period: string
  overall_status: string
  breathing_status: string
  appetite_status: string
  vomit_status: string
  dialysis_phase: string
  notes: string
}

export interface TrendAnalysis {
  breathing: string
  appetite: string
  sleep_position: string
}

export interface ContextResult {
  patient_profile: PatientProfile
  recent_records: RecordSummary[]
  trend_analysis: TrendAnalysis
}
