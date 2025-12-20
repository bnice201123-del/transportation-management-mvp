# Input Validation & Error Handling Quick Reference Guide

## Overview

Two new utility files have been created to centralize validation and error handling across the application:

1. **`frontend/src/utils/validationSchemas.js`** - Input validation and sanitization
2. **`frontend/src/utils/errorHandler.js`** - API error handling and formatting

---

## Using Validation Schemas

### Basic Import

```javascript
import { 
  validateField, 
  validateForm, 
  tripFormValidation,
  sanitizeInput,
  sanitizeFormData 
} from '../utils/validationSchemas';
```

### Validate Entire Form (On Submit)

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  const { isValid, errors } = validateForm(formData, tripFormValidation);
  
  if (!isValid) {
    setValidationErrors(errors);
    toast({
      title: 'Validation Error',
      description: formatValidationErrors(errors),
      status: 'warning',
      isClosable: true,
    });
    return;
  }
  
  // Continue with API call...
};
```

### Validate Single Field (Real-time)

```javascript
const handleFieldChange = (fieldName, value) => {
  const error = validateField(fieldName, value, tripFormValidation);
  
  if (error) {
    setFieldError(fieldName, error);
  } else {
    clearFieldError(fieldName);
  }
  
  setFormData(prev => ({ ...prev, [fieldName]: value }));
};
```

### Sanitize User Input (Before Storing)

```javascript
// Single input
const cleanInput = sanitizeInput(userInput);

// Entire form
const cleanData = sanitizeFormData(formData);

// Then submit
await axios.post('/api/trips', cleanData);
```

---

## Available Validation Schemas

### 1. Trip Form Validation

```javascript
// Validates: pickupAddress, dropoffAddress, riderName, riderPhone, scheduledDate, notes

const { isValid, errors } = validateForm(formData, tripFormValidation);

// Possible errors:
// - pickupAddress: "Pickup address is required and must be 5-200 characters"
// - dropoffAddress: "Dropoff address is required and must be 5-200 characters"
// - riderName: "Rider name is required and must be 2-50 characters"
// - riderPhone: "Phone number must be in valid format (e.g., 555-123-4567)"
// - scheduledDate: "Scheduled date must be a future date"
// - notes: "Notes must not exceed 1000 characters"
```

### 2. Location Filter Validation

```javascript
// Validates: lat, lng, radius

const { isValid, errors } = validateForm(filterData, locationFilterValidation);

// Possible errors:
// - lat: "Latitude must be between -90 and 90"
// - lng: "Longitude must be between -180 and 180"
// - radius: "Radius must be a positive number"
```

### 3. Registration Validation

```javascript
// Validates: username, email, password, firstName, lastName, phone

const { isValid, errors } = validateForm(registrationData, registrationValidation);

// Possible errors:
// - username: "Username must be 3-30 alphanumeric characters"
// - email: "Please enter a valid email address"
// - password: "Password must be at least 6 characters"
// - firstName: "First name must be 1-50 characters"
// - lastName: "Last name must be 1-50 characters"
// - phone: "Phone number must be in valid format"
```

---

## Display Validation Errors in Forms

### Using Chakra FormControl

```jsx
<FormControl isInvalid={!!validationErrors.riderName}>
  <FormLabel>Rider Name</FormLabel>
  <Input
    value={formData.riderName}
    onChange={(e) => setFormData(prev => ({ 
      ...prev, 
      riderName: e.target.value 
    }))}
    placeholder="Enter rider name"
  />
  {validationErrors.riderName && (
    <Text fontSize="sm" color="red.500" mt={1}>
      {validationErrors.riderName}
    </Text>
  )}
</FormControl>
```

---

## Using Error Handler

### Basic Import

```javascript
import { 
  handleApiError, 
  formatValidationErrors,
  isNetworkError,
  isRetryableError 
} from '../utils/errorHandler';
```

### Handle API Errors

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    await axios.post('/api/trips', tripData);
    // Success...
  } catch (error) {
    const apiError = handleApiError(error, 'Create trip');
    
    toast({
      title: apiError.title,
      description: apiError.description,
      status: apiError.status,
      isClosable: true,
    });
  }
};
```

