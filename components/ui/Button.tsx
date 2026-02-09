import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'default' | 'social' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  children,
  type = 'button',
  variant = 'default',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  loading = false,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-medium transition-colors duration-200 flex items-center justify-center'

  const variantStyles = {
    default: 'bg-lebanon-green hover:bg-green-700 text-white',
    social: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    outline: 'border border-lebanon-green text-lebanon-green hover:bg-lebanon-green/10',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700'
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2.5 rounded-lg',
    lg: 'px-6 py-3.5 rounded-lg text-base'
  }

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin h-5 w-5 mr-2" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  )
}
