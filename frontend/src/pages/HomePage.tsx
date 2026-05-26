import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { DailyRecord } from '../types'
import {
  getTodayRecord,
  getRecordById,
  upsertTodayRecord,
  updateRecord,
} from '../api/client'
import StatusButton from '../components/buttons/StatusButton'
import BigButton from '../components/buttons/BigButton'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'

// ─── Form State ──────────────────────────────────────────────────────────────

interface FormState {
  overall_status: string
  breathing_status: string
  sleep_position: string
  appetite_status: string
  vomit_status: string
  mental_status: string
  emotion_status: string
  is_dialysis_day: boolean
  dialysis_phase: string
  pre_weight: string
  post_weight: string
  ultrafiltration_volume: string
  blood_pressure: string
  oxygen_saturation: string
  has_black_stool: boolean
  has_blood_vomiting: boolean
  notes: string
}

const initialForm: FormState = {
  overall_status: '',
  breathing_status: '',
  sleep_position: '',
  appetite_status: '',
  vomit_status: '',
  mental_status: '',
  emotion_status: '',
  is_dialysis_day: false,
  dialysis_phase: '',
  pre_weight: '',
  post_weight: '',
  ultrafiltration_volume: '',
  blood_pressure: '',
  oxygen_saturation: '',
  has_black_stool: false,
  has_blood_vomiting: false,
  notes: '',
}

// ─── Status Option Configs ──────────────────────────────────────────────────

interface StatusOption {
  emoji: string
  label: string
  value: string
}

const overallOptions: StatusOption[] = [
  { emoji: '🙂', label: '还可以', value: 'good' },
  { emoji: '😐', label: '一般', value: 'normal' },
  { emoji: '😟', label: '不舒服', value: 'uncomfortable' },
  { emoji: '🚨', label: '很难受', value: 'severe' },
]

const breathingOptions: StatusOption[] = [
  { emoji: '😮‍💨', label: '不喘', value: 'no_wheeze' },
  { emoji: '😤', label: '走路喘', value: 'walk_wheeze' },
  { emoji: '😰', label: '坐着也喘', value: 'sit_wheeze' },
]

const sleepOptions: StatusOption[] = [
  { emoji: '🙂', label: '能', value: 'can' },
  { emoji: '😑', label: '半躺', value: 'half' },
  { emoji: '😣', label: '不能', value: 'cannot' },
]

const appetiteOptions: StatusOption[] = [
  { emoji: '😋', label: '吃得好', value: 'good' },
  { emoji: '😐', label: '吃一点', value: 'little' },
  { emoji: '😫', label: '吃不下', value: 'none' },
]

const vomitOptions: StatusOption[] = [
  { emoji: '✅', label: '没有', value: 'none' },
  { emoji: '🤢', label: '恶心', value: 'nausea' },
  { emoji: '🤮', label: '呕吐', value: 'vomit' },
  { emoji: '🩸', label: '吐血', value: 'blood' },
]

const mentalOptions: StatusOption[] = [
  { emoji: '💬', label: '能聊天', value: 'chatty' },
  { emoji: '😵', label: '没精神', value: 'listless' },
  { emoji: '😴', label: '嗜睡', value: 'sleepy' },
]

const emotionOptions: StatusOption[] = [
  { emoji: '😊', label: '平稳', value: 'stable' },
  { emoji: '😤', label: '激动', value: 'agitated' },
  { emoji: '😡', label: '长时间争吵', value: 'quarrel' },
]

const dialysisPhaseOptions: StatusOption[] = [
  { emoji: '⏳', label: '透析前', value: 'pre' },
  { emoji: '✅', label: '透析后', value: 'post' },
  { emoji: '📅', label: '非透析日', value: 'non_dialysis' },
]

// ─── Small Status Button (for inline body status groups) ────────────────────

