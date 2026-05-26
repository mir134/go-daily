import { useEffect, useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { format, subDays } from 'date-fns'
import type { DailyRecord, RiskAlert } from '../types'
import { getRecords, getAlerts } from '../api/client'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'

const appetiteMap: Record<string, number> = { good: 1, little: 2, none: 3 }
const appetiteLabels: Record<string, string> = { good: '吃得好', little: '吃一点', none: '吃不下' }

const breathingMap: Record<string, number> = { no_wheeze: 1, walk_wheeze: 2, sit_wheeze: 3 }
const breathingLabels: Record<string, string> = { no_wheeze: '不喘', walk_wheeze: '走路喘', sit_wheeze: '坐着也喘' }

const vomitMap: Record<string, number> = { none: 0, nausea: 1, vomit: 2, blood: 3 }
const vomitLabels: Record<string, string> = { none: '没有', nausea: '恶心', vomit: '呕吐', blood: '吐血' }

const sleepMap: Record<string, number> = { can: 1, half: 2, cannot: 3 }
const sleepLabels: Record<string, string> = { can: '能', half: '半躺', cannot: '不能' }

interface CombinedPoint {
  date: string
  morningValue?: number
  morningLabel?: string
  eveningValue?: number
  eveningLabel?: string
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
      <p className="text-gray-500 dark:text-slate-400">{d.date}</p>
      {d.morningLabel != null && (
        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
          🌅 早上: {d.morningLabel}
        </p>
      )}
      {d.eveningLabel != null && (
        <p className="font-semibold text-amber-600 dark:text-amber-400">
          🌙 晚上: {d.eveningLabel}
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [recordsRes, alertsData] = await Promise.all([
          getRecords(1, 999),
          getAlerts(),
        ])
        setRecords(recordsRes.data)
        setAlerts(alertsData)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dateRange])

  const filteredRecords = useMemo(() => {
    const startDate = subDays(new Date(), dateRange)
    return records
      .filter((r) => new Date(r.date) >= startDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [records, dateRange])

  function toCombined(
    records: DailyRecord[],
    field: keyof DailyRecord,
    valueMap: Record<string, number>,
    labelMap: Record<string, string>,
  ): CombinedPoint[] {
    const map = new Map<string, { morningValue?: number; morningLabel?: string; eveningValue?: number; eveningLabel?: string }>()
    const dateKey = (r: DailyRecord) => format(new Date(r.date), 'MM/dd')
    for (const r of records) {
      const raw = r[field]
      if (typeof raw !== 'string' || !(raw in valueMap)) continue
      const key = dateKey(r)
      const entry = map.get(key) ?? {}
      const numericVal = valueMap[raw]!
      const label = labelMap[raw] ?? raw
      if (r.period === 'evening') {
        entry.eveningValue = numericVal
        entry.eveningLabel = label
      } else {
        entry.morningValue = numericVal
        entry.morningLabel = label
      }
      map.set(key, entry)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, ...vals }))
  }

  function toCombinedWeight(
    records: DailyRecord[],
    weightField: keyof DailyRecord,
  ): CombinedPoint[] {
    const map = new Map<string, { morningValue?: number; morningLabel?: string; eveningValue?: number; eveningLabel?: string }>()
    const dateKey = (r: DailyRecord) => format(new Date(r.date), 'MM/dd')
    for (const r of records) {
      const raw = r[weightField] as number | null
      if (raw == null) continue
      const key = dateKey(r)
      const entry = map.get(key) ?? {}
      if (r.period === 'evening') {
        entry.eveningValue = raw
        entry.eveningLabel = `${raw} kg`
      } else {
        entry.morningValue = raw
        entry.morningLabel = `${raw} kg`
      }
      map.set(key, entry)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, ...vals }))
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
      filteredRecords.filter((r) => r.is_dialysis_day && r.pre_weight != null),
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

  function renderLineChart(data: CombinedPoint[], morningColor: string, eveningColor: string, ticks?: TickConfig[]) {
    if (!data.length) {
      return <p className="text-gray-400 dark:text-slate-500 text-center py-8">暂无数据</p>
    }

    const domain: [number | 'auto', number | 'auto'] = ticks
      ? [ticks[0].value, ticks[ticks.length - 1].value]
      : ['auto', 'auto']

    return (
      <div className="overflow-x-auto">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" fontSize={12} tick={{ fill: '#94a3b8' }} />
            <YAxis
              domain={domain}
              ticks={ticks?.map((t) => t.value)}
              tickFormatter={(v: number) => ticks?.find((t) => t.value === v)?.label ?? String(v)}
              fontSize={12}
              width={60}
              tick={{ fill: '#94a3b8' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="morningValue" stroke={morningColor} strokeWidth={2} dot={{ r: 3 }} name="早上" />
            <Line type="monotone" dataKey="eveningValue" stroke={eveningColor} strokeWidth={2} dot={{ r: 3 }} name="晚上" />
          </LineChart>
        </ResponsiveContainer>
      </div>
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

      <Card title="食欲趋势">
        {renderLineChart(appetiteData, '#10b981', '#f59e0b', [
          { value: 1, label: '吃得好' },
          { value: 2, label: '吃一点' },
          { value: 3, label: '吃不下' },
        ])}
      </Card>

      <Card title="呼吸趋势">
        {renderLineChart(breathingData, '#10b981', '#f59e0b', [
          { value: 1, label: '不喘' },
          { value: 2, label: '走路喘' },
          { value: 3, label: '坐着也喘' },
        ])}
      </Card>

      <Card title="体重趋势">
        {renderLineChart(weightData, '#10b981', '#f59e0b')}
      </Card>

      <Card title="呕吐趋势">
        {renderLineChart(vomitData, '#10b981', '#f59e0b', [
          { value: 0, label: '没有' },
          { value: 1, label: '恶心' },
          { value: 2, label: '呕吐' },
          { value: 3, label: '吐血' },
        ])}
      </Card>

      <Card title="平躺能力趋势">
        {renderLineChart(sleepData, '#10b981', '#f59e0b', [
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
    </div>
  )
}
