import { useState, useCallback } from 'react';

/**
 * Custom hook for form validation with real-time feedback
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Function} validationRules - Validation function that returns errors object
 * @returns {Object} Form state and handlers
 * 
 * @example
 * const { values, errors, touched, handleChange, handleBlur, handleSubmit, isValid } = useFormValidation(
 *   { email: '', password: '' },
 *   (values) => {
 *     const errors = {};
 *     if (!values.email) errors.email = 'Email is required';
 *     if (!values.password) errors.password = 'Password is required';
 *     return errors;
 *   }
 * );
 */
export function useFormValidation(initialValues, validationRules) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = useCallback((name, value) => {
    const fieldErrors = validationRules({ ...values, [name]: value });
    return fieldErrors[name];
  }, [values, validationRules]);

  // Validate all fields
  const validateForm = useCallback(() => {
    const formErrors = validationRules(values);
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  }, [values, validationRules]);

  // Handle field change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setValues((prev) => ({ ...prev, [name]: fieldValue }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle field blur (validate on blur)
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    // Validate field on blur
    const fieldError = validateField(name, value);
    if (fieldError) {
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }
  }, [validateField]);

  // Handle form submit
  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);
      
      // Validate entire form
      const isValid = validateForm();
      
      if (isValid) {
        try {
          await onSubmit(values);
        } catch (error) {
          console.error('Form submission error:', error);
        }
      }
      
      setIsSubmitting(false);
    };
  }, [values, validateForm]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Set field value programmatically
  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Set field error programmatically
  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  // Check if field has error and is touched
  const getFieldError = useCallback((name) => {
    return touched[name] && errors[name] ? errors[name] : null;
  }, [touched, errors]);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    getFieldError,
    validateForm,
  };
}

// Common validation rules
export const validationRules = {
  // Email validation
  email: (value) => {
    if (!value) return 'Email is required';
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  // Password validation
  password: (value, minLength = 6) => {
    if (!value) return 'Password is required';
    if (value.length < minLength) {
      return `Password must be at least ${minLength} characters`;
    }
    return null;
  },

  // Required field
  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  // Phone number (Nigerian format)
  phone: (value) => {
    if (!value) return 'Phone number is required';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 11) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

  // Price validation
  price: (value) => {
    if (!value) return 'Price is required';
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      return 'Please enter a valid price';
    }
    return null;
  },

  // URL validation
  url: (value) => {
    if (!value) return null; // Optional
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  // Minimum length
  minLength: (value, min, fieldName = 'This field') => {
    if (!value) return null;
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  // Maximum length
  maxLength: (value, max, fieldName = 'This field') => {
    if (!value) return null;
    if (value.length > max) {
      return `${fieldName} must not exceed ${max} characters`;
    }
    return null;
  },

  // Match two fields (e.g., password confirmation)
  match: (value, otherValue, fieldName = 'This field') => {
    if (value !== otherValue) {
      return `${fieldName} do not match`;
    }
    return null;
  },

  // Number range
  numberRange: (value, min, max, fieldName = 'Value') => {
    if (!value) return null;
    const num = Number(value);
    if (isNaN(num)) return 'Please enter a valid number';
    if (num < min || num > max) {
      return `${fieldName} must be between ${min} and ${max}`;
    }
    return null;
  },

  // File size (in MB)
  fileSize: (file, maxSizeMB = 5) => {
    if (!file) return null;
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `File size must not exceed ${maxSizeMB}MB`;
    }
    return null;
  },

  // File type
  fileType: (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) => {
    if (!file) return null;
    if (!allowedTypes.includes(file.type)) {
      return `File type must be ${allowedTypes.join(', ')}`;
    }
    return null;
  },
};

// Usage example with compound validation:
/*
const validationSchema = (values) => {
  const errors = {};
  
  const emailError = validationRules.email(values.email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validationRules.password(values.password, 8);
  if (passwordError) errors.password = passwordError;
  
  const confirmError = validationRules.match(
    values.confirmPassword, 
    values.password, 
    'Passwords'
  );
  if (confirmError) errors.confirmPassword = confirmError;
  
  return errors;
};

const {
  values,
  errors,
  handleChange,
  handleBlur,
  handleSubmit,
  getFieldError,
} = useFormValidation({ email: '', password: '', confirmPassword: '' }, validationSchema);

<form onSubmit={handleSubmit(async (values) => {
  await api.post('/auth/signup', values);
})}>
  <input
    name="email"
    value={values.email}
    onChange={handleChange}
    onBlur={handleBlur}
  />
  {getFieldError('email') && (
    <span className="error">{getFieldError('email')}</span>
  )}
</form>
*/

export default useFormValidation;
