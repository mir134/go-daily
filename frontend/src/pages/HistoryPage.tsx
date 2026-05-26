import { useState, useEffect, useRef } from 'react'
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

const pageSize = 10

export default function HistoryPage() {
  const navigate = useNavigate()

  const [records, setRecords] = useState<DailyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const [selectedRecord, setSelectedRecord] = useState<DailyRecord | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  async function fetchData(p: number) {
    setLoading(true)
    setError('')
    try {
      const res = await getRecords(p, pageSize)
      setRecords(res.data)
      setTotal(res.total)
      setPage(p)
    } catch {
      setError('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(1)
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
      fetchData(page)
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
          onClick={() => fetchData(page)}
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

      {loading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center gap-4 py-20">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <BigButton onClick={() => fetchData(page)}>重试</BigButton>
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="flex justify-center py-20">
          <p className="text-gray-500 dark:text-slate-400 text-lg">还没有记录，去首页打卡吧 📝</p>
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <>
          <div className="space-y-4 mb-8">
            {records.map((r) => {
              const ov = overallStatusMap[r.overall_status]
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRecord(r)
                    setModalOpen(true)
                  }}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-slate-900/50 p-4 cursor-pointer hover:shadow-md dark:hover:shadow-slate-900/80 transition-shadow touch-manipulation min-h-[48px]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-bold text-primary dark:text-primary-light">
                      {formatDate(r.date)}
                      <span className="text-xs bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light rounded-full px-2 py-0.5 ml-2">
                        {periodMap[r.period] || r.period}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-xl">{ov?.emoji}</span>
                      <span className="text-sm text-gray-600 dark:text-slate-400">{ov?.text}</span>
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-slate-400">
                    呼吸: {breathingMap[r.breathing_status] || '未填写'} | 食欲: {appetiteMap[r.appetite_status] || '未填写'} | 精神: {mentalMap[r.mental_status] || '未填写'}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-center gap-4 pb-8">
            <button
              onClick={() => fetchData(page - 1)}
              disabled={page <= 1}
              className="rounded-xl border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              上一页
            </button>
            <span className="text-sm text-gray-600 dark:text-slate-400">
              第 {page} 页 / 共 {totalPages} 页
            </span>
            <button
              onClick={() => fetchData(page + 1)}
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
          title={`记录详情 - ${formatDate(selectedRecord.date)}`}
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
              {renderDetail('是否透析', yesNo(selectedRecord.is_dialysis_day))}
              {selectedRecord.is_dialysis_day && (
                <>
                  {renderDetail('透析阶段', selectedRecord.dialysis_phase)}
                  {renderDetail('透析前体重', selectedRecord.pre_weight != null ? `${selectedRecord.pre_weight} kg` : '')}
                  {renderDetail('透析后体重', selectedRecord.post_weight != null ? `${selectedRecord.post_weight} kg` : '')}
                  {renderDetail('脱水量', selectedRecord.ultrafiltration_volume != null ? `${selectedRecord.ultrafiltration_volume} ml` : '')}
                </>
              )}
              {renderDetail('血压', selectedRecord.blood_pressure)}
              {renderDetail('血氧', selectedRecord.oxygen_saturation != null ? `${selectedRecord.oxygen_saturation} %` : '')}
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
