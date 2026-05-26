import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BigButton from '../components/buttons/BigButton'

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, loading, login } = useAuth()
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/')
    }
  }, [loading, isAuthenticated, navigate])

  const handleLogin = async () => {
    if (!password.trim()) return

    setIsLoggingIn(true)
    setError('')

    try {
      await login(password.trim())
      navigate('/')
    } catch {
      setError('密码错误，请重试')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLogin()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-primary dark:text-primary-light mb-2">家庭健康记录</h1>
          <p className="text-lg text-gray-500 dark:text-slate-400">慢病/透析患者每日状态观察系统</p>
        </div>

        <form ref={formRef} onSubmit={onSubmit}>
          <div className="mb-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              disabled={isLoggingIn}
              className="w-full rounded-xl p-4 text-xl border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-primary dark:focus:border-primary-light focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-danger dark:text-red-400 text-center mb-6">{error}</div>
          )}

          <BigButton
            onClick={() => formRef.current?.requestSubmit()}
            disabled={isLoggingIn || !password.trim()}
            variant="primary"
          >
            {isLoggingIn ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                登录中...
              </div>
            ) : (
              '登录'
            )}
          </BigButton>
        </form>
      </div>
    </div>
  )
}