function SmallStatusButton({
  emoji,
  label,
  selected,
  onClick,
}: {
  emoji: string
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 min-w-0 rounded-lg border py-2 px-1 flex flex-col items-center justify-center transition-all touch-manipulation ${
        selected
          ? 'bg-primary/10 border-primary text-primary'
          : 'bg-white border-gray-200 text-gray-600'
      }`}
    >
      <span className="text-xl mb-0.5">{emoji}</span>
      <span className="text-xs leading-tight text-center">{label}</span>
    </button>
  )
}

// ─── Body Status Card Helper ────────────────────────────────────────────────

function BodyStatusCard({
  title,
  options,
  value,
  onChange,
}: {
  title: string
  options: StatusOption[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Card title={title}>
      <div className="flex gap-2">
        {options.map((opt) => (
          <SmallStatusButton
            key={opt.value}
            emoji={opt.emoji}
            label={opt.label}
            selected={value === opt.value}
            onClick={() => onChange(opt.value)}
          />
        ))}
      </div>
    </Card>
  )
}

// ─── Home Page ──────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const [period, setPeriod] = useState<'morning' | 'evening'>('morning')
  const [form, setForm] = useState<FormState>(initialForm)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showExtra, setShowExtra] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editDate, setEditDate] = useState('')
  const [dryWeight, setDryWeight] = useState<number | null>(null)

  // Load today's record on mount, or load record by ID in edit mode
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (editId) {
        // ── Edit mode: load record by ID ──
        try {
          const record = await getRecordById(Number(editId))
          if (cancelled) return
          setIsEditMode(true)
          setEditDate(record.date)
          setPeriod(record.period as 'morning' | 'evening')
          setForm({
            overall_status: record.overall_status ?? '',
            breathing_status: record.breathing_status ?? '',
            sleep_position: record.sleep_position ?? '',
            appetite_status: record.appetite_status ?? '',
            vomit_status: record.vomit_status ?? '',
            mental_status: record.mental_status ?? '',
            emotion_status: record.emotion_status ?? '',
            is_dialysis_day: record.is_dialysis_day ?? false,
            dialysis_phase: record.dialysis_phase ?? '',
            pre_weight: record.pre_weight?.toString() ?? '',
            post_weight: record.post_weight?.toString() ?? '',
            ultrafiltration_volume: record.ultrafiltration_volume?.toString() ?? '',
            blood_pressure: record.blood_pressure ?? '',
            oxygen_saturation: record.oxygen_saturation?.toString() ?? '',
            has_black_stool: record.has_black_stool ?? false,
            has_blood_vomiting: record.has_blood_vomiting ?? false,
            notes: record.notes ?? '',
          })
        } catch {
          // silently fail — record might not exist
        } finally {
          if (!cancelled) setLoading(false)
        }
      } else {
        // ── Normal mode: load today's record ──
        const record = await getTodayRecord(period)
        if (cancelled) return
        if (record) {
          setForm({
            overall_status: record.overall_status ?? '',
            breathing_status: record.breathing_status ?? '',
            sleep_position: record.sleep_position ?? '',
            appetite_status: record.appetite_status ?? '',
            vomit_status: record.vomit_status ?? '',
            mental_status: record.mental_status ?? '',
            emotion_status: record.emotion_status ?? '',
            is_dialysis_day: record.is_dialysis_day ?? false,
            dialysis_phase: record.dialysis_phase ?? '',
            pre_weight: record.pre_weight?.toString() ?? '',
            post_weight: record.post_weight?.toString() ?? '',
            ultrafiltration_volume: record.ultrafiltration_volume?.toString() ?? '',
            blood_pressure: record.blood_pressure ?? '',
            oxygen_saturation: record.oxygen_saturation?.toString() ?? '',
            has_black_stool: record.has_black_stool ?? false,
            has_blood_vomiting: record.has_blood_vomiting ?? false,
            notes: record.notes ?? '',
          })
        } else {
          // No record for this period — reset form to empty
          setForm(initialForm)
        }
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [period, editId])

  // Load dry weight from settings and auto-fill post_weight
  useEffect(() => {
    try {
      const raw = localStorage.getItem('health_record_settings')
      if (raw) {
        const s = JSON.parse(raw)
        const dw = s.dryWeight ? Number(s.dryWeight) : null
        setDryWeight(dw)
        if (dw && form.is_dialysis_day && !form.post_weight) {
          setForm((prev) => ({ ...prev, post_weight: dw.toString() }))
        }
      }
    } catch { /* ignore */ }
  }, [])

  // Auto-calculate ultrafiltration volume when pre or post weight changes
  useEffect(() => {
    if (!form.is_dialysis_day) return
    const pre = Number(form.pre_weight)
    const post = Number(form.post_weight)
    if (pre > 0 && post > 0) {
      const uf = Math.round((pre - post) * 1000)
      if (uf > 0) {
        setForm((prev) => {
          if (prev.ultrafiltration_volume === uf.toString()) return prev
          return { ...prev, ultrafiltration_volume: uf.toString() }
        })
      }
    }
  }, [form.pre_weight, form.post_weight, form.is_dialysis_day])

  const updateField = useCallback(
    (field: keyof FormState, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setSuccessMessage('')
    try {
      const payload: Partial<DailyRecord> = {
        period: period,
        overall_status: form.overall_status,
        breathing_status: form.breathing_status,
        sleep_position: form.sleep_position,
        appetite_status: form.appetite_status,
        vomit_status: form.vomit_status,
        mental_status: form.mental_status,
        emotion_status: form.emotion_status,
        is_dialysis_day: form.is_dialysis_day,
        dialysis_phase: form.dialysis_phase,
        pre_weight: form.pre_weight ? Number(form.pre_weight) : null,
        post_weight: form.post_weight ? Number(form.post_weight) : null,
        ultrafiltration_volume: form.ultrafiltration_volume
          ? Number(form.ultrafiltration_volume)
          : null,
        blood_pressure: form.blood_pressure,
        oxygen_saturation: form.oxygen_saturation
          ? Number(form.oxygen_saturation)
          : null,
        has_black_stool: form.has_black_stool,
        has_blood_vomiting: form.has_blood_vomiting,
        notes: form.notes,
      }
      if (isEditMode && editId) {
        await updateRecord(Number(editId), { ...payload, date: editDate })
        setSuccessMessage('修改成功')
        setTimeout(() => navigate('/history'), 1500)
      } else {
        await upsertTodayRecord(payload)
        setSuccessMessage('保存成功')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch {
      // silently fail — per requirement no validation messages
    } finally {
      setIsSaving(false)
    }
  }, [form, period, isEditMode, editId, editDate, navigate])

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24 space-y-5">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-gray-800">
        {isEditMode ? `编辑记录 #${editId}` : '今日记录'}
      </h1>

      {/* ── Period Toggle ────────────────────────────────────────── */}
      <div className={`flex gap-2 rounded-xl p-1 ${isEditMode ? 'bg-gray-200' : 'bg-gray-100'}`}>
        <button
          onClick={() => !isEditMode && setPeriod('morning')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
            period === 'morning' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
          }`}
        >
          🌅 早上
        </button>
        <button
          onClick={() => !isEditMode && setPeriod('evening')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
            period === 'evening' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
          }`}
        >
          🌙 晚上
        </button>
      </div>

      {/* ── Section 1: 今天整体状态 ──────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold mb-3">今天整体状态</h2>
        <div className="grid grid-cols-2 gap-3">
          {overallOptions.map((opt) => (
            <StatusButton
              key={opt.value}
              emoji={opt.emoji}
              label={opt.label}
              selected={form.overall_status === opt.value}
              onClick={() => updateField('overall_status', opt.value)}
            />
          ))}
        </div>
      </section>

      {/* ── Section 2: 身体状态 ──────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold mb-3">身体状态</h2>
        <div className="space-y-3">
          <BodyStatusCard
            title="呼吸状态"
            options={breathingOptions}
            value={form.breathing_status}
            onChange={(v) => updateField('breathing_status', v)}
          />
          <BodyStatusCard
            title="平躺能力"
            options={sleepOptions}
            value={form.sleep_position}
            onChange={(v) => updateField('sleep_position', v)}
          />
          <BodyStatusCard
            title="食欲"
            options={appetiteOptions}
            value={form.appetite_status}
            onChange={(v) => updateField('appetite_status', v)}
          />
          <BodyStatusCard
            title="呕吐"
            options={vomitOptions}
            value={form.vomit_status}
            onChange={(v) => updateField('vomit_status', v)}
          />
          <BodyStatusCard
            title="精神状态"
            options={mentalOptions}
            value={form.mental_status}
            onChange={(v) => updateField('mental_status', v)}
          />
          <BodyStatusCard
            title="情绪状态"
            options={emotionOptions}
            value={form.emotion_status}
            onChange={(v) => updateField('emotion_status', v)}
          />
        </div>
      </section>

      {/* ── Section 3: 透析信息 ──────────────────────────────────────────── */}
      <Card title="透析信息">
        {/* Dialysis Toggle */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-base font-medium text-gray-700">是否透析</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateField('is_dialysis_day', true)}
              className={`rounded-lg border px-4 py-1.5 text-sm transition-all touch-manipulation ${
                form.is_dialysis_day
                  ? 'bg-primary/10 border-primary text-primary font-medium'
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              是
            </button>
            <button
              type="button"
              onClick={() => {
                updateField('is_dialysis_day', false)
                updateField('dialysis_phase', '')
                updateField('pre_weight', '')
                updateField('post_weight', '')
                updateField('ultrafiltration_volume', '')
              }}
              className={`rounded-lg border px-4 py-1.5 text-sm transition-all touch-manipulation ${
                !form.is_dialysis_day
                  ? 'bg-primary/10 border-primary text-primary font-medium'
                  : 'bg-white border-gray-200 text-gray-500'
              }`}
            >
              否
            </button>
          </div>
        </div>

        {/* Dialysis Fields (conditional) */}
        {form.is_dialysis_day && (
          <div className="space-y-4">
            {/* Dialysis Phase */}
            <div>
              <span className="block text-sm font-medium text-gray-600 mb-2">
                透析阶段
              </span>
              <div className="flex gap-2">
                {dialysisPhaseOptions.map((opt) => (
                  <SmallStatusButton
                    key={opt.value}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={form.dialysis_phase === opt.value}
                    onClick={() => updateField('dialysis_phase', opt.value)}
                  />
                ))}
              </div>
            </div>

            {/* Dry Weight Reference */}
            {dryWeight && (
              <div className="text-sm text-gray-500 bg-blue-50 rounded-lg px-3 py-2">
                干体重已设置: <span className="font-semibold">{dryWeight} kg</span>
                {form.pre_weight && Number(form.pre_weight) > 0 && (
                  <span className="ml-2">
                    | 需脱水: <span className="font-semibold text-blue-600">
                      {Math.round((Number(form.pre_weight) - dryWeight) * 1000)} ml
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Weight & Volume Inputs */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                透析前体重 (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.pre_weight}
                onChange={(e) => updateField('pre_weight', e.target.value)}
                placeholder="0.0"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base focus:border-primary focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                透析后体重 (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.post_weight}
                onChange={(e) => updateField('post_weight', e.target.value)}
                placeholder={dryWeight ? dryWeight.toString() : '0.0'}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base focus:border-primary focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                脱水量 (ml)
              </label>
              <input
                type="number"
                value={form.ultrafiltration_volume}
                onChange={(e) =>
                  updateField('ultrafiltration_volume', e.target.value)
                }
                placeholder="自动计算"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base focus:border-primary focus:outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">
                输入透析前后体重自动计算脱水量
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* ── Section 4: 额外信息 (Collapsible) ────────────────────────────── */}
      <section>
        <button
          type="button"
          onClick={() => setShowExtra((prev) => !prev)}
          className="w-full flex items-center justify-between text-xl font-bold text-gray-800 mb-3"
        >
          <span>额外信息</span>
          <span
            className={`text-gray-400 text-lg transition-transform ${
              showExtra ? 'rotate-180' : ''
            }`}
          >
            ▼
          </span>
        </button>

        {showExtra && (
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            {/* Blood Pressure */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                血压
              </label>
              <input
                type="text"
                value={form.blood_pressure}
                onChange={(e) => updateField('blood_pressure', e.target.value)}
                placeholder="120/80"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base focus:border-primary focus:outline-none transition-all"
              />
            </div>

            {/* Oxygen Saturation */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                血氧 (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.oxygen_saturation}
                onChange={(e) =>
                  updateField('oxygen_saturation', e.target.value)
                }
                placeholder="98"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base focus:border-primary focus:outline-none transition-all"
              />
            </div>

            {/* Black Stool */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.has_black_stool}
                onChange={(e) =>
                  updateField('has_black_stool', e.target.checked)
                }
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-base text-gray-700">是否黑便</span>
            </label>

            {/* Blood Vomiting */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.has_blood_vomiting}
                onChange={(e) =>
                  updateField('has_blood_vomiting', e.target.checked)
                }
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-base text-gray-700">是否吐血</span>
            </label>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                备注
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="其他需要记录的情况..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base focus:border-primary focus:outline-none transition-all resize-none"
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Save Button ──────────────────────────────────────────────────── */}
      <div className="sticky bottom-4">
        {successMessage && (
          <div className="text-center text-success font-medium mb-2">
            {successMessage}
          </div>
        )}
        <BigButton
          variant="success"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : '保存记录'}
        </BigButton>
      </div>
    </div>
  )
}