import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

interface LayoutProps {
  children: ReactNode
  title?: string
}

export default function Layout({ children, title = '家庭健康记录' }: LayoutProps) {
  const location = useLocation()

  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('health_dark_mode')
      if (saved !== null) return saved === 'true'
    } catch {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('health_dark_mode', String(dark)) } catch {}
  }, [dark])

  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/history', label: '历史', icon: '📜' },
    { path: '/trends', label: '趋势', icon: '📈' },
    { path: '/ai', label: 'AI', icon: '🤖' },
    { path: '/settings', label: '设置', icon: '⚙️' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-cyan-50 dark:bg-slate-900 flex flex-col transition-colors duration-300">
      <header className="bg-primary dark:bg-slate-800 text-white px-4 shadow-lg sticky top-0 z-30">
        <div className="max-w-[480px] mx-auto h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-wide">{title}</h1>
          <button
            onClick={() => setDark(d => !d)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-all duration-200 cursor-pointer active:scale-90"
            aria-label={dark ? '切换到亮色模式' : '切换到暗色模式'}
          >
            <span className="text-lg">{dark ? '☀️' : '🌙'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 pb-24">
        <div className="max-w-[480px] mx-auto">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700 shadow-md z-30">
        <div className="max-w-[480px] mx-auto">
          <div className="flex justify-around">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-2 px-3 w-full transition-all duration-200 ${
                  isActive(item.path)
                    ? 'text-primary dark:text-primary-light'
                    : 'text-gray-500 dark:text-slate-400'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs mt-0.5 font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}
