import type { ButtonHTMLAttributes, ReactNode } from 'react'

type BigButtonVariant = 'primary' | 'danger' | 'success'

interface BigButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  onClick: () => void
  variant?: BigButtonVariant
  disabled?: boolean
}

const variantStyles: Record<BigButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary/90 dark:hover:bg-primary/80',
  danger: 'bg-danger text-white hover:bg-danger/90',
  success: 'bg-success text-white hover:bg-success/90 dark:bg-emerald-600 dark:hover:bg-emerald-500',
}

export default function BigButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  ...props
}: BigButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl py-4 text-xl font-bold transition-all duration-200 touch-manipulation cursor-pointer shadow-lg shadow-black/10 dark:shadow-black/30 ${variantStyles[variant]} ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:shadow-xl active:scale-[0.97]'
      }`}
      {...props}
    >
      {children}
    </button>
  )
}
