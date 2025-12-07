# Input Validation System

## Overview
Comprehensive input validation system that enforces data type constraints across the entire application. This ensures data integrity and improves user experience by providing immediate feedback on invalid input.

## Core Features
- ✅ **Type-specific validation** - Numeric-only for phones, letters-only for names
- ✅ **Real-time formatting** - Auto-format phone numbers as (XXX) XXX-XXXX
- ✅ **Visual feedback** - Error messages and invalid states
- ✅ **Reusable components** - ValidatedInput component for easy integration
- ✅ **Utility functions** - Standalone validators for custom use cases

---

## Quick Start

### Using ValidatedInput Component (Recommended)

```jsx
import ValidatedInput from '../shared/ValidatedInput';

// Phone number input
<ValidatedInput
  fieldType="phone"
  label="Phone Number"
  value={phone}
  onChange={setPhone}
  isRequired
  placeholder="(555) 123-4567"
/>

// Name input (letters only)
<ValidatedInput
  fieldType="firstName"
  label="First Name"
  value={firstName}
  onChange={setFirstName}
  isRequired
/>

// Email input
<ValidatedInput
  fieldType="email"
  label="Email Address"
  value={email}
  onChange={setEmail}
  isRequired
/>
```

### Using Validation Utilities Directly

```jsx
import { 
  formatPhoneNumber, 
  formatNameInput, 
  isValidEmail 
} from '../../utils/inputValidation';

// In your component
<Input
  value={phone}
  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
  maxLength={14}
/>
```

---

## Field Types & Validators

### Name Fields (Letters Only)
**Field Types:** `firstName`, `lastName`, `riderName`, `driverName`, `name`

