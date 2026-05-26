import { useEffect, useState } from 'react'
import { getAlerts } from '../api/client'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import type { RiskAlert } from '../types'

export default function RiskAlertsPage() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchAlerts = async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await getAlerts()
      setAlerts(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const severityIcon = (severity: string) =>
    severity === 'danger' ? '🔴' : '⚠️'

  const severityLabel = (severity: string) =>
    severity === 'danger' ? '危险' : '警告'

  const severityBadgeClass = (severity: string) =>
    severity === 'danger'
      ? 'bg-red-100 text-red-700 border-red-200'
      : 'bg-orange-100 text-orange-700 border-orange-200'

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">风险预警</h1>
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">风险预警</h1>
        <div className="text-center py-10">
          <p className="text-red-500 mb-4">预警信息加载失败</p>
          <button
            onClick={fetchAlerts}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">风险预警</h1>
        <div className="flex flex-col items-center justify-center py-16">
          <span className="text-5xl mb-4">✓</span>
          <p className="text-lg text-green-600 font-medium">
            目前没有发现风险趋势 ✓
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">风险预警</h1>
      <div className="space-y-4">
        {alerts.map((alert, index) => (
          <Card key={index} title={alert.type}>
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">
                {severityIcon(alert.severity)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-block text-xs font-medium px-2 py-0.5 rounded border ${severityBadgeClass(alert.severity)}`}
                  >
                    {severityLabel(alert.severity)}
                  </span>
                </div>
                <p className="text-text-primary">{alert.description}</p>
                <p className="text-sm text-text-secondary mt-1">{alert.date}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}