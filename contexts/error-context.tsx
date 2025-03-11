"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { ApiError } from "@/services/api"
import { ValidationRule } from "@/types/validation"

// Type definitions
type FieldErrors = Record<string, string>
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
    // Get current form errors or initialize empty object
    const currentFormErrors = formErrors[formId] || {}
    
    // Find the first rule that fails
    const failedRule = rules.find(rule => !rule.validate(value))
    
    if (failedRule) {
      // Set the error message
      setFormErrors({
        ...formErrors,
        [formId]: {
          ...currentFormErrors,
          [field]: failedRule.message
        }
      })
      return false
    } else {
      // Clear the error if validation passes
      if (currentFormErrors[field]) {
        const updatedFormErrors = { ...currentFormErrors }
        delete updatedFormErrors[field]
        
        setFormErrors({
          ...formErrors,
          [formId]: updatedFormErrors
        })
      }
      return true
    }
  }

  // Set errors from API responses
  const setApiErrors = (formId: string, error: ApiError) => {
    if (error.isValidationError()) {
      const validationErrors = error.getValidationErrors()
      if (validationErrors) {
        const fieldErrors: FieldErrors = {}
        
        validationErrors.forEach(err => {
          fieldErrors[err.field] = err.message
        })
        
        setFormErrors({
          ...formErrors,
          [formId]: fieldErrors
        })
      }
    }
  }

  // Clear errors
  const clearErrors = (formId: string, field?: string) => {
    if (field) {
      // Clear a specific field error
      const currentFormErrors = formErrors[formId]
      if (currentFormErrors && currentFormErrors[field]) {
        const updatedFormErrors = { ...currentFormErrors }
        delete updatedFormErrors[field]
        
        setFormErrors({
          ...formErrors,
          [formId]: updatedFormErrors
        })
      }
    } else {
      // Clear all errors for a form
      const updatedFormErrors = { ...formErrors }
      delete updatedFormErrors[formId]
      
      setFormErrors(updatedFormErrors)
    }
  }

  return (
    <ErrorContext.Provider
      value={{
        formErrors,
        validateField,
        setApiErrors,
        clearErrors
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
