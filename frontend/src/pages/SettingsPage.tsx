import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { exportRecords } from '../api/client'
import Card from '../components/Card'
import BigButton from '../components/buttons/BigButton'
import ConfirmDialog from '../components/ConfirmDialog'

const SETTINGS_KEY = 'health_record_settings'

interface Settings {
  patientName: string
  dialysisEnabled: boolean
  dryWeight: string
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { patientName: '', dialysisEnabled: false, dryWeight: '' }
}

function saveSettings(s: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [patientName, setPatientName] = useState('')
  const [dialysisEnabled, setDialysisEnabled] = useState(false)
  const [dryWeight, setDryWeight] = useState('')
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load settings on mount
  useEffect(() => {
    const s = loadSettings()
    setPatientName(s.patientName)
    setDialysisEnabled(s.dialysisEnabled)
    setDryWeight(s.dryWeight)
  }, [])

  const handleSave = () => {
    saveSettings({ patientName, dialysisEnabled, dryWeight })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExport = async () => {
    try {
      const blob = await exportRecords('json')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `records-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Export failed — silently ignore for now
    }
  }

  const handleClear = () => {
    setClearDialogOpen(false)
    // Placeholder: actual delete-all endpoint is future
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">设置</h1>

      {/* Card 1: 患者信息 */}
      <Card title="患者信息" className="mb-4">
        <label className="block text-sm font-medium text-text-secondary mb-1">
          患者姓名
        </label>
        <input
          type="text"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder="请输入患者姓名"
          className="w-full rounded-xl p-4 text-base border-2 border-gray-300 focus:border-primary focus:outline-none transition-all"
        />
        <p className="text-xs text-text-secondary mt-2">
          姓名仅保存在本地，暂不会上传至服务器
        </p>
      </Card>

      {/* Card 2: 透析设置 */}
      <Card title="透析设置" className="mb-4">
        {/* Enable Dialysis */}
        <label className="flex items-center justify-between cursor-pointer mb-4">
          <span className="text-base font-medium">启用透析记录</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={dialysisEnabled}
              onChange={(e) => setDialysisEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-primary transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
          </div>
        </label>

        {/* Dry Weight */}
        {dialysisEnabled && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              干体重 (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={dryWeight}
              onChange={(e) => setDryWeight(e.target.value)}
              placeholder="例如: 60.0"
              className="w-full rounded-xl p-4 text-base border-2 border-gray-300 focus:border-primary focus:outline-none transition-all"
            />
            <p className="text-xs text-text-secondary mt-2">
              设置干体重后，录入透析信息时自动填入并计算脱水量
            </p>
          </div>
        )}
      </Card>

      {/* Save Button */}
      <div className="mb-4">
        <BigButton onClick={handleSave} variant="primary">
          {saved ? '已保存 ✓' : '保存设置'}
        </BigButton>
      </div>

      {/* Card 3: 数据管理 */}
      <Card title="数据管理" className="mb-4">
        <div className="space-y-3">
          <BigButton onClick={handleExport} variant="primary">
            导出全部数据
          </BigButton>
          <BigButton onClick={() => setClearDialogOpen(true)} variant="danger">
            清空全部数据
          </BigButton>
        </div>
      </Card>

      {/* Card 4: 关于 */}
      <Card title="关于" className="mb-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">应用名称</span>
            <span className="font-medium">家庭健康记录</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">版本</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <p className="text-text-secondary text-xs">
              慢病/透析患者每日状态观察系统
            </p>
          </div>
        </div>
      </Card>

      {/* Logout */}
      <div className="mt-8 mb-24">
        <BigButton onClick={handleLogout} variant="danger">
          退出登录
        </BigButton>
      </div>

      {/* Clear Data Confirm Dialog */}
      <ConfirmDialog
        isOpen={clearDialogOpen}
        onConfirm={handleClear}
        onCancel={() => setClearDialogOpen(false)}
        title="清空数据"
        message="此操作不可恢复！清空所有记录数据？"
        confirmText="确认清空"
      />
    </div>
  )
}