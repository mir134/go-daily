import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
  title?: string
}

export default function Layout({ children, title = '家庭健康记录' }: LayoutProps) {
  const location = useLocation()

  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/history', label: '历史', icon: '📜' },
    { path: '/trends', label: '趋势', icon: '📈' },
    { path: '/ai', label: 'AI', icon: '🤖' },
    { path: '/settings', label: '设置', icon: '⚙️' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top Header */}
      <header className="bg-primary text-white py-3 px-4 shadow-sm">
        <div className="max-w-[480px] mx-auto">
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-[480px] mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md">
        <div className="max-w-[480px] mx-auto">
          <div className="flex justify-around">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-2 px-3 w-full transition-colors ${
                  isActive(item.path)
                    ? 'text-primary'
                    : 'text-text-secondary'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm mt-1 font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}
