import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { DailyRecord } from '../types'
import {
  getTodayRecord,
  getRecordById,
  upsertTodayRecord,
  updateRecord,
  getSettings,
} from '../api/client'
import StatusButton from '../components/buttons/StatusButton'
import BigButton from '../components/buttons/BigButton'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import AnimatedOverallIcon from '../components/AnimatedOverallIcon'

interface FormState {
  overall_status: string
  breathing_status: string
  sleep_position: string
  appetite_status: string
  vomit_status: string
  mental_status: string
  emotion_status: string
  dialysis_phase: string
  pre_weight: string
  post_weight: string
  ultrafiltration_volume: string
  blood_pressure: string
  oxygen_saturation: string
  blood_sugar: string
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
  dialysis_phase: '',
  pre_weight: '',
  post_weight: '',
  ultrafiltration_volume: '',
  blood_pressure: '',
  oxygen_saturation: '',
  blood_sugar: '',
  has_black_stool: false,
  has_blood_vomiting: false,
  notes: '',
}

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
  { emoji: '😊', label: '不喘', value: 'no_wheeze' },
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
  { emoji: '📅', label: '非透析日', value: 'non_dialysis' },
  { emoji: '🩸', label: '血透', value: 'hemodialysis' },
  { emoji: '💉', label: '灌流', value: 'perfusion' },
  { emoji: '🔬', label: '血滤', value: 'hemofiltration' },
]

const sectionIcons: Record<string, string> = {
  overall: '❤️',
  body: '🫁',
  dialysis: '🩸',
  extra: '📋',
}

