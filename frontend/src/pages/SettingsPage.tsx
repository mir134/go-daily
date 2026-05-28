import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { exportRecords, getSettings, saveSettings } from '../api/client'
import type { AppSettings } from '../types'
import Card from '../components/Card'
import BigButton from '../components/buttons/BigButton'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [patientName, setPatientName] = useState('')
  const [basicInfo, setBasicInfo] = useState('')
  const [dialysisEnabled, setDialysisEnabled] = useState(false)
  const [dryWeight, setDryWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSettings().then((s) => {
      setPatientName(s.patient_name)
      setBasicInfo(s.basic_info)
      setDialysisEnabled(s.dialysis_enabled)
      setDryWeight(s.dry_weight)
      setNotes(s.notes ?? '')
    })
  }, [])

  const handleSave = async () => {
    const settings: AppSettings = {
      patient_name: patientName,
      basic_info: basicInfo,
      dialysis_enabled: dialysisEnabled,
      dry_weight: dryWeight,
      notes: notes,
    }
    await saveSettings(settings)
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
    } catch {}
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-6">设置</h1>

      <Card title="记录者信息" className="mb-4">
        <label className="block text-sm font-medium text-text-secondary dark:!text-slate-400 mb-1">
          记录者姓名
        </label>
        <input
          type="text"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder="请输入记录者姓名"
          className="w-full rounded-xl p-4 text-base border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-primary dark:focus:border-primary-light focus:outline-none transition-all"
        />
        <label className="block text-sm font-medium text-text-secondary dark:!text-slate-400 mb-1 mt-4">
          基本信息
        </label>
        <textarea
          rows={4}
          value={basicInfo}
          onChange={(e) => setBasicInfo(e.target.value)}
          placeholder="年龄、性别、病史等"
          className="w-full rounded-xl p-4 text-base border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-primary dark:focus:border-primary-light focus:outline-none transition-all resize-none"
        />
      </Card>

      <Card title="透析设置" className="mb-4">
        <label className="flex items-center justify-between cursor-pointer mb-4">
          <span className="text-base font-medium text-gray-700 dark:text-slate-300">启用透析记录</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={dialysisEnabled}
              onChange={(e) => setDialysisEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 dark:bg-slate-600 rounded-full peer-checked:bg-primary dark:peer-checked:bg-primary-light transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-slate-200 rounded-full shadow peer-checked:translate-x-5 transition-transform" />
          </div>
        </label>

        {dialysisEnabled && (
          <div>
            <label className="block text-sm font-medium text-text-secondary dark:!text-slate-400 mb-1">
              干体重 (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={dryWeight}
              onChange={(e) => setDryWeight(e.target.value)}
              placeholder="例如: 60.0"
              className="w-full rounded-xl p-4 text-base border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-primary dark:focus:border-primary-light focus:outline-none transition-all"
            />
            <p className="text-xs text-text-secondary dark:!text-slate-400 mt-2">
              设置干体重后，录入透析信息时自动填入并计算脱水量
            </p>
          </div>
        )}
      </Card>

      <Card title="备注" className="mb-4">
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="用于在 AI 分析页面底部显示的备注信息，支持换行"
          className="w-full rounded-xl p-4 text-base border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-primary dark:focus:border-primary-light focus:outline-none transition-all resize-none"
        />
      </Card>

      <div className="mb-4">
        <BigButton onClick={handleSave} variant="primary">
          {saved ? '已保存 ✅' : '保存设置'}
        </BigButton>
      </div>

      <Card title="数据管理" className="mb-4">
        <div className="space-y-3">
          <BigButton onClick={handleExport} variant="primary">
            导出全部数据
          </BigButton>
        </div>
      </Card>

      <Card title="关于" className="mb-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary dark:!text-slate-400">应用名称</span>
            <span className="font-medium text-gray-800 dark:text-slate-200">家庭健康记录</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary dark:!text-slate-400">版本</span>
            <span className="font-medium text-gray-800 dark:text-slate-200">1.0.0</span>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
            <p className="text-text-secondary dark:!text-slate-400 text-xs">
              慢病/透析患者每日状态观察系统
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-8 mb-24">
        <BigButton onClick={handleLogout} variant="danger">
          退出登录
        </BigButton>
      </div>

    </div>
  )
}
