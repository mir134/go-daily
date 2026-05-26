import axios from 'axios'
import type { DailyRecord, RiskAlert, SummaryResult, ContextResult, RiskScoreResult } from '../types'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// Response interceptor: on 401, redirect to /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api

// ─── Auth ──────────────────────────────────────────────────────────────────────

export async function login(password: string): Promise<void> {
  await api.post('/login', { password })
}

export async function logout(): Promise<void> {
  await api.post('/logout')
}

export async function checkAuthStatus(): Promise<boolean> {
  try {
    const res = await api.get('/auth/status')
    return res.data.data?.authenticated === true
  } catch {
    return false
  }
}

// ─── Records ───────────────────────────────────────────────────────────────────

export async function getRecords(
  page: number,
  pageSize: number,
): Promise<{ data: DailyRecord[]; total: number }> {
  const res = await api.get('/records', { params: { page, page_size: pageSize } })
  return res.data
}

export async function getTodayRecord(period: string): Promise<DailyRecord | null> {
  try {
    const res = await api.get('/records/today', { params: { period } })
    return res.data.data
  } catch {
    return null
  }
}

export async function createRecord(
  record: Partial<DailyRecord>,
): Promise<DailyRecord> {
  const res = await api.post('/records', record)
  return res.data.data
}

export async function getRecordById(id: number): Promise<DailyRecord> {
  const res = await api.get(`/records/${id}`)
  return res.data.data
}

export async function updateRecord(
  id: number,
  record: Partial<DailyRecord>,
): Promise<DailyRecord> {
  const res = await api.put(`/records/${id}`, record)
  return res.data.data
}

export async function upsertTodayRecord(
  record: Partial<DailyRecord>,
): Promise<DailyRecord> {
  const res = await api.put('/records/today', record)
  return res.data.data
}

export async function deleteRecord(id: number): Promise<void> {
  await api.delete(`/records/${id}`)
}

// ─── Export ────────────────────────────────────────────────────────────────────

export async function exportRecords(format: string): Promise<Blob> {
  const res = await api.get('/records/export', {
    params: { format },
    responseType: 'blob',
  })
  return res.data
}

// ─── Alerts ────────────────────────────────────────────────────────────────────

export async function getAlerts(): Promise<RiskAlert[]> {
  const res = await api.get('/alerts')
  return res.data.data ?? []
}

// ─── Health ────────────────────────────────────────────────────────────────────

export async function getHealth(): Promise<{ status: string }> {
  const res = await api.get('/health')
  return res.data.data
}

// ─── AI Analysis ────────────────────────────────────────────────────────────────

export async function getAISummary(): Promise<SummaryResult> {
  const res = await api.get('/ai/summary')
  return res.data.data
}

export async function getAIContext(): Promise<ContextResult> {
  const res = await api.get('/ai/context')
  return res.data.data
}

export async function getAIRiskScore(): Promise<RiskScoreResult> {
  const res = await api.get('/ai/risk-score')
  return res.data.data
}