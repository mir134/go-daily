import type { ReactNode } from 'react'

interface CardProps {
  title: string
  children: ReactNode
  className?: string
}

export default function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm p-5 ${className}`}>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  )
}