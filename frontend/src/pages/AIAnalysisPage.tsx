import { useEffect, useState, useCallback } from 'react'
import { getAISummary, getAIContext, getAIRiskScore, getSettings } from '../api/client'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import type { SummaryResult, ContextResult, RiskScoreResult, RecordSummary } from '../types'

const overallLabels: Record<string, string> = {
  good: '好',
  normal: '一般',
  uncomfortable: '不舒服',
  severe: '严重',
}

const appetiteLabels: Record<string, string> = {
  good: '吃得好',
  little: '吃一点',
  none: '吃不下',
}

const breathingLabels: Record<string, string> = {
  no_wheeze: '不喘',
  walk_wheeze: '走路喘',
  sit_wheeze: '静息喘',
}

const phaseLabels: Record<string, string> = {
  non_dialysis: '未透析',
  hemodialysis: '血透',
  perfusion: '灌流',
  hemofiltration: '血滤',
}

const factorLabels: Record<string, string> = {
  appetite_decline: '食欲下降',
  breathing_decline: '呼吸困难加重',
  sleep_decline: '平躺能力下降',
}

function labelFor(val: string, map: Record<string, string>): string {
  return map[val] ?? val
}

function trendLabel(trend: string): { emoji: string; text: string; color: string } {
  switch (trend) {
    case 'declining':
      return { emoji: '🔴', text: '恶化中', color: 'text-red-600 dark:text-red-400' }
    case 'improving':
      return { emoji: '🟢', text: '改善中', color: 'text-green-600 dark:text-green-400' }
    case 'stable':
      return { emoji: '✅', text: '稳定', color: 'text-green-600 dark:text-green-400' }
    case 'unstable':
      return { emoji: '🔶', text: '波动', color: 'text-amber-600 dark:text-amber-400' }
    default:
      return { emoji: '❓', text: '数据不足', color: 'text-gray-400 dark:text-slate-500' }
  }
}

function riskDisplay(level: string): { emoji: string; text: string; bg: string } {
  switch (level) {
    case 'high':
      return {
        emoji: '🔴',
        text: '高风险',
        bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
      }
    case 'medium':
      return {
        emoji: '🟡',
        text: '中风险',
        bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
      }
    default:
      return {
        emoji: '🟢',
        text: '低风险',
        bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
      }
  }
}

function todayDateStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}年${m}月${day}日`
}

function TrendRow({
  label,
  trend,
}: {
  label: string
  trend: string
}) {
  const t = trendLabel(trend)
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-700 dark:text-slate-300 font-medium">{label}</span>
      <span className={`inline-flex items-center gap-1 text-sm font-medium ${t.color}`}>
        {t.emoji}
        {t.text}
      </span>
    </div>
  )
}

const periodLabels: Record<string, string> = {
  morning: '上午',
  evening: '下午',
}

function RecordRow({ record }: { record: RecordSummary }) {
  return (
    <tr className="border-b border-gray-100 dark:border-slate-700 last:border-0">
      <td className="py-2 text-sm text-gray-600 dark:text-slate-400 whitespace-nowrap">
        {record.date}
        <span className="ml-1 text-xs text-gray-400 dark:text-slate-500">
          {labelFor(record.period, periodLabels)}
        </span>
      </td>
      <td className="py-2 text-sm text-gray-800 dark:text-slate-200">
        {labelFor(record.overall_status, overallLabels)}
      </td>
      <td className="py-2 text-sm text-gray-800 dark:text-slate-200">
        {labelFor(record.breathing_status, breathingLabels)}
      </td>
      <td className="py-2 text-sm text-gray-800 dark:text-slate-200">
        {labelFor(record.appetite_status, appetiteLabels)}
      </td>
    </tr>
  )
}

export default function AIAnalysisPage() {
  const [summary, setSummary] = useState<SummaryResult | null>(null)
  const [context, setContext] = useState<ContextResult | null>(null)
  const [riskScore, setRiskScore] = useState<RiskScoreResult | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [s, c, r, settings] = await Promise.all([
        getAISummary(),
        getAIContext(),
        getAIRiskScore(),
        getSettings(),
      ])
      setSummary(s)
      setContext(c)
      setRiskScore(r)
      setNotes(settings.notes ?? '')
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 pb-24">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-6">AI 分析</h1>
        <div className="text-center py-16">
          <p className="text-red-500 dark:text-red-400 mb-4">分析数据加载失败</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  const risk = riskScore ? riskDisplay(riskScore.risk_level) : null
  const trend = context?.trend_analysis

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 pb-24 space-y-5 transition-colors duration-300">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">AI 分析</h1>

      <Card title="风险评估">
        <div className="space-y-4">
          <p className="text-sm text-gray-400 dark:text-slate-500">{todayDateStr()}</p>

          {risk && (
            <div className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-base font-bold ${risk.bg}`}>
              <span>{risk.emoji}</span>
              <span>{risk.text}</span>
              {riskScore && (
                <span className="ml-1 text-lg">
                  ({riskScore.risk_score})
                </span>
              )}
            </div>
          )}

          {riskScore && riskScore.factors.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">风险因素</h3>
              <div className="space-y-1">
                {riskScore.factors.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-slate-300">
                      {labelFor(f.name, factorLabels)}
                    </span>
                    <span className="text-gray-500 dark:text-slate-400 font-mono">{f.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {riskScore && riskScore.factors.length === 0 && (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              ✅ 当前未发现明显风险因素
            </p>
          )}
        </div>
      </Card>

      <Card title="近期趋势分析">
        {trend ? (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            <TrendRow label="食欲趋势" trend={trend.appetite} />
            <TrendRow label="呼吸趋势" trend={trend.breathing} />
            <TrendRow label="平躺能力趋势" trend={trend.sleep_position} />
          </div>
        ) : (
          <p className="text-gray-400 dark:text-slate-500 text-sm py-2">暂无趋势数据</p>
        )}
      </Card>

      {summary && (
        <Card title="AI 分析总结">
          <div className="space-y-4">
            {summary.patient_status.key_changes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">主要变化</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-slate-300">
                  {summary.patient_status.key_changes.map((change, i) => (
                    <li key={i}>{change}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">透析分析</h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600 dark:text-slate-400">
                  透析天数: {summary.dialysis_analysis.dialysis_days_count}
                </p>
                {summary.dialysis_analysis.types?.length > 0 && (
                  <p className="text-gray-600 dark:text-slate-400">
                    透析类型: {summary.dialysis_analysis.types.map(t => labelFor(t, phaseLabels)).join('、')}
                  </p>
                )}
                <p
                  className={
                    summary.dialysis_analysis.improving
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-slate-400'
                  }
                >
                  透析日状态改善 {summary.dialysis_analysis.improving ? '是 ✅' : '否'}
                </p>
                <p className="text-gray-600 dark:text-slate-400">
                  透析后连续改善次数: {summary.dialysis_analysis.post_dialysis_improvement_count}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">营养分析</h3>
              <p className="text-sm text-gray-700 dark:text-slate-300">
                食欲趋势: {trendLabel(summary.nutrition_analysis.appetite_trend).emoji}{' '}
                {trendLabel(summary.nutrition_analysis.appetite_trend).text}
              </p>
            </div>

            {summary.warning_signals.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">警告信号</h3>
                <div className="space-y-2">
                  {summary.warning_signals.map((signal, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm text-red-700 dark:text-red-300"
                    >
                      <span className="mt-0.5">⚠️</span>
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.warning_signals.length === 0 && (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✅ 目前没有发现警告信号
              </p>
            )}
          </div>
        </Card>
      )}

      <Card title="最近7天记录">
        {context && context.recent_records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-2 pr-2">日期</th>
                  <th className="py-2 pr-2">整体</th>
                  <th className="py-2 pr-2">呼吸</th>
                  <th className="py-2">食欲</th>
                </tr>
              </thead>
              <tbody>
                {context.recent_records.map((record) => (
                  <RecordRow key={`${record.date}-${record.period}`} record={record} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 dark:text-slate-500 text-sm py-2">暂无近期记录</p>
        )}
      </Card>

      {notes && (
        <Card title="备注">
          <p className="text-gray-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
            {notes}
          </p>
        </Card>
      )}
    </div>
  )
}
