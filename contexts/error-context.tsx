"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { ApiError } from "@/services/api"
import { ValidationRule, validateValue } from "@/types/validation"

// Type definitions
type FieldErrors = Record<string, string[]>
type FormErrors = Record<string, FieldErrors>

interface ErrorContextType {
  // Global form errors organized by form ID
  formErrors: FormErrors
  // Validate a field against rules
  validateField: (formId: string, field: string, value: string | undefined, rules: ValidationRule[]) => boolean
  // Set errors from API responses
  setApiErrors: (formId: string, error: ApiError) => void
  // Clear errors
  clearErrors: (formId: string, field?: string) => void
  // Add a single error message
  addError: (formId: string, field: string, message: string) => void
}

// Create the context
const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

// Provider component
export function ErrorProvider({ children }: { children: ReactNode }) {
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // Validate a field against rules
  const validateField = (
    formId: string, 
    field: string, 
    value: string | undefined, 
    rules: ValidationRule[]
  ): boolean => {
    // Validate against all rules
    const result = validateValue(value, rules)
    
    // Use functional state update to avoid stale state issues
    setFormErrors(prevErrors => {
      // Get current form errors or initialize empty object
      const currentFormErrors = {...(prevErrors[formId] || {})}
      
      if (!result.valid) {
        // Set all error messages
        return {
          ...prevErrors,
          [formId]: {
            ...currentFormErrors,
            [field]: result.errors
          }
        }
      } else {
        // Clear the error if validation passes
        if (currentFormErrors[field]) {
          delete currentFormErrors[field]
          
          // If no more errors for this form, remove the form entry
          if (Object.keys(currentFormErrors).length === 0) {
            const newErrors = {...prevErrors}
            delete newErrors[formId]
            return newErrors
          }
          
          // Otherwise return updated form errors
          return {
            ...prevErrors,
            [formId]: currentFormErrors
          }
        }
        
        // No changes needed
        return prevErrors
      }
    })
    
    return result.valid
  }

  // Set errors from API responses
  const setApiErrors = (formId: string, error: ApiError) => {
    if (error.isValidationError()) {
      const validationErrors = error.getValidationErrors()
      if (validationErrors) {
        const fieldErrors: FieldErrors = {}
        
        // Group errors by field
        validationErrors.forEach(err => {
          if (!fieldErrors[err.field]) {
            fieldErrors[err.field] = []
          }
          fieldErrors[err.field].push(err.message)
        })
        
        // Use functional state update
        setFormErrors(prevErrors => ({
          ...prevErrors,
          [formId]: fieldErrors
        }))
      }
    }
  }

  // Clear errors
  const clearErrors = (formId: string, field?: string) => {
    // Use functional state update
    setFormErrors(prevErrors => {
      // If the form doesn't exist in errors, no changes needed
      if (!prevErrors[formId]) {
        return prevErrors
      }
      
      if (field) {
        // Clear a specific field error
        const currentFormErrors = {...prevErrors[formId]}
        
        if (currentFormErrors[field]) {
          delete currentFormErrors[field]
          
          // If no more errors for this form, remove the form entry
          if (Object.keys(currentFormErrors).length === 0) {
            const newErrors = {...prevErrors}
            delete newErrors[formId]
            return newErrors
          }
          
          // Otherwise return updated form errors
          return {
            ...prevErrors,
            [formId]: currentFormErrors
          }
        }
        
        // No changes needed
        return prevErrors
      } else {
        // Clear all errors for a form
        const newErrors = {...prevErrors}
        delete newErrors[formId]
        return newErrors
      }
    })
  }

  // Add a single error message
  const addError = (formId: string, field: string, message: string) => {
    setFormErrors(prevErrors => {
      const currentFormErrors = {...(prevErrors[formId] || {})}
      const currentFieldErrors = currentFormErrors[field] || []
      
      return {
        ...prevErrors,
        [formId]: {
          ...currentFormErrors,
          [field]: [...currentFieldErrors, message]
        }
      }
    })
  }

  return (
    <ErrorContext.Provider
      value={{
        formErrors,
        validateField,
        setApiErrors,
        clearErrors,
        addError
      }}
    >
      {children}
    </ErrorContext.Provider>
  )
}

// Hook to use the error context
export function useErrors() {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error("useErrors must be used within an ErrorProvider")
  }
  return context
}
