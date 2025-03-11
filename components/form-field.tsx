"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { useErrors } from "@/contexts/error-context"
import { ValidationRule } from "@/types/validation"

interface FormFieldProps {
  formId: string
  name: string
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  rules?: ValidationRule[]
  placeholder?: string
  required?: boolean
  className?: string
  autoComplete?: string
}

export function FormField({
  formId,
  name,
  label,
  type = "text",
  value,
  onChange,
  rules = [],
  placeholder,
  required,
  className = "",
  autoComplete,
  ...props
}: FormFieldProps) {
  const { formErrors, validateField, clearErrors } = useErrors()
  const [touched, setTouched] = useState(false)
  
  // Get error for this field
  const error = formErrors[formId]?.[name]
  
  // Validate on blur
  const handleBlur = () => {
    setTouched(true)
    validateField(formId, name, value, rules)
  }
  
  // Handle change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // Clear error when user types
    if (error) {
      clearErrors(formId, name)
    }
    
    // Validate on change after first touch
    if (touched) {
      validateField(formId, name, newValue, rules)
    }
  }
  
  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearErrors(formId, name)
    }
  }, [formId, name, clearErrors])
  
  return (
    <div className="grid gap-2">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className={`border-blue-200 focus:border-blue-500 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}