**Validation:**
- Only letters, spaces, hyphens (-), and apostrophes (')
- Automatically filters out numbers and special characters

**Usage:**
```jsx
import { formatNameInput } from '../../utils/inputValidation';

<Input
  value={firstName}
  onChange={(e) => setFirstName(formatNameInput(e.target.value))}
/>
```

---

### Phone Number Fields (Numeric Only)
**Field Types:** `phone`, `phoneNumber`, `trackingPhone`, `emergencyContact`

**Validation:**
- Only digits (0-9)
- Auto-formats as (XXX) XXX-XXXX
- Requires exactly 10 digits for validity

**Usage:**
```jsx
import { formatPhoneNumber, isValidPhoneNumber } from '../../utils/inputValidation';

<FormControl isInvalid={phone && !isValidPhoneNumber(phone)}>
  <FormLabel>Phone</FormLabel>
  <Input
    value={phone}
    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
    maxLength={14}
  />
  {phone && !isValidPhoneNumber(phone) && (
    <FormErrorMessage>Please enter a valid 10-digit phone number</FormErrorMessage>
  )}
</FormControl>
```

**Storage:** When saving to database, use `getRawPhoneNumber()` to extract digits only:
```jsx
const userData = {
  phone: getRawPhoneNumber(formData.phone) // Returns "5551234567"
};
```

---

### Email Fields
**Field Type:** `email`

**Validation:**
- Standard email format (user@domain.com)
- Real-time validation with `isValidEmail()`

**Usage:**
```jsx
import { isValidEmail } from '../../utils/inputValidation';

<FormControl isInvalid={email && !isValidEmail(email)}>
  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
  {email && !isValidEmail(email) && (
    <FormErrorMessage>Please enter a valid email address</FormErrorMessage>
  )}
</FormControl>
```

---

### Numeric Fields (Numbers Only)
**Field Types:** `capacity`, `age`, `fuelLevel`, `year`

**Validation:**
- Only digits (0-9)
- No decimals

**Usage:**
```jsx
import { formatNumericInput } from '../../utils/inputValidation';

<Input
  value={capacity}
  onChange={(e) => setCapacity(formatNumericInput(e.target.value))}
/>
```

---

### Decimal Fields (Money, Distance)
**Field Types:** `price`, `distance`

**Validation:**
- Numbers with decimal point
- Limited to 2 decimal places (configurable)

**Usage:**
```jsx
import { formatDecimalInput } from '../../utils/inputValidation';

<Input
  value={price}
  onChange={(e) => setPrice(formatDecimalInput(e.target.value, 2))}
  placeholder="0.00"
/>
```

---

### Vehicle Fields

#### VIN (Vehicle Identification Number)
**Field Type:** `vin`

**Validation:**
- Exactly 17 alphanumeric characters
- Auto-converts to uppercase

**Usage:**
```jsx
import { formatVIN } from '../../utils/inputValidation';

<Input
  value={vin}
  onChange={(e) => setVin(formatVIN(e.target.value))}
  maxLength={17}
/>
```

#### License Plate
**Field Type:** `licensePlate`

**Validation:**
- Alphanumeric with spaces and hyphens
- Max 10 characters
- Auto-converts to uppercase

**Usage:**
```jsx
import { formatLicensePlate } from '../../utils/inputValidation';

<Input
  value={plate}
  onChange={(e) => setPlate(formatLicensePlate(e.target.value))}
  maxLength={10}
/>
```

#### Year
**Field Type:** `year`

**Validation:**
- 4 digits only
- Range: 1900 to current year + 1

**Usage:**
```jsx
import { formatYear, isValidYear } from '../../utils/inputValidation';

<Input
  value={year}
  onChange={(e) => setYear(formatYear(e.target.value))}
  maxLength={4}
/>
```

---

### Address Fields
**Field Types:** `address`, `pickupLocation`, `dropoffLocation`

**Validation:**
- Alphanumeric with spaces, commas, periods, and hyphens

**Usage:**
```jsx
import { formatAddressInput } from '../../utils/inputValidation';

<Input
  value={address}
  onChange={(e) => setAddress(formatAddressInput(e.target.value))}
/>
```

---

### ID Fields
**Field Types:** `tripId`, `vehicleId`, `userId`

**Validation:**
- Alphanumeric only (no spaces or special characters)

**Usage:**
```jsx
import { formatAlphanumeric } from '../../utils/inputValidation';

<Input
  value={tripId}
  onChange={(e) => setTripId(formatAlphanumeric(e.target.value))}
/>
```

---

## Complete API Reference

### Formatting Functions

| Function | Input | Output | Description |
|----------|-------|--------|-------------|
| `formatPhoneNumber(value)` | "5551234567" | "(555) 123-4567" | Formats phone with parentheses and hyphens |
| `getRawPhoneNumber(value)` | "(555) 123-4567" | "5551234567" | Extracts digits only |
| `formatNameInput(value)` | "John123" | "John" | Removes non-letter characters |
| `formatAlphanumeric(value)` | "ABC-123!" | "ABC123" | Removes non-alphanumeric |
| `formatAddressInput(value)` | "123 Main St." | "123 Main St." | Allows address characters |
| `formatNumericInput(value)` | "12a34" | "1234" | Digits only |
| `formatDecimalInput(value, decimals)` | "12.999" | "12.99" | Numbers with decimals |
| `formatVIN(value)` | "abc123xyz" | "ABC123XYZ" | Uppercase alphanumeric |
| `formatLicensePlate(value, max)` | "abc 123" | "ABC 123" | Uppercase with spaces |
| `formatYear(value)` | "2023abc" | "2023" | 4 digits only |
| `formatZipCode(value)` | "123456789" | "12345-6789" | ZIP code format |
| `formatTimeInput(value)` | "1430" | "14:30" | HH:MM format |
| `formatMileage(value)` | "123456" | "123,456" | Adds thousand separators |

### Validation Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `isValidPhoneNumber(value)` | boolean | True if exactly 10 digits |
| `isValidEmail(email)` | boolean | True if valid email format |
| `isValidYear(year, min, max)` | boolean | True if within year range |
| `isValidTime(time)` | boolean | True if valid HH:MM format |

### Helper Functions

| Function | Description |
|----------|-------------|
| `getValidator(fieldName)` | Returns appropriate validator for field name |
| `createValidatedHandler(setter, validator)` | Creates onChange handler with validation |

---

## Implementation Examples

### Advanced Trip Search (AdvancedSearchModal.jsx)
```jsx
import { formatNameInput, formatAlphanumeric } from '../../utils/inputValidation';

// Rider name - letters only
<Input
  value={searchCriteria.riderName}
  onChange={(e) => setSearchCriteria({
    ...searchCriteria,
    riderName: formatNameInput(e.target.value)
  })}
/>

// Trip ID - alphanumeric only
<Input
  value={searchCriteria.tripId}
  onChange={(e) => setSearchCriteria({
    ...searchCriteria,
    tripId: formatAlphanumeric(e.target.value)
  })}
/>
```

### New Rider Form (NewRider.jsx)
```jsx
import { 
  formatPhoneNumber, 
  getRawPhoneNumber,
  formatNameInput,
  isValidPhoneNumber,
  isValidEmail
} from '../../utils/inputValidation';

// Name validation
<Input
  value={formData.firstName}
  onChange={(e) => setFormData({
    ...formData,
    firstName: formatNameInput(e.target.value)
  })}
/>

// Phone validation with error feedback
<FormControl isInvalid={phone && !isValidPhoneNumber(phone)}>
  <Input
    value={formData.phone}
    onChange={(e) => setFormData({
      ...formData,
      phone: formatPhoneNumber(e.target.value)
    })}
    maxLength={14}
  />
  {phone && !isValidPhoneNumber(phone) && (
    <Text color="red.500">Enter a valid 10-digit phone number</Text>
  )}
</FormControl>

// Before submitting, convert to raw format
const submitData = {
  ...formData,
  phone: getRawPhoneNumber(formData.phone) // Store as "5551234567"
};
```

### Registration Form (Register.jsx)
```jsx
import { formatPhoneNumber, formatNameInput, isValidEmail } from '../../utils/inputValidation';

const handleChange = (e) => {
  const { name, value } = e.target;
  
  if (name === 'firstName' || name === 'lastName') {
    setFormData(prev => ({ ...prev, [name]: formatNameInput(value) }));
  } else if (name === 'phone') {
    setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
  } else {
    setFormData(prev => ({ ...prev, [name]: value }));
  }
};

// Validation before submit
if (formData.phone && !isValidPhoneNumber(formData.phone)) {
  setError('Please enter a valid 10-digit phone number');
  return;
}

if (!isValidEmail(formData.email)) {
  setError('Please enter a valid email address');
  return;
}
```

---

## Components Updated

### ✅ Completed
1. **AdvancedSearchModal.jsx** - Trip and rider search inputs
2. **NewRider.jsx** - Full rider registration form with validation
3. **Register.jsx** - User registration with name and phone validation

### 🔄 Ready to Update
- **AdminRegistration.jsx** - Admin user creation
- **ComprehensiveVehicleDashboard.jsx** - Vehicle forms with phone tracking
- **VehicleProfilePage.jsx** - Vehicle details and tracking phone
- **TripManagement.jsx** - Trip creation with rider phone
- **RecurringTrips.jsx** - Recurring trip forms
- **DispatcherDashboard.jsx** - Quick trip creation
- **ComprehensiveRiderDashboard.jsx** - Rider editing

---

## Best Practices

### 1. Always Format Input
```jsx
// ✅ Good - Formats as user types
<Input
  value={phone}
  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
/>

// ❌ Bad - No formatting
<Input
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
/>
```

### 2. Add Visual Validation Feedback
```jsx
// ✅ Good - Shows error state
<FormControl isInvalid={phone && !isValidPhoneNumber(phone)}>
  <Input ... />
  <FormErrorMessage>Invalid phone number</FormErrorMessage>
</FormControl>

// ❌ Bad - No feedback
<Input ... />
```

### 3. Validate Before Submission
```jsx
// ✅ Good - Validates before API call
if (formData.phone && !isValidPhoneNumber(formData.phone)) {
  toast({ title: 'Error', description: 'Invalid phone' });
  return;
}
await submitForm();

// ❌ Bad - Sends invalid data
await submitForm(); // May fail on backend
```

### 4. Store Raw Values in Database
```jsx
// ✅ Good - Stores digits only
const userData = {
  phone: getRawPhoneNumber(formData.phone) // "5551234567"
};

// ❌ Bad - Stores formatted string
const userData = {
  phone: formData.phone // "(555) 123-4567"
};
```

### 5. Set Appropriate maxLength
```jsx
// ✅ Good - Prevents over-entry
<Input
  value={phone}
  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
  maxLength={14} // Matches (XXX) XXX-XXXX format
/>

// ❌ Bad - Allows unlimited input
<Input value={phone} onChange={...} />
```

---

## Testing Validation

### Manual Testing Checklist
- [ ] Name fields reject numbers and special characters
- [ ] Phone fields format correctly as (XXX) XXX-XXXX
- [ ] Phone fields show error for incomplete numbers
- [ ] Email fields validate format
- [ ] Numeric fields reject letters
- [ ] VIN fields convert to uppercase and limit to 17 chars
- [ ] Year fields only accept 4 digits
- [ ] Address fields allow appropriate punctuation
- [ ] ID fields are alphanumeric only

### Test Cases
```javascript
// Phone formatting
formatPhoneNumber("5551234567") // Returns "(555) 123-4567"
formatPhoneNumber("555") // Returns "(555"
formatPhoneNumber("abc555") // Returns "(555"

// Phone validation
isValidPhoneNumber("(555) 123-4567") // Returns true
isValidPhoneNumber("(555) 123-456") // Returns false

// Name formatting
formatNameInput("John123Smith") // Returns "JohnSmith"
formatNameInput("O'Brien-Smith") // Returns "O'Brien-Smith"

// Email validation
isValidEmail("user@example.com") // Returns true
isValidEmail("invalid.email") // Returns false
```

---

## Migration Guide

### Converting Existing Forms

**Before:**
```jsx
<Input
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
/>
```

**After:**
```jsx
import { formatPhoneNumber } from '../../utils/inputValidation';

<Input
  value={phone}
  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
  maxLength={14}
/>
```

---

## Future Enhancements

- [ ] Add backend validation middleware
- [ ] Create validation schema using Yup or Zod
- [ ] Add i18n support for validation messages
- [ ] Create form-level validation hook
- [ ] Add debounced async validation (e.g., check email availability)
- [ ] Add accessibility improvements (aria-invalid, aria-describedby)

---

## Support

For questions or issues with the validation system:
1. Check this documentation for examples
2. Review `inputValidation.js` for available functions
3. Look at implemented components (NewRider, Register, AdvancedSearchModal)
4. Test with ValidatedInput component first before custom implementation

---

**Version:** 1.0.0  
**Last Updated:** November 23, 2025  
**Maintained by:** Development Team
