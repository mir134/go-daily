import type { ButtonHTMLAttributes, ReactNode } from 'react'

type BigButtonVariant = 'primary' | 'danger' | 'success'

interface BigButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  onClick: () => void
  variant?: BigButtonVariant
  disabled?: boolean
}

const variantStyles: Record<BigButtonVariant, string> = {
  primary: 'bg-primary text-white',
  danger: 'bg-danger text-white',
  success: 'bg-success text-white',
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
      className={`w-full rounded-xl py-4 text-xl font-bold transition-all touch-manipulation ${variantStyles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'}`}
      {...props}
    >
      {children}
    </button>
  )
}