function DynamicOption({
  emoji,
  label,
  selected,
  onClick,
  large,
}: {
  emoji: string
  label: string
  selected: boolean
  onClick: () => void
  large?: boolean
}) {
  const [animKey, setAnimKey] = useState(0)

  const handleClick = () => {
    setAnimKey(k => k + 1)
    onClick()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex-1 min-w-0 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 touch-manipulation cursor-pointer active:scale-95 ${
        large ? 'py-4 px-2' : 'py-3 px-1'
      } ${
        selected
          ? 'bg-primary/10 dark:bg-primary/20 border-primary dark:border-primary-light shadow-md'
          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-primary/50 dark:hover:border-primary-light/50 hover:shadow-sm'
      }`}
    >
      <span
        key={`emoji-${animKey}`}
        className={`${large ? 'text-4xl mb-1.5' : 'text-xl mb-0.5'} block leading-none ${selected ? 'animate-bounce-in' : ''}`}
      >
        {emoji}
      </span>
      <span className={`${large ? 'text-base' : 'text-xs'} leading-tight text-center font-medium ${
        selected
          ? 'text-primary dark:text-primary-light'
          : 'text-gray-600 dark:text-slate-300'
      }`}>
        {label}
      </span>
    </button>
  )
}

function BodyStatusCard({
  title,
  options,
  value,
  onChange,
  delay,
}: {
  title: string
  options: StatusOption[]
  value: string
  onChange: (v: string) => void
  delay?: number
}) {
  return (
    <Card title={title} delay={delay}>
      <div className="flex gap-2">
        {options.map((opt) => (
          <DynamicOption
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
  const [showBody, setShowBody] = useState<boolean | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editDate, setEditDate] = useState('')
  const [dryWeight, setDryWeight] = useState<number | null>(null)
  const [dialysisEnabled, setDialysisEnabled] = useState(false)
  const [otherPeriodExists, setOtherPeriodExists] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (editId) {
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
            dialysis_phase: record.dialysis_phase ?? '',
            pre_weight: record.pre_weight?.toString() ?? '',
            post_weight: record.post_weight?.toString() ?? '',
            ultrafiltration_volume: record.ultrafiltration_volume?.toString() ?? '',
            blood_pressure: record.blood_pressure ?? '',
            oxygen_saturation: record.oxygen_saturation?.toString() ?? '',
            blood_sugar: record.blood_sugar?.toString() ?? '',
            has_black_stool: record.has_black_stool ?? false,
            has_blood_vomiting: record.has_blood_vomiting ?? false,
            notes: record.notes ?? '',
          })
        } catch {
        } finally {
          if (!cancelled) setLoading(false)
        }
      } else {
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
            dialysis_phase: record.dialysis_phase ?? '',
            pre_weight: record.pre_weight?.toString() ?? '',
            post_weight: record.post_weight?.toString() ?? '',
            ultrafiltration_volume: record.ultrafiltration_volume?.toString() ?? '',
            blood_pressure: record.blood_pressure ?? '',
            oxygen_saturation: record.oxygen_saturation?.toString() ?? '',
            blood_sugar: record.blood_sugar?.toString() ?? '',
            has_black_stool: record.has_black_stool ?? false,
            has_blood_vomiting: record.has_blood_vomiting ?? false,
            notes: record.notes ?? '',
          })
        } else {
          setForm(initialForm)
        }
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [period, editId])

  useEffect(() => {
    getSettings().then((s) => {
      setDialysisEnabled(s.dialysis_enabled)
      const dw = s.dry_weight ? Number(s.dry_weight) : null
      setDryWeight(dw)
      if (dw && !form.post_weight) {
        setForm((prev) => ({ ...prev, post_weight: dw.toString() }))
      }
    })
  }, [])

  useEffect(() => {
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
  }, [form.pre_weight, form.post_weight])

  // Detect if the other period already has a record today
  useEffect(() => {
    if (isEditMode) return
    const other = period === 'morning' ? 'evening' : 'morning'
    getTodayRecord(other).then((r) => setOtherPeriodExists(r != null))
  }, [period, isEditMode])

  // Auto-toggle body section & auto-fill best values when good
  useEffect(() => {
    if (form.overall_status === 'good') {
      setShowBody(false)
      setForm((prev) => ({
        ...prev,
        breathing_status: 'no_wheeze',
        sleep_position: 'can',
        appetite_status: 'good',
        vomit_status: 'none',
        mental_status: 'chatty',
        emotion_status: 'stable',
      }))
    } else if (form.overall_status) {
      setShowBody(true)
    } else {
      setShowBody(true)
    }
  }, [form.overall_status])

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
        is_dialysis_day: form.dialysis_phase !== '' && form.dialysis_phase !== 'non_dialysis',
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
        blood_sugar: form.blood_sugar
          ? Number(form.blood_sugar)
          : null,
        has_black_stool: form.has_black_stool,
        has_blood_vomiting: form.has_blood_vomiting,
        notes: form.notes,
      }
      if (isEditMode && editId) {
        await updateRecord(Number(editId), { ...payload, date: editDate })
        setSuccessMessage('✅ 修改成功')
        setTimeout(() => navigate('/history'), 1500)
      } else {
        await upsertTodayRecord(payload)
        setSuccessMessage('✅ 保存成功')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch {
    } finally {
      setIsSaving(false)
    }
  }, [form, period, isEditMode, editId, editDate, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-cyan-50 dark:bg-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cyan-50 dark:bg-slate-900 px-4 pt-4 pb-28 space-y-5 transition-colors duration-300">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">
          {isEditMode ? `编辑记录 #${editId}` : '📝 今日记录'}
        </h1>
        {!isEditMode && (
          <div className="text-xs text-gray-400 dark:text-slate-500">
            {period === 'morning' ? '🌅 早上好！' : '🌙 晚上好！'}
          </div>
        )}
      </div>

      {/* Period Toggle */}
      <div className={`flex gap-2 rounded-xl p-1.5 animate-slide-up ${
        isEditMode
          ? 'bg-gray-200 dark:bg-slate-700'
          : 'bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm'
      }`} style={{ animationDelay: '50ms' }}>
        <button
          onClick={() => !isEditMode && setPeriod('morning')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-base font-bold transition-all duration-200 cursor-pointer active:scale-95 relative ${
            period === 'morning'
              ? 'bg-white dark:bg-slate-700 text-primary dark:text-primary-light shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
          }`}
        >
          🌅 早上
          {!isEditMode && period !== 'morning' && otherPeriodExists && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
          )}
        </button>
        <button
          onClick={() => !isEditMode && setPeriod('evening')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-base font-bold transition-all duration-200 cursor-pointer active:scale-95 relative ${
            period === 'evening'
              ? 'bg-white dark:bg-slate-700 text-primary dark:text-primary-light shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
          }`}
        >
          🌙 晚上
          {!isEditMode && period !== 'evening' && otherPeriodExists && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
          )}
        </button>
      </div>

      {/* Section 1: 今天整体状态 */}
      <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <span className="animate-heartbeat inline-block">{sectionIcons.overall}</span>
          今天整体状态
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {overallOptions.map((opt) => (
            <StatusButton
              key={opt.value}
              label={opt.label}
              selected={form.overall_status === opt.value}
              onClick={() => updateField('overall_status', opt.value)}
              renderIcon={() => (
                <AnimatedOverallIcon
                  status={opt.value as 'good' | 'normal' | 'uncomfortable' | 'severe'}
                  selected={form.overall_status === opt.value}
                />
              )}
            />
          ))}
        </div>
      </section>

      {/* Section 2: 身体状态 (collapsible) */}
      <section className="animate-slide-up" style={{ animationDelay: '150ms' }}>
        <button
          type="button"
          onClick={() => setShowBody((prev) => prev === null ? false : !prev)}
          className="w-full flex items-center justify-between text-xl font-bold text-gray-800 dark:text-slate-100 mb-3 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <span className="flex items-center gap-2">
            <span className="animate-float inline-block">{sectionIcons.body}</span>
            身体状态
            {!showBody && (
              <span className="text-xs font-normal text-gray-400 dark:text-slate-500 ml-2">点击展开</span>
            )}
          </span>
          <span className="text-gray-400 dark:text-slate-500 text-lg">
            {showBody ? '▼' : '▶'}
          </span>
        </button>

        {showBody && (
          <div className="space-y-3">
            <BodyStatusCard
              title="呼吸状态"
              options={breathingOptions}
              value={form.breathing_status}
              onChange={(v) => updateField('breathing_status', v)}
              delay={0}
            />
            <BodyStatusCard
              title="平躺能力"
              options={sleepOptions}
              value={form.sleep_position}
              onChange={(v) => updateField('sleep_position', v)}
              delay={50}
            />
            <BodyStatusCard
              title="食欲"
              options={appetiteOptions}
              value={form.appetite_status}
              onChange={(v) => updateField('appetite_status', v)}
              delay={100}
            />
            <BodyStatusCard
              title="呕吐"
              options={vomitOptions}
              value={form.vomit_status}
              onChange={(v) => updateField('vomit_status', v)}
              delay={150}
            />
            <BodyStatusCard
              title="精神状态"
              options={mentalOptions}
              value={form.mental_status}
              onChange={(v) => updateField('mental_status', v)}
              delay={200}
            />
            <BodyStatusCard
              title="情绪状态"
              options={emotionOptions}
              value={form.emotion_status}
              onChange={(v) => updateField('emotion_status', v)}
              delay={250}
            />
          </div>
        )}
      </section>

      {/* Section 3: 透析信息 */}
      {dialysisEnabled && (
        <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <span>{sectionIcons.dialysis}</span>
            透析信息
          </h2>
          <Card title="" delay={0}>
            <div className="space-y-4">
              <div>
                <span className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">
                  透析类型
                </span>
                <div className="flex gap-2">
                  {dialysisPhaseOptions.map((opt) => (
                    <DynamicOption
                      key={opt.value}
                      emoji={opt.emoji}
                      label={opt.label}
                      selected={form.dialysis_phase === opt.value}
                      onClick={() => updateField('dialysis_phase', opt.value)}
                    />
                  ))}
                </div>
              </div>

              {dryWeight && form.dialysis_phase !== 'non_dialysis' && (
                <div className="text-sm text-gray-500 dark:text-slate-400 bg-cyan-50 dark:bg-slate-700/50 rounded-xl px-4 py-2.5 border border-cyan-100 dark:border-slate-600">
                  干体重已设置: <span className="font-semibold text-primary dark:text-primary-light">{dryWeight} kg</span>
                  {form.pre_weight && Number(form.pre_weight) > 0 && (
                    <span className="ml-2">
                      | 需脱水: <span className="font-semibold text-danger">
                        {Math.round((Number(form.pre_weight) - dryWeight) * 1000)} ml
                      </span>
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1.5">
                  {form.dialysis_phase === 'non_dialysis' ? '当前体重 (kg)' : '透析前体重 (kg)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.pre_weight}
                  onChange={(e) => updateField('pre_weight', e.target.value)}
                  placeholder="0.0"
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-base text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-primary dark:focus:border-primary-light focus:outline-none transition-all duration-200"
                />
              </div>
              {form.dialysis_phase !== 'non_dialysis' && (
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1.5">
                  透析后体重 (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.post_weight}
                  onChange={(e) => updateField('post_weight', e.target.value)}
                  placeholder={dryWeight ? dryWeight.toString() : '0.0'}
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-base text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-primary dark:focus:border-primary-light focus:outline-none transition-all duration-200"
                />
              </div>
              )}
              {form.dialysis_phase !== 'non_dialysis' && (
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1.5">
                  脱水量 (ml)
                </label>
                <input
                  type="number"
                  value={form.ultrafiltration_volume}
                  onChange={(e) => updateField('ultrafiltration_volume', e.target.value)}
                  placeholder="自动计算"
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-base text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-primary dark:focus:border-primary-light focus:outline-none transition-all duration-200"
                />
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
                  💡 输入透析前后体重自动计算脱水量
                </p>
              </div>
              )}
            </div>
          </Card>
        </section>
      )}

      {/* Section 4: 额外信息 */}
      <section className="animate-slide-up" style={{ animationDelay: '250ms' }}>
        <button
          type="button"
          onClick={() => setShowExtra((prev) => !prev)}
          className="w-full flex items-center justify-between text-xl font-bold text-gray-800 dark:text-slate-100 mb-3 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <span className="flex items-center gap-2">
            <span>{sectionIcons.extra}</span>
            额外信息
            {!showExtra && (
              <span className="text-xs font-normal text-gray-400 dark:text-slate-500 ml-2">点击展开</span>
            )}
          </span>
          <span className="text-gray-400 dark:text-slate-500 text-lg">
            {showExtra ? '▼' : '▶'}
          </span>
        </button>

        {showExtra && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-slate-900/50 p-5 space-y-4 border border-gray-100 dark:border-slate-700">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1.5">
                血压
              </label>
              <input
                type="text"
                value={form.blood_pressure}
                onChange={(e) => updateField('blood_pressure', e.target.value)}
                placeholder="120/80"
                className="w-full rounded-xl border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-base text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-primary dark:focus:border-primary-light focus:outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1.5">
                血氧 (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.oxygen_saturation}
                onChange={(e) => updateField('oxygen_saturation', e.target.value)}
                placeholder="98"
                className="w-full rounded-xl border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-base text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-primary dark:focus:border-primary-light focus:outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1.5">
                血糖 (mmol/L)
              </label>
              <input
                type="number"
                step="0.1"
                min={0}
                value={form.blood_sugar}
                onChange={(e) => updateField('blood_sugar', e.target.value)}
                placeholder="5.6"
                className="w-full rounded-xl border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-base text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-primary dark:focus:border-primary-light focus:outline-none transition-all duration-200"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.has_black_stool}
                onChange={(e) => updateField('has_black_stool', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 dark:border-slate-600 text-primary focus:ring-primary dark:focus:ring-primary-light cursor-pointer"
              />
              <span className="text-base text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-slate-100 transition-colors">
                是否黑便
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.has_blood_vomiting}
                onChange={(e) => updateField('has_blood_vomiting', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 dark:border-slate-600 text-primary focus:ring-primary dark:focus:ring-primary-light cursor-pointer"
              />
              <span className="text-base text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-slate-100 transition-colors">
                是否吐血
              </span>
            </label>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-slate-400 mb-1.5">
            备注
          </label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="其他需要记录的情况..."
            className="w-full rounded-xl border-2 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-base text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-primary dark:focus:border-primary-light focus:outline-none transition-all duration-200 resize-none"
          />
        </div>
      </section>

      {/* Fixed Save Button */}
      <div className="fixed bottom-16 left-0 right-0 z-20 px-4 pb-2 pointer-events-none">
        <div className="max-w-[480px] mx-auto pointer-events-auto">
          {successMessage && (
            <div className="text-center text-success font-bold text-base mb-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl py-2.5 shadow-lg animate-bounce-in">
              {successMessage}
            </div>
          )}
          <BigButton
            variant="success"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? '⏳ 打卡中...' : '✅ 完成打卡'}
          </BigButton>
        </div>
      </div>
    </div>
  )
}
