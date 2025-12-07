import React from 'react';
import {
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText
} from '@chakra-ui/react';
import { getValidator, validationMessages } from '../../utils/inputValidation';

/**
 * ValidatedInput Component
 * Automatically applies validation based on field type
 * 
 * @param {string} fieldType - Type of field (phone, email, name, etc.)
 * @param {string} label - Form label
 * @param {string} value - Current value
 * @param {function} onChange - Change handler (receives formatted value)
 * @param {boolean} isRequired - Whether field is required
 * @param {string} placeholder - Placeholder text
 * @param {function} customValidator - Optional custom validation function
 * @param {string} errorMessage - Custom error message
 * @param {string} helperText - Helper text to display
 * @param {object} props - Additional props passed to Input component
 */
const ValidatedInput = ({
  fieldType = 'default',
  label,
  value,
  onChange,
  isRequired = false,
  placeholder,
  customValidator,
  errorMessage,
  helperText,
  ...props
}) => {
  const validator = getValidator(fieldType);
  
  // Determine if field has error
  const getError = () => {
    if (!value) return null;
    
    if (customValidator) {
      return !customValidator(value);
    }
    
    // Built-in validation checks
    switch (fieldType) {
      case 'phone':
      case 'phoneNumber':
      case 'trackingPhone': {
        const phoneDigits = value.replace(/\D/g, '');
        return phoneDigits.length > 0 && phoneDigits.length !== 10;
      }
      
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value);
      }
      
      case 'zipCode': {
        const zipRegex = /^[0-9]{5}(-[0-9]{4})?$/;
        return !zipRegex.test(value);
      }
      
      case 'year': {
        const yearNum = parseInt(value, 10);
        const currentYear = new Date().getFullYear();
        return isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1;
      }
      
      case 'vin':
        return value.length > 0 && value.length !== 17;
      
      default:
        return false;
    }
  };
  
  const hasError = getError();
  const displayError = errorMessage || validationMessages[fieldType] || 'Invalid input';
  
  // Handle change with validation
  const handleChange = (e) => {
    const rawValue = e.target.value;
    const formattedValue = validator(rawValue);
    
    // Call onChange with formatted value
    onChange(formattedValue);
  };
  
  // Determine input type
  const getInputType = () => {
    switch (fieldType) {
      case 'email':
        return 'email';
      case 'phone':
      case 'phoneNumber':
      case 'trackingPhone':
        return 'tel';
      case 'password':
        return 'password';
      case 'date':
        return 'date';
      case 'time':
        return 'time';
      default:
        return 'text';
    }
  };
  
  // Get maxLength based on field type
  const getMaxLength = () => {
    switch (fieldType) {
      case 'phone':
      case 'phoneNumber':
      case 'trackingPhone':
        return 14; // (XXX) XXX-XXXX
      case 'zipCode':
        return 10; // 12345-6789
      case 'vin':
        return 17;
      case 'licensePlate':
        return 10;
      case 'year':
        return 4;
      default:
        return undefined;
    }
  };
  
  return (
    <FormControl isRequired={isRequired} isInvalid={hasError}>
      {label && <FormLabel>{label}</FormLabel>}
      <Input
        type={getInputType()}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={getMaxLength()}
        {...props}
      />
      {hasError && <FormErrorMessage>{displayError}</FormErrorMessage>}
      {helperText && !hasError && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default ValidatedInput;
