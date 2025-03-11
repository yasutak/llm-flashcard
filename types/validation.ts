export interface ValidationRule {
  validate: (value: string | undefined) => boolean;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Function to validate a value against multiple rules
export function validateValue(value: string | undefined, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];
  
  // Check each rule
  rules.forEach(rule => {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
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
  
  match: (getCompareValue: () => string, message = "Values don't match"): ValidationRule => ({
    validate: (value) => value === getCompareValue(),
    message
  }),
  
  email: (message = "Invalid email address"): ValidationRule => ({
    validate: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  })
};
