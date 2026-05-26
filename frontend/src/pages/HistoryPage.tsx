import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DailyRecord } from '../types'
import { getRecords, deleteRecord, exportRecords } from '../api/client'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import LoadingSpinner from '../components/LoadingSpinner'
import BigButton from '../components/buttons/BigButton'

const overallStatusMap: Record<string, { text: string; emoji: string }> = {
  good: { text: '感觉很好', emoji: '🙂' },
  normal: { text: '感觉一般', emoji: '😐' },
  uncomfortable: { text: '感觉不舒服', emoji: '😟' },
  severe: { text: '情况严重', emoji: '🚨' },
}

const breathingMap: Record<string, string> = {
  no_wheeze: '不喘',
  walk_wheeze: '走路喘',
  sit_wheeze: '坐着也喘',
}

const sleepMap: Record<string, string> = {
  can: '能',
  half: '半躺',
  cannot: '不能',
}

const appetiteMap: Record<string, string> = {
  good: '好',
  little: '一点',
  none: '吃不下',
}

const vomitMap: Record<string, string> = {
  none: '没有',
  nausea: '恶心',
  vomit: '呕吐',
  blood: '吐血',
}

const mentalMap: Record<string, string> = {
  chatty: '能聊天',
  listless: '没精神',
  sleepy: '嗜睡',
}

const emotionMap: Record<string, string> = {
  stable: '平稳',
  agitated: '激动',
  quarrel: '争吵',
}

const dialysisPhaseMap: Record<string, string> = {
  non_dialysis: '非透析日',
  hemodialysis: '血透',
  perfusion: '灌流',
  hemofiltration: '血滤',
}

function yesNo(value: boolean): string {
  return value ? '是' : '否'
}

const periodMap: Record<string, string> = {
  morning: '早上',
  evening: '晚上',
}

