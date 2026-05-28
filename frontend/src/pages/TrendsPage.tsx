import { useEffect, useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { format, subDays, addDays, getDay } from 'date-fns'
import type { DailyRecord, RiskAlert } from '../types'
import { getRecords, getAlerts, getSettings } from '../api/client'
import Card from '../components/Card'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'


const dialysisPhaseMap: Record<string, string> = {
  non_dialysis: '未透析',
  hemodialysis: '血透',
  perfusion: '灌流',
  hemofiltration: '血滤',
}

const overallEmoji: Record<string, string> = {
  good: '🙂',
  normal: '😐',
  uncomfortable: '😟',
  severe: '🚨',
}
const overallLabels: Record<string, string> = {
  good: '好',
  normal: '一般',
  uncomfortable: '不舒服',
  severe: '严重',
}

const appetiteMap: Record<string, number> = { good: 1, little: 2, none: 3 }
const appetiteLabels: Record<string, string> = { good: '吃得好', little: '吃一点', none: '吃不下' }

const breathingMap: Record<string, number> = { no_wheeze: 1, walk_wheeze: 2, sit_wheeze: 3 }
const breathingLabels: Record<string, string> = { no_wheeze: '不喘', walk_wheeze: '走路喘', sit_wheeze: '坐着也喘' }

const vomitMap: Record<string, number> = { none: 0, nausea: 1, vomit: 2, blood: 3 }
const vomitLabels: Record<string, string> = { none: '没有', nausea: '恶心', vomit: '呕吐', blood: '吐血' }

const sleepMap: Record<string, number> = { can: 1, half: 2, cannot: 3 }
const sleepLabels: Record<string, string> = { can: '能', half: '半躺', cannot: '不能' }
const mentalLabels: Record<string, string> = { chatty: '能聊天', listless: '没精神', sleepy: '嗜睡' }

interface CombinedPoint {
  date: string
  fullDate: string
  value?: number
  label?: string
  dialysisLabel?: string
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: CombinedPoint }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg dark:shadow-slate-900/50 p-3 border border-gray-100 dark:border-slate-700 text-sm space-y-1">
      <p className="text-gray-500 dark:text-slate-400">{d.fullDate}</p>
      {d.label != null && (
        <p className="font-semibold text-sky-600 dark:text-sky-400">
          {d.label}
        </p>
      )}
      {d.dialysisLabel != null && (
        <p className="text-red-500 dark:text-red-400 text-xs font-medium">
          💉 {d.dialysisLabel}
        </p>
      )}
    </div>
  )
}

interface TickConfig {
  value: number
  label: string
}

const RANGE_OPTIONS = [
  { label: '7天', value: 7 as const },
  { label: '30天', value: 30 as const },
  { label: '90天', value: 90 as const },
]

type DateRange = 7 | 30 | 90