### Error Object Structure

```javascript
const apiError = handleApiError(error, 'Create trip');

// Returns:
{
  title: "Error",                    // Generic or "Connection Error"
  description: "User-friendly message",
  status: "error",                   // Toast status
  isRetryable: false,                // Should show retry button
  context: "Create trip",            // What operation failed
  originalError: error,              // Original error object
  statusCode: 400                    // HTTP status code
}
```

### Check Error Type

```javascript
try {
  await axios.get('/api/data');
} catch (error) {
  if (isNetworkError(error)) {
    toast({
      title: 'Connection Error',
      description: 'Please check your internet connection',
      status: 'error',
    });
  } else if (isRetryableError(error)) {
    // Show retry button
  }
}
```

---

## Status Code to Message Mapping

| Status | Default Message |
|--------|-----------------|
| 400 | Invalid request. Please check your input. |
| 401 | Session expired. Please log in again. |
| 403 | You do not have permission to perform this action. |
| 404 | The requested resource was not found. |
| 409 | This resource already exists. |
| 429 | Too many requests. Please wait a moment. |
| 500 | Server error. Please try again later. |
| 502 | Service temporarily unavailable. |
| 503 | Service is under maintenance. |
| 504 | Request timeout. Please try again. |

---

## Real-World Examples

### Example 1: Trip Creation with Validation

```javascript
import { 
  validateForm, 
  tripFormValidation, 
  sanitizeFormData 
} from '../utils/validationSchemas';
import { handleApiError, formatValidationErrors } from '../utils/errorHandler';

const DispatcherDashboard = () => {
  const [formData, setFormData] = useState({
    riderName: '',
    riderPhone: '',
    pickupAddress: '',
    dropoffAddress: '',
    scheduledDate: '',
    scheduledTime: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate form
    const { isValid, errors } = validateForm(formData, tripFormValidation);
    if (!isValid) {
      setValidationErrors(errors);
      toast({
        title: 'Validation Error',
        description: formatValidationErrors(errors),
        status: 'warning',
      });
      return;
    }

    try {
      // Sanitize before sending
      const cleanData = sanitizeFormData(formData);
      
      const response = await axios.post('/api/trips', cleanData);
      toast({
        title: 'Success',
        description: 'Trip created successfully',
        status: 'success',
      });
      
      // Reset form
      setFormData({...});
    } catch (error) {
      const apiError = handleApiError(error, 'Trip creation');
      toast({
        title: apiError.title,
        description: apiError.description,
        status: apiError.status,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormControl isInvalid={!!validationErrors.riderName}>
        <FormLabel>Rider Name</FormLabel>
        <Input
          value={formData.riderName}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            riderName: e.target.value
          }))}
        />
        {validationErrors.riderName && (
          <Text fontSize="sm" color="red.500" mt={1}>
            {validationErrors.riderName}
          </Text>
        )}
      </FormControl>
      {/* More form fields... */}
    </form>
  );
};
```

### Example 2: Network Error Retry Logic

```javascript
import { handleApiError, isRetryableError } from '../utils/errorHandler';

const fetchDataWithRetry = async (url, maxRetries = 3) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      if (isRetryableError(error) && retries < maxRetries - 1) {
        retries++;
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, retries) * 1000)
        );
      } else {
        const apiError = handleApiError(error, 'Fetch data');
        throw apiError;
      }
    }
  }
};
```

---

## Best Practices

### 1. Always Validate on Submit
```javascript
// ✅ Good: Validate when user submits form
const handleSubmit = (e) => {
  e.preventDefault();
  const { isValid, errors } = validateForm(formData, schema);
  // Handle errors...
};

// ❌ Avoid: Validating on every keystroke (bad UX)
const handleChange = (e) => {
  validateField(e.target.name, e.target.value, schema);
};
```

### 2. Always Sanitize Before Sending to Backend
```javascript
// ✅ Good: Sanitize before API call
const cleanData = sanitizeFormData(formData);
await axios.post('/api/data', cleanData);

// ❌ Avoid: Sending raw user input
await axios.post('/api/data', formData);
```

