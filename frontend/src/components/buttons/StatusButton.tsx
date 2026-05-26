import type { ButtonHTMLAttributes } from 'react'

interface StatusButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  emoji: string
  label: string
  selected: boolean
  onClick: () => void
}

export default function StatusButton({ emoji, label, selected, onClick, ...props }: StatusButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full min-h-[80px] rounded-xl border-2 flex flex-col items-center justify-center transition-all touch-manipulation ${selected ? 'bg-primary/10 border-primary' : 'bg-white border-gray-200'}`}
      {...props}
    >
      <span className="text-4xl mb-2">{emoji}</span>
      <span className="text-lg font-medium">{label}</span>
    </button>
  )
}
