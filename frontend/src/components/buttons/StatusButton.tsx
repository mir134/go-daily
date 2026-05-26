import { useState, type ReactNode } from 'react'
import type { ButtonHTMLAttributes } from 'react'

interface StatusButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  emoji?: string
  label: string
  selected: boolean
  onClick: () => void
  renderIcon?: () => ReactNode
}

export default function StatusButton({ emoji, label, selected, onClick, renderIcon, ...props }: StatusButtonProps) {
  const [animKey, setAnimKey] = useState(0)

  const handleClick = () => {
    setAnimKey(k => k + 1)
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full min-h-[88px] rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 touch-manipulation cursor-pointer active:scale-95 ${
        selected
          ? 'bg-primary/10 dark:bg-primary/20 border-primary dark:border-primary-light shadow-md dark:shadow-primary/20'
          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-primary/50 dark:hover:border-primary-light/50 hover:shadow-sm'
      }`}
      {...props}
    >
      {renderIcon ? (
        <span key={`icon-${animKey}`} className="mb-1">{renderIcon()}</span>
      ) : (
        <span
          key={animKey}
          className={`text-4xl mb-1.5 ${selected ? 'animate-bounce-in' : ''}`}
        >
          {emoji}
        </span>
      )}
      <span className={`text-base font-medium ${selected ? 'text-primary dark:text-primary-light' : 'text-gray-600 dark:text-slate-300'}`}>
        {label}
      </span>
    </button>
  )
}
