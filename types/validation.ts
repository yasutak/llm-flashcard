export interface ValidationRule {
  validate: (value: string | undefined) => boolean;
  message: string;
}

export const ValidationRules = {
  required: (message = "This field is required"): ValidationRule => ({
    validate: (value) => !!value && value.trim() !== '',
    message
  }),
  
  minLength: (length: number, message = `Must be at least ${length} characters`): ValidationRule => ({
    validate: (value) => !value || value.length >= length,
    message
  }),
  
  maxLength: (length: number, message = `Must be less than ${length} characters`): ValidationRule => ({
    validate: (value) => !value || value.length <= length,
    message
  }),
  
  pattern: (regex: RegExp, message = "Invalid format"): ValidationRule => ({
    validate: (value) => !value || regex.test(value),
    message
  }),
  
  match: (getCompareValue: () => string, message = "Values must match"): ValidationRule => ({
    validate: (value) => value === getCompareValue(),
    message
  }),
  
  email: (message = "Invalid email address"): ValidationRule => ({
    validate: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  })
};
