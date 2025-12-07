# Username-Based Authentication & Password Recovery Implementation

## Overview

This implementation provides username-based authentication with multiple password recovery options that don't depend on email, including security questions and admin-initiated password resets.

## Key Changes

### 1. User Model Updates (`backend/models/User.js`)

#### New Fields Added:
```javascript
{
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: false, // NOW OPTIONAL
    unique: true,
    sparse: true, // Allows null values to be non-unique
    lowercase: true,
    trim: true
  },
  securityQuestions: [{
    question: String,
    answer: String // Hashed automatically
  }],
  resetPasswordToken: String,
  resetPasswordExpires: Date
}
```

#### New Methods:
- `verifySecurityAnswer(questionIndex, candidateAnswer)` - Verify security question answers
- Security question answers are automatically hashed before saving

### 2. Authentication Routes (`backend/routes/auth.js`)

#### Updated Login Endpoint
```
POST /api/auth/login
Body: {
  "username": "johndoe",  // Can use username OR email
  "password": "password123"
}

OR

Body: {
  "email": "john@example.com",  // Can use email OR username
  "password": "password123"
}
```

#### Updated Registration Endpoint
```
POST /api/auth/register
Authorization: Bearer TOKEN (Admin only)
Body: {
  "username": "johndoe",  // REQUIRED
  "email": "john@example.com",  // OPTIONAL
  "password": "password123",  // REQUIRED
  "firstName": "John",
  "lastName": "Doe",
  "role": "driver",
  "phone": "555-1234",
  "securityQuestions": [  // OPTIONAL
    {
      "question": "What is your mother's maiden name?",
      "answer": "Smith"
    },
    {
      "question": "What city were you born in?",
      "answer": "New York"
    }
  ]
}
```

#### New Password Recovery Endpoints

**Step 1: Get Security Questions**
```
POST /api/auth/forgot-password/questions
Body: {
  "username": "johndoe"
}

Response: {
  "username": "johndoe",
  "questions": [
    { "index": 0, "question": "What is your mother's maiden name?" },
    { "index": 1, "question": "What city were you born in?" }
  ]
}
```

**Step 2: Verify Security Answers**
```
POST /api/auth/forgot-password/verify
Body: {
  "username": "johndoe",
  "answers": [
    { "index": 0, "answer": "Smith" },
    { "index": 1, "answer": "New York" }
  ]
}

Response: {
  "message": "Security questions verified",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Step 3: Reset Password**
```
POST /api/auth/forgot-password/reset
Body: {
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "newpassword123"
}

Response: {
  "message": "Password reset successfully. You can now login with your new password."
}
```

**Admin-Initiated Password Reset**
```
POST /api/auth/admin/reset-password/:userId
Authorization: Bearer TOKEN (Admin only)
Body: {
  "newPassword": "temporaryPass123"
}

OR (auto-generate temp password)

Body: {
  "tempPassword": true
}

Response: {
  "message": "Password reset successfully by administrator",
  "tempPassword": "Temp1733184000000"  // Only if auto-generated
}
```

### 3. User Routes (`backend/routes/users.js`)

#### New Endpoint: Update Security Questions
```
PATCH /api/users/:id/security-questions
Authorization: Bearer TOKEN
Body: {
  "securityQuestions": [
    {
      "question": "What is your favorite color?",
      "answer": "Blue"
    },
    {
      "question": "What is your pet's name?",
      "answer": "Max"
    }
  ]
}

Requirements:
- Minimum 2 security questions
- Users can update their own, admins can update anyone's
- Answers are automatically hashed
```

### 4. Migration Script (`backend/scripts/addUsernames.js`)

Adds usernames to existing users:
```bash
cd backend
node scripts/addUsernames.js
```

This script:
- Finds all users without usernames
- Generates usernames from email prefixes or firstName+lastName
- Ensures uniqueness (adds numbers if needed)
- Makes email optional for users with placeholder emails

## Password Recovery Flow

### Option 1: Security Questions (User Self-Service)

```
User                          System
  |                              |
  |--- Enter Username ---------->|
  |                              |
  |<-- Security Questions -------|
  |                              |
  |--- Submit Answers ---------->|
  |                              |
  |<-- Reset Token (15min) ------|
  |                              |
  |--- New Password + Token ---->|
  |                              |
  |<-- Success Message ----------|
