import { ReactNode } from 'react'

interface InputProps {
  label: string
  type: string
  placeholder: string
  icon?: ReactNode
  required?: boolean
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  name?: string
}

export function Input({ 
  label, 
  type, 
  placeholder, 
  icon, 
  required, 
  value, 
  onChange,
  error,
  name 
}: InputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-lebanon-green focus:border-lebanon-green focus:outline-none transition-colors`}
          placeholder={placeholder}
          required={required}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}