function formatDate(dateString: string) {
  const d = new Date(dateString)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface DateGroup {
  date: string
  morning?: DailyRecord
  evening?: DailyRecord
}

const PAGE_SIZE = 15

export default function HistoryPage() {
  const navigate = useNavigate()

  const [allRecords, setAllRecords] = useState<DailyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [selectedPeriod, setSelectedPeriod] = useState<'morning' | 'evening'>('morning')

  const [selectedRecord, setSelectedRecord] = useState<DailyRecord | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const dateGroups: DateGroup[] = useMemo(() => {
    const map = new Map<string, { morning?: DailyRecord; evening?: DailyRecord }>()
    for (const r of allRecords) {
      const g = map.get(r.date) ?? {}
      if (r.period === 'morning') g.morning = r
      else g.evening = r
      map.set(r.date, g)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, { morning, evening }]) => ({ date, morning, evening }))
  }, [allRecords])

  const totalPages = Math.max(1, Math.ceil(dateGroups.length / PAGE_SIZE))
  const pagedGroups = dateGroups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      const res = await getRecords(1, 999)
      setAllRecords(res.data)
      setPage(1)
    } catch {
      setError('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function handleExport(format: 'json' | 'csv') {
    try {
      const blob = await exportRecords(format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `daily-records.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setError('导出失败，请重试')
    }
    setExportOpen(false)
  }

  useEffect(() => {
    if (!exportOpen) return
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [exportOpen])

  async function handleDeleteConfirm() {
    if (!selectedRecord) return
    try {
      await deleteRecord(selectedRecord.id)
      setDeleteOpen(false)
      setModalOpen(false)
      setSelectedRecord(null)
      fetchData()
    } catch {
      setError('删除失败，请重试')
    }
  }

  function renderDetail(label: string, value: string) {
    return (
      <div>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-0.5">{label}</p>
        <p className="text-base font-medium text-gray-800 dark:text-slate-200">{value || '未填写'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">历史记录</h1>
        <button
          onClick={fetchData}
          className="rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          刷新
        </button>
      </div>

      <div ref={exportRef} className="relative mb-6">
        <button
          onClick={() => setExportOpen((v) => !v)}
          className="rounded-xl bg-primary dark:bg-primary/90 text-white px-5 py-2.5 text-base font-bold hover:opacity-90 active:scale-95 transition-all touch-manipulation cursor-pointer"
        >
          导出数据
        </button>

        {exportOpen && (
          <div className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-slate-900/50 border border-gray-100 dark:border-slate-700 py-1 z-10">
            <button
              onClick={() => handleExport('json')}
              className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              JSON 格式
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              CSV 格式
            </button>
          </div>
        )}
      </div>

      {/* Period Toggle */}
      <div className="flex gap-2 rounded-xl p-1.5 mb-6 bg-gray-200 dark:bg-slate-700">
        <button
          onClick={() => setSelectedPeriod('morning')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
            selectedPeriod === 'morning'
              ? 'bg-white dark:bg-slate-600 text-primary dark:text-primary-light shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
          }`}
        >
          🌅 早上
        </button>
        <button
          onClick={() => setSelectedPeriod('evening')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
            selectedPeriod === 'evening'
              ? 'bg-white dark:bg-slate-600 text-primary dark:text-primary-light shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
          }`}
        >
          🌙 晚上
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center gap-4 py-20">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <BigButton onClick={fetchData}>重试</BigButton>
        </div>
      )}

      {!loading && !error && dateGroups.length === 0 && (
        <div className="flex justify-center py-20">
          <p className="text-gray-500 dark:text-slate-400 text-lg">还没有记录，去首页打卡吧 📝</p>
        </div>
      )}

      {!loading && !error && dateGroups.length > 0 && (
        <>
          <div className="space-y-4 mb-8">
            {pagedGroups.map((dg) => {
              const r = dg[selectedPeriod]
              const other = dg[selectedPeriod === 'morning' ? 'evening' : 'morning']
              return (
                <div
                  key={dg.date}
                  onClick={() => {
                    if (r) {
                      setSelectedRecord(r)
                      setModalOpen(true)
                    }
                  }}
                  className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-slate-900/50 p-4 transition-shadow touch-manipulation min-h-[48px] ${
                    r ? 'cursor-pointer hover:shadow-md dark:hover:shadow-slate-900/80' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-bold text-primary dark:text-primary-light">
                      {formatDate(dg.date)}
                    </span>
                    <div className="flex items-center gap-2">
                      {other && (
                        <span className="text-xs text-gray-400 dark:text-slate-500">
                          {periodMap[selectedPeriod === 'morning' ? 'evening' : 'morning']}已有记录
                        </span>
                      )}
                      {r && (
                        <span className="flex items-center gap-1.5">
                          <span className="text-xl">{overallStatusMap[r.overall_status]?.emoji}</span>
                          <span className="text-sm text-gray-600 dark:text-slate-400">{overallStatusMap[r.overall_status]?.text}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {r ? (
                    <>
                      <div className="text-sm text-gray-600 dark:text-slate-400">
                        呼吸: {breathingMap[r.breathing_status] || '未填写'} | 食欲: {appetiteMap[r.appetite_status] || '未填写'} | 精神: {mentalMap[r.mental_status] || '未填写'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-slate-500 mt-1 flex flex-wrap gap-x-3">
                        {r.dialysis_phase && r.dialysis_phase !== 'non_dialysis' && (
                          <span>🩸 {dialysisPhaseMap[r.dialysis_phase] || r.dialysis_phase}</span>
                        )}
                        {r.blood_pressure && <span>血压: {r.blood_pressure}</span>}
                        {r.blood_sugar != null && <span>血糖: {r.blood_sugar} mmol/L</span>}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-slate-500 py-2">
                      {periodMap[selectedPeriod]}暂无记录
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-center gap-4 pb-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              上一页
            </button>
            <span className="text-sm text-gray-600 dark:text-slate-400">
              第 {page} 页 / 共 {totalPages} 页
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              下一页
            </button>
          </div>
        </>
      )}

      {selectedRecord && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`记录详情 - ${formatDate(selectedRecord.date)} ${periodMap[selectedRecord.period] || ''}`}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderDetail('时段', periodMap[selectedRecord.period] || selectedRecord.period)}
              {renderDetail('整体状态', overallStatusMap[selectedRecord.overall_status]?.text)}
              {renderDetail('呼吸状态', breathingMap[selectedRecord.breathing_status])}
              {renderDetail('平躺能力', sleepMap[selectedRecord.sleep_position])}
              {renderDetail('食欲', appetiteMap[selectedRecord.appetite_status])}
              {renderDetail('呕吐', vomitMap[selectedRecord.vomit_status])}
              {renderDetail('精神状态', mentalMap[selectedRecord.mental_status])}
              {renderDetail('情绪状态', emotionMap[selectedRecord.emotion_status])}
              {renderDetail('透析类型', dialysisPhaseMap[selectedRecord.dialysis_phase] || selectedRecord.dialysis_phase || '未填写')}
              {renderDetail('透析前体重', selectedRecord.pre_weight != null ? `${selectedRecord.pre_weight} kg` : '')}
              {renderDetail('透析后体重', selectedRecord.post_weight != null ? `${selectedRecord.post_weight} kg` : '')}
              {renderDetail('脱水量', selectedRecord.ultrafiltration_volume != null ? `${selectedRecord.ultrafiltration_volume} ml` : '')}
              {renderDetail('血压', selectedRecord.blood_pressure)}
              {renderDetail('血氧', selectedRecord.oxygen_saturation != null ? `${selectedRecord.oxygen_saturation} %` : '')}
              {renderDetail('血糖', selectedRecord.blood_sugar != null ? `${selectedRecord.blood_sugar} mmol/L` : '')}
              {renderDetail('黑便', yesNo(selectedRecord.has_black_stool))}
              {renderDetail('吐血', yesNo(selectedRecord.has_blood_vomiting))}
            </div>

            {selectedRecord.notes && (
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-0.5">备注</p>
                <p className="text-base font-medium text-gray-800 dark:text-slate-200">{selectedRecord.notes}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <div className="flex-1">
                <BigButton onClick={() => navigate(`/?edit=${selectedRecord.id}`)}>
                  编辑
                </BigButton>
              </div>
              <div className="flex-1">
                <BigButton variant="danger" onClick={() => setDeleteOpen(true)}>
                  删除
                </BigButton>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={deleteOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
        title="确认删除"
        message="确定要删除这条记录吗？此操作不可恢复！"
      />
    </div>
  )
}