```

**Security Features:**
- Answers are hashed (bcrypt)
- Reset token expires in 15 minutes
- Token is single-use
- Failed attempts are logged
- No user enumeration (same response if user doesn't exist)

### Option 2: Phone-Based Verification (Future Enhancement)

If phone numbers are stored:
1. User enters username
2. System sends SMS code to registered phone
3. User enters code
4. User sets new password

### Option 3: Admin-Initiated Reset

1. Admin logs in
2. Navigates to user management
3. Selects user → Reset Password
4. Optionally provides new password or auto-generates
5. Admin provides new password to user through secure channel

## Security Considerations

### Username Requirements:
- 3-30 characters
- Alphanumeric only (a-z, 0-9)
- Case-insensitive (stored as lowercase)
- Unique across system

### Security Questions:
- Minimum 2 questions required
- Answers minimum 2 characters
- Answers are case-insensitive
- Answers are hashed with bcrypt
- Multiple verification attempts logged

### Password Reset Tokens:
- Short-lived (15 minutes)
- Single-use
- JWT-based with specific purpose claim
- Invalidated after use

### Admin Password Reset:
- Requires admin role
- Fully logged with target user info
- Can generate temporary passwords
- Admins should provide passwords through secure channels

## Database Schema Changes

### Before:
```javascript
{
  email: "john@example.com",  // REQUIRED
  password: "hashed",
  firstName: "John",
  lastName: "Doe",
  role: "driver"
}
```

### After:
```javascript
{
  username: "johndoe",  // NEW - REQUIRED
  email: "john@example.com",  // NOW OPTIONAL
  password: "hashed",
  firstName: "John",
  lastName: "Doe",
  role: "driver",
  securityQuestions: [  // NEW - OPTIONAL
    {
      question: "Mother's maiden name?",
      answer: "hashed_answer"
    }
  ],
  resetPasswordToken: "jwt_token",  // NEW
  resetPasswordExpires: "2025-12-02T10:30:00Z"  // NEW
}
```

## Migration Steps

### Step 1: Run Username Migration
```bash
cd backend
node scripts/addUsernames.js
```

### Step 2: Update Frontend Login Component
- Add username field
- Make email optional
- Support username OR email login

### Step 3: Update Registration Forms
- Add username field (required)
- Make email optional
- Add security questions setup (optional)

### Step 4: Test Password Recovery
1. Create test user with security questions
2. Test forgot password flow
3. Test admin password reset
4. Verify token expiration

## API Testing Examples

### Test Username Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123"
  }'
```

### Test Password Recovery
```bash
# Step 1: Get questions
curl -X POST http://localhost:3001/api/auth/forgot-password/questions \
  -H "Content-Type: application/json" \
  -d '{"username": "johndoe"}'

# Step 2: Verify answers
curl -X POST http://localhost:3001/api/auth/forgot-password/verify \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "answers": [
      {"index": 0, "answer": "Smith"},
      {"index": 1, "answer": "New York"}
    ]
  }'

# Step 3: Reset password
curl -X POST http://localhost:3001/api/auth/forgot-password/reset \
  -H "Content-Type: application/json" \
  -d '{
    "resetToken": "YOUR_TOKEN_HERE",
    "newPassword": "newpass123"
  }'
```

### Test Admin Reset
```bash
curl -X POST http://localhost:3001/api/auth/admin/reset-password/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPassword": "temppass123"}'
```

## Backward Compatibility

✅ **Fully backward compatible:**
- Existing users with emails can still login with email
- Login endpoint accepts both username and email
- Email field remains in database (optional)
- No breaking changes to existing API contracts

## Common Security Questions

Suggested questions for your system:
1. What is your mother's maiden name?
2. What city were you born in?
3. What is the name of your first pet?
4. What is your favorite color?
5. What street did you grow up on?
6. What is your favorite food?
7. What is the name of your first school?
8. What is your father's middle name?

**Best Practices:**
- Use questions with memorable answers
- Avoid questions with easily guessable answers
- Require at least 2-3 questions
- Allow users to update questions periodically

## Troubleshooting

### Issue: "Username already exists"
**Solution:** Usernames must be unique. Try:
- Adding numbers: `johndoe2`
- Adding initials: `johndoe_jd`
- Using full name: `johndaviesdoe`

### Issue: "Security questions not found"
**Solution:** User hasn't set up security questions
- Direct user to set up security questions in profile
- OR use admin password reset
- OR implement phone-based recovery

### Issue: "Reset token expired"
**Solution:** Tokens expire after 15 minutes
- User must restart password recovery process
- Generate new token by re-verifying security questions

### Issue: Migration fails
**Solution:**
- Check MongoDB connection
- Verify User model schema
- Check for duplicate emails/usernames
- Run with `node --trace-warnings scripts/addUsernames.js`

## Future Enhancements

1. **Phone-Based Recovery**
   - SMS verification codes
   - Voice call verification
   - WhatsApp/Telegram integration

2. **Two-Factor Authentication**
   - TOTP (Time-based One-Time Password)
   - SMS-based 2FA
   - Backup codes

3. **Password Strength Meter**
   - Real-time password strength indicator
   - Enforce strong password policies
   - Password history (prevent reuse)

4. **Account Lockout**
   - Lock account after N failed attempts
   - Temporary lockout (15-30 minutes)
   - Admin unlock capability

5. **Security Question Pool**
   - Predefined question library
   - Custom question support
   - Question rotation/update reminders

## Support & Maintenance

- **Activity Logging:** All password recovery attempts are logged
- **Monitoring:** Monitor failed recovery attempts for suspicious activity
- **Regular Updates:** Update security questions periodically
- **User Education:** Provide guidance on choosing secure questions/answers

## Compliance Notes

- Passwords are hashed with bcrypt (12 rounds)
- Security answers are hashed with bcrypt (12 rounds)
- Reset tokens are short-lived (15 minutes)
- All authentication events are logged
- No sensitive data in logs or error messages
- GDPR-compliant (email optional, user data portable)