export default function TrendsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(30)
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [alerts, setAlerts] = useState<RiskAlert[]>([])
  const [dryWeight, setDryWeight] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [dayModal, setDayModal] = useState<{ date: string; morning?: DailyRecord; evening?: DailyRecord } | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [recordsRes, alertsData, settings] = await Promise.all([
          getRecords(1, dateRange * 2),
          getAlerts(),
          getSettings(),
        ])
        setRecords(recordsRes.data)
        setAlerts(alertsData)
        const dw = parseFloat(settings.dry_weight)
        setDryWeight(isNaN(dw) ? null : dw)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dateRange])

  const filteredRecords = useMemo(() => {
    const periodOrder = { morning: 0, evening: 1 } as const
    const startDate = subDays(new Date(), dateRange)
    return records
      .filter((r) => new Date(r.date) >= startDate)
      .sort((a, b) => {
        const da = new Date(a.date).getTime()
        const db = new Date(b.date).getTime()
        if (da !== db) return da - db
        return periodOrder[a.period as keyof typeof periodOrder] - periodOrder[b.period as keyof typeof periodOrder]
      })
  }, [records, dateRange])

  const periodLabel: Record<string, string> = { morning: '上午', evening: '下午' }

  function getDialysisLabel(r: DailyRecord): string | undefined {
    return r.dialysis_phase !== 'non_dialysis' ? (dialysisPhaseMap[r.dialysis_phase] || r.dialysis_phase) : undefined
  }

  function toCombined(
    records: DailyRecord[],
    field: keyof DailyRecord,
    valueMap: Record<string, number>,
    labelMap: Record<string, string>,
  ): CombinedPoint[] {
    const points: CombinedPoint[] = []
    for (const r of records) {
      const raw = r[field]
      if (typeof raw !== 'string' || !(raw in valueMap)) continue
      points.push({
        date: `${format(new Date(r.date), 'd')}/${periodLabel[r.period] ?? ''}`,
        fullDate: `${r.date} ${periodLabel[r.period] ?? ''}`,
        value: valueMap[raw]!,
        label: labelMap[raw] ?? raw,
        dialysisLabel: getDialysisLabel(r),
      })
    }
    return points
  }

  function toCombinedWeight(
    records: DailyRecord[],
    weightField: keyof DailyRecord,
  ): CombinedPoint[] {
    const points: CombinedPoint[] = []
    for (const r of records) {
      const raw = r[weightField] as number | null
      if (raw == null) continue
      points.push({
        date: `${format(new Date(r.date), 'd')}/${periodLabel[r.period] ?? ''}`,
        fullDate: `${r.date} ${periodLabel[r.period] ?? ''}`,
        value: raw,
        label: `${raw} kg`,
        dialysisLabel: getDialysisLabel(r),
      })
    }
    return points
  }

  const appetiteData: CombinedPoint[] = useMemo(
    () => toCombined(filteredRecords.filter((r) => r.appetite_status in appetiteMap), 'appetite_status', appetiteMap, appetiteLabels),
    [filteredRecords],
  )

  const breathingData: CombinedPoint[] = useMemo(
    () => toCombined(filteredRecords.filter((r) => r.breathing_status in breathingMap), 'breathing_status', breathingMap, breathingLabels),
    [filteredRecords],
  )

  const weightData: CombinedPoint[] = useMemo(
    () => toCombinedWeight(
      filteredRecords.filter((r) => r.pre_weight != null),
      'pre_weight',
    ),
    [filteredRecords],
  )

  const sleepData: CombinedPoint[] = useMemo(
    () => toCombined(filteredRecords.filter((r) => r.sleep_position in sleepMap), 'sleep_position', sleepMap, sleepLabels),
    [filteredRecords],
  )

  const vomitData: CombinedPoint[] = useMemo(
    () => toCombined(filteredRecords.filter((r) => r.vomit_status in vomitMap), 'vomit_status', vomitMap, vomitLabels),
    [filteredRecords],
  )

  function renderLineChart(data: CombinedPoint[], _color: string, ticks?: TickConfig[], referenceLine?: { value: number; label: string }) {
    if (!data.length) {
      return <p className="text-gray-400 dark:text-slate-500 text-center py-8">暂无数据</p>
    }

    const domain: [number | 'auto', number | 'auto'] = ticks
      ? [ticks[0].value, ticks[ticks.length - 1].value]
      : ['auto', 'auto']

    const chartMinWidth = Math.max(data.length * 40, 400)

    return (
      <div className="overflow-x-auto">
        <div style={{ width: `${chartMinWidth}px`, minWidth: '100%' }}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <defs>
                <linearGradient id="gradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" fontSize={12} tick={{ fill: '#94a3b8', angle: -45, textAnchor: 'end' }} height={60} />
              <YAxis
                domain={domain}
                ticks={ticks?.map((t) => t.value)}
                tickFormatter={(v: number) => ticks?.find((t) => t.value === v)?.label ?? String(v)}
                fontSize={12}
                width={60}
                tick={{ fill: '#94a3b8' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke="url(#gradient)" strokeWidth={2} dot={(props: { cx: number; cy: number; payload: CombinedPoint }) => {
                const isDialysis = !!props.payload.dialysisLabel
                return isDialysis ? (
                  <g>
                    <circle cx={props.cx} cy={props.cy} r={7} fill="#ef4444" stroke="#fff" strokeWidth={2} />
                    <text x={props.cx} y={props.cy + 1} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={9} fontWeight="bold">透</text>
                  </g>
                ) : (
                  <circle cx={props.cx} cy={props.cy} r={3} fill="#0ea5e9" />
                )
              }} name="记录" />
              {referenceLine && (
                <ReferenceLine y={referenceLine.value} stroke="#ef4444" strokeDasharray="6 3" label={referenceLine.label} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  const calendarDays = useMemo(() => {
    const end = new Date()

    let start: Date
    if (dateRange === 7) {
      const dayOfWeek = end.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      start = addDays(end, mondayOffset)
    } else {
      start = subDays(end, dateRange - 1)
    }

    const recordMap = new Map<string, { morning?: DailyRecord; evening?: DailyRecord }>()
    for (const r of filteredRecords) {
      const g = recordMap.get(r.date) ?? {}
      if (r.period === 'morning') g.morning = r
      else g.evening = r
      recordMap.set(r.date, g)
    }

    const days: { date: string; day: number; isToday: boolean; record?: { morning?: DailyRecord; evening?: DailyRecord } }[] = []
    for (let i = 0; i < dateRange; i++) {
      const d = addDays(start, i)
      const dateStr = format(d, 'yyyy-MM-dd')
      days.push({
        date: dateStr,
        day: d.getDate(),
        isToday: dateStr === format(end, 'yyyy-MM-dd'),
        record: recordMap.get(dateStr),
      })
    }
    return days
  }, [filteredRecords, dateRange])

  function CalendarCell({ day }: { day: { date: string; day: number; isToday: boolean; record?: { morning?: DailyRecord; evening?: DailyRecord } } }) {
    const emoji = day.record?.morning
      ? overallEmoji[day.record.morning.overall_status] || ''
      : day.record?.evening
        ? overallEmoji[day.record.evening.overall_status] || ''
        : ''
    const dialysisLabel = day.record?.morning?.dialysis_phase && day.record.morning.dialysis_phase !== 'non_dialysis'
      ? dialysisPhaseMap[day.record.morning.dialysis_phase] || ''
      : day.record?.evening?.dialysis_phase && day.record.evening.dialysis_phase !== 'non_dialysis'
        ? dialysisPhaseMap[day.record.evening.dialysis_phase] || ''
        : ''
    return (
      <button
        type="button"
        onClick={() => day.record && setDayModal({ date: day.date, ...day.record })}
        disabled={!day.record}
        className={`flex flex-col items-center justify-center rounded-lg p-1 min-h-[52px] text-xs transition-colors ${
          day.record ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600' : 'cursor-default'
        } ${
          day.isToday
            ? 'ring-2 ring-primary dark:ring-primary-light bg-primary/5 dark:bg-primary/10'
            : day.record
              ? 'bg-gray-50 dark:bg-slate-700/50'
              : 'bg-gray-100/50 dark:bg-slate-800/30'
        }`}
      >
        <span className={`font-bold text-sm ${day.isToday ? 'text-primary dark:text-primary-light' : 'text-gray-500 dark:text-slate-400'}`}>
          {day.day}
        </span>
        {emoji && <span className="text-base leading-none">{emoji}</span>}
        {dialysisLabel && <span className="text-[10px] text-red-500 dark:text-red-400 font-medium leading-tight">{dialysisLabel}</span>}
      </button>
    )
  }

  if (loading) return <LoadingSpinner size="lg" />

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">趋势分析</h1>
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                dateRange === opt.value
                  ? 'bg-white dark:bg-slate-700 text-primary dark:text-primary-light shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Card title={dateRange === 7 ? '本周概览' : dateRange === 30 ? '本月概览' : '近期概览'}>
        {dateRange === 7 ? (
          <div className="grid grid-cols-7 gap-1">
            {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
              <div key={w} className="text-center text-xs font-medium text-gray-400 dark:text-slate-500 pb-1">{w}</div>
            ))}
            {calendarDays.map((day) => (
              <CalendarCell key={day.date} day={day} />
            ))}
          </div>
        ) : (
          (() => {
            const end = new Date()
            const start = subDays(end, dateRange - 1)
            const padding = (getDay(start) + 6) % 7
            const cells: React.ReactNode[] = []
            const weekdayHeaders = ['一', '二', '三', '四', '五', '六', '日']
            for (const w of weekdayHeaders) {
              cells.push(<div key={`h-${w}`} className="text-center text-xs font-medium text-gray-400 dark:text-slate-500 pb-1">{w}</div>)
            }
            for (let i = 0; i < padding; i++) {
              cells.push(<div key={`pad-${i}`} />)
            }
            for (const day of calendarDays) {
              cells.push(<CalendarCell key={day.date} day={day} />)
            }
            return <div className="grid grid-cols-7 gap-1">{cells}</div>
          })()
        )}
      </Card>

      <Card title="体重趋势">
        {renderLineChart(weightData, '#0ea5e9', undefined, dryWeight != null ? { value: dryWeight, label: `干体重 ${dryWeight} kg` } : undefined)}
      </Card>

      <Card title="食欲趋势">
        {renderLineChart(appetiteData, '#0ea5e9', [
          { value: 1, label: '吃得好' },
          { value: 2, label: '吃一点' },
          { value: 3, label: '吃不下' },
        ])}
      </Card>

      <Card title="呼吸趋势">
        {renderLineChart(breathingData, '#0ea5e9', [
          { value: 1, label: '不喘' },
          { value: 2, label: '走路喘' },
          { value: 3, label: '坐着也喘' },
        ])}
      </Card>

      <Card title="呕吐趋势">
        {renderLineChart(vomitData, '#0ea5e9', [
          { value: 0, label: '没有' },
          { value: 1, label: '恶心' },
          { value: 2, label: '呕吐' },
          { value: 3, label: '吐血' },
        ])}
      </Card>

      <Card title="平躺能力趋势">
        {renderLineChart(sleepData, '#0ea5e9', [
          { value: 1, label: '能' },
          { value: 2, label: '半躺' },
          { value: 3, label: '不能' },
        ])}
      </Card>

      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-4">风险预警</h2>
        {alerts.length === 0 ? (
          <p className="text-green-600 dark:text-green-400 font-medium">目前没有发现风险趋势 ✅</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <Card key={i} title={`⚠️ ${alert.type}`}>
                <p className="text-gray-600 dark:text-slate-300 mb-2">{alert.description}</p>
                <p className="text-sm text-gray-400 dark:text-slate-500">
                  {alert.date ? format(new Date(alert.date), 'yyyy-MM-dd') : ''}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {dayModal && (
        <Modal
          isOpen={!!dayModal}
          onClose={() => setDayModal(null)}
          title={`记录详情 - ${dayModal.date}`}
        >
          <div className="space-y-4 text-gray-800 dark:text-slate-200">
            {dayModal.morning && (
              <div>
                <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 mb-2">🌅 早上</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><span className="text-gray-500 dark:text-slate-400">整体</span><p className="font-medium">{overallEmoji[dayModal.morning.overall_status] || ''} {overallLabels[dayModal.morning.overall_status] || '未填写'}</p></div>
                  <div><span className="text-gray-500 dark:text-slate-400">呼吸</span><p className="font-medium">{breathingLabels[dayModal.morning.breathing_status] || '未填写'}</p></div>
                  <div><span className="text-gray-500 dark:text-slate-400">食欲</span><p className="font-medium">{appetiteLabels[dayModal.morning.appetite_status] || '未填写'}</p></div>
                  <div><span className="text-gray-500 dark:text-slate-400">精神</span><p className="font-medium">{mentalLabels[dayModal.morning.mental_status] || '未填写'}</p></div>
                  <div><span className="text-gray-500 dark:text-slate-400">透析</span><p className="font-medium">{dialysisPhaseMap[dayModal.morning.dialysis_phase] || '无'}</p></div>
                  <div><span className="text-gray-500 dark:text-slate-400">血压</span><p className="font-medium">{dayModal.morning.blood_pressure || '未填写'}</p></div>
                  <div><span className="text-gray-500 dark:text-slate-400">血糖</span><p className="font-medium">{dayModal.morning.blood_sugar != null ? `${dayModal.morning.blood_sugar} mmol/L` : '未填写'}</p></div>
                  {dayModal.morning.notes && <div className="col-span-2"><span className="text-gray-500 dark:text-slate-400">备注</span><p className="font-medium">{dayModal.morning.notes}</p></div>}
                </div>
              </div>
            )}
            {dayModal.evening && (
              <div className={dayModal.morning ? 'border-t border-gray-200 dark:border-slate-600 pt-4' : ''}>
                <h3 className="text-base font-bold text-amber-600 dark:text-amber-400 mb-2">☀️ 下午</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><span className="text-gray-500 dark:text-slate-400">整体</span><p className="font-medium">{overallEmoji[dayModal.evening.overall_status] || ''} {overallLabels[dayModal.evening.overall_status] || '未填写'}</p></div>
                  <div><span className="text-gray-500 dark:text-slate-400">呼吸</span><p className="font-medium">{breathingLabels[dayModal.evening.breathing_status] || '未填写'}</p></div>
                  <div><span className="text-gray-500 dark:text-slate-400">食欲</span><p className="font-medium">{appetiteLabels[dayModal.evening.appetite_status] || '未填写'}</p></div>
                  <div><span className="text-gray-500 dark:text-slate-400">精神</span><p className="font-medium">{mentalLabels[dayModal.evening.mental_status] || '未填写'}</p></div>
                  <div><span className="text-gray-500 dark:text-slate-400">透析</span><p className="font-medium">{dialysisPhaseMap[dayModal.evening.dialysis_phase] || '无'}</p></div>
                  <div><span className="text-gray-500 dark:text-slate-400">血压</span><p className="font-medium">{dayModal.evening.blood_pressure || '未填写'}</p></div>
                  <div><span className="text-gray-500 dark:text-slate-400">血糖</span><p className="font-medium">{dayModal.evening.blood_sugar != null ? `${dayModal.evening.blood_sugar} mmol/L` : '未填写'}</p></div>
                  {dayModal.evening.notes && <div className="col-span-2"><span className="text-gray-500 dark:text-slate-400">备注</span><p className="font-medium">{dayModal.evening.notes}</p></div>}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
