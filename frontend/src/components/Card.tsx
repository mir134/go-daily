import type { ReactNode } from 'react'

interface CardProps {
  title: string
  children: ReactNode
  className?: string
  delay?: number
}

export default function Card({ title, children, className = '', delay = 0 }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-slate-900/50 p-5 border border-gray-100 dark:border-slate-700 animate-slide-up ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-4">
        {title}
      </h2>
      {children}
    </div>
  )
}
