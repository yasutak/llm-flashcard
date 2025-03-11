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
  
  // Get errors for this field
  const errors = formErrors[formId]?.[name] || []
  
  // Validate on blur
  const handleBlur = () => {
    setTouched(true)
    validateField(formId, name, value, rules)
  }
  
  // Handle change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // Clear errors when user types
    if (errors.length > 0) {
      clearErrors(formId, name)
    }
    
    // Validate on change after first touch
    if (touched) {
      validateField(formId, name, newValue, rules)
    }
  }
  
  // Validate on mount and clear on unmount
  useEffect(() => {
    // Validate on mount if there are rules
    if (rules.length > 0 && value) {
      validateField(formId, name, value, rules)
    }
    
    // Clear on unmount
    return () => {
      clearErrors(formId, name)
    }
  }, [formId, name, rules, value, validateField, clearErrors])
  
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
      className={`border-blue-200 focus:border-blue-500 ${errors.length > 0 ? 'border-red-500' : ''} ${className}`}
      {...props}
    />
    {errors.length > 0 && (
      <div className="mt-1">
        {errors.map((error, index) => (
          <p key={index} className="text-xs text-red-500">{error}</p>
        ))}
      </div>
    )}
    </div>
  )
}
