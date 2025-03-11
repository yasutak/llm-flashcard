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
    // Find the first rule that fails
    const failedRule = rules.find(rule => !rule.validate(value))
    
    // Use functional state update to avoid stale state issues
    setFormErrors(prevErrors => {
      // Get current form errors or initialize empty object
      const currentFormErrors = {...(prevErrors[formId] || {})}
      
      if (failedRule) {
        // Set the error message
        return {
          ...prevErrors,
          [formId]: {
            ...currentFormErrors,
            [field]: failedRule.message
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
    
    return !failedRule
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