### 3. Use Structured Error Handling
```javascript
// ✅ Good: Map all errors consistently
const apiError = handleApiError(error, 'operation');
toast({
  title: apiError.title,
  description: apiError.description,
  status: apiError.status,
});

// ❌ Avoid: Inconsistent error handling
toast({
  title: 'Error',
  description: error.response?.data?.message || error.message,
});
```

### 4. Show Validation Errors Inline
```javascript
// ✅ Good: Show error next to field
<FormControl isInvalid={!!errors.email}>
  <Input value={email} {...} />
  {errors.email && <Text color="red">{errors.email}</Text>}
</FormControl>

// ❌ Avoid: Generic error message at top
<Alert>{error}</Alert>
<Input value={email} {...} />
```

### 5. Provide Retry Options for Network Errors
```javascript
// ✅ Good: Allow retry on network errors
if (isRetryableError(error)) {
  toast({
    title: 'Connection Error',
    description: 'Check your internet connection',
    action: <Button onClick={retry}>Retry</Button>,
  });
}
```

---

## Extending Validations

### Create Custom Validation Schema

```javascript
// In your component or a new utils file
import { validators } from '../utils/validationSchemas';

const customSchema = {
  customField: {
    validate: (value) => {
      if (validators.isEmpty(value)) {
        return 'This field is required';
      }
      if (value.length < 5) {
        return 'Must be at least 5 characters';
      }
      return null;
    }
  }
};

// Use it
const { isValid, errors } = validateForm(formData, customSchema);
```

### Add Custom Validator Function

```javascript
// Add to validators object in validationSchemas.js
export const validators = {
  // ... existing validators
  
  isValidPostalCode(code) {
    // US postal code: 12345 or 12345-6789
    return /^\d{5}(-\d{4})?$/.test(code);
  }
};
```

---

## Testing Validation

```javascript
// Example test cases
import { validateForm, tripFormValidation } from '../utils/validationSchemas';

describe('Trip Validation', () => {
  it('should reject empty rider name', () => {
    const { isValid, errors } = validateForm(
      { riderName: '', ...otherFields },
      tripFormValidation
    );
    expect(isValid).toBe(false);
    expect(errors.riderName).toBeDefined();
  });

  it('should reject past dates', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { isValid, errors } = validateForm(
      { scheduledDate: yesterday.toISOString().split('T')[0], ...otherFields },
      tripFormValidation
    );
    expect(isValid).toBe(false);
  });
});
```

---

## Common Errors & Solutions

### Error: "Cannot find module validationSchemas"
**Solution**: Ensure import path is correct. If in a different folder, adjust path:
```javascript
// From components/dispatcher/
import { validateForm } from '../../utils/validationSchemas';

// From components/shared/
import { validateForm } from '../../../utils/validationSchemas';
```

### Error: "validationErrors is not updated"
**Solution**: Check that state is being reset. State updates are asynchronous:
```javascript
// ❌ Won't work
handleSubmit = () => {
  setValidationErrors(newErrors);
  // validationErrors is still old value here
};

// ✅ Use in render or useEffect
const [validationErrors, setValidationErrors] = useState({});
// validationErrors updated in render after state change
```

### Error: "Sanitization removing important characters"
**Solution**: `sanitizeInput()` uses HTML entity encoding. For URLs/emails with special chars:
```javascript
// Check what sanitized
const input = "example@email.com";
const clean = sanitizeInput(input);  // "example@email.com" (unchanged)

// Special chars are only escaped
const input2 = "<script>alert('hi')</script>";
const clean2 = sanitizeInput(input2);  // Safe for display
```

---

## Summary

- **Validation**: Use `validateForm()` on submit, `validateField()` for real-time
- **Sanitization**: Always sanitize with `sanitizeFormData()` before API calls
- **Error Handling**: Use `handleApiError()` to map status codes to messages
- **Display**: Show errors inline with `isInvalid` + error text below fields
- **Testing**: Test with empty inputs, special chars, edge cases
- **Maintenance**: All schemas in one file for easy updates

For questions or issues, refer to component implementations in:
- `DispatcherDashboard.jsx`
- `SchedulerDashboard.jsx`
- `ComprehensiveDriverDashboard.jsx`
