# OAuth Integration Feature

## Overview

The Transportation Management MVP now supports OAuth 2.0 authentication with **Google**, **Microsoft**, and **Apple**. This allows users to sign in using their existing social accounts, providing a faster and more convenient authentication experience.

## Features

### Core Functionality
- **Multi-Provider Support**: Google, Microsoft, and Apple OAuth
- **Account Linking**: Link multiple OAuth providers to a single account
- **Automatic Account Creation**: New users can register via OAuth
- **Secure Token Handling**: JWT tokens with 7-day expiration
- **Email Verification**: OAuth emails are automatically verified
- **Profile Synchronization**: User profile data (name, email, photo) synced from OAuth providers

### Security Features
- **Audit Logging**: All OAuth activities logged (login, link, unlink)
- **Safe Unlinking**: Prevents removing the last authentication method
- **Token Storage**: OAuth tokens stored securely (not returned by default)
- **Session Management**: Proper session handling with Passport.js
- **Error Handling**: Comprehensive error messages and graceful failures

## Architecture

### Backend Components

#### 1. Passport Configuration (`backend/config/passport.js`)
- Configures Passport.js with OAuth strategies
- Handles user creation and account linking
- Manages OAuth callbacks
- Supports three strategies:
  - `passport-google-oauth20`
  - `passport-microsoft`
  - `passport-apple`

#### 2. OAuth Routes (`backend/routes/oauth.js`)
- **Public Endpoints**:
  - `GET /api/auth/oauth/status` - Check which providers are configured
  - `GET /api/auth/google` - Initiate Google OAuth
  - `GET /api/auth/google/callback` - Google OAuth callback
  - `GET /api/auth/microsoft` - Initiate Microsoft OAuth
  - `GET /api/auth/microsoft/callback` - Microsoft OAuth callback
  - `GET /api/auth/apple` - Initiate Apple OAuth
  - `POST /api/auth/apple/callback` - Apple OAuth callback (POST method)
  
- **Authenticated Endpoints**:
  - `GET /api/auth/oauth/linked` - Get user's linked providers
  - `POST /api/auth/oauth/link/:provider` - Link a provider
  - `DELETE /api/auth/oauth/:provider` - Unlink a provider

#### 3. User Model (`backend/models/User.js`)
New fields added:
```javascript
oauthProviders: [{
  provider: String,        // 'google', 'microsoft', 'apple'
  providerId: String,      // Unique ID from provider
  accessToken: String,     // OAuth access token (hidden)
  refreshToken: String,    // OAuth refresh token (hidden)
  profile: {
    email: String,
    displayName: String,
    firstName: String,
    lastName: String,
    photo: String
  },
  linkedAt: Date,          // When linked
  lastUsed: Date           // Last login with this provider
}]
```

### Frontend Components

#### 1. OAuth Buttons (`frontend/src/components/auth/OAuthButtons.jsx`)
- Displays social login buttons
- Automatically detects configured providers
- Handles OAuth initiation
- Props:
  - `redirectPath` - Where to redirect after login (default: '/dashboard')
  - `onSuccess` - Callback on successful OAuth
  - `onError` - Callback on OAuth error

**Usage Example:**
```jsx
import OAuthButtons from './components/auth/OAuthButtons';

function Login() {
  return (
    <div>
      {/* Regular login form */}
      
      {/* OAuth buttons */}
      <OAuthButtons 
        redirectPath="/dashboard"
        onSuccess={(user) => console.log('Logged in:', user)}
        onError={(error) => console.error('OAuth error:', error)}
      />
    </div>
  );
}
```

#### 2. OAuth Callback Handler (`frontend/src/components/auth/OAuthCallback.jsx`)
- Route: `/auth/callback`
- Processes OAuth provider callbacks
- Extracts and stores JWT token
- Handles success/error states
- Redirects to appropriate page

**Router Setup:**
```jsx
import OAuthCallback from './components/auth/OAuthCallback';

<Route path="/auth/callback" element={<OAuthCallback />} />
```

#### 3. OAuth Account Management (`frontend/src/components/auth/OAuthAccountManagement.jsx`)
- Displays linked OAuth accounts
- Link/unlink functionality
- Shows connection status and dates
- Prevents unlinking last auth method
- For use in user profile/settings page

**Usage Example:**
```jsx
import OAuthAccountManagement from './components/auth/OAuthAccountManagement';

function UserSettings() {
  return (
    <div>
      <h2>Connected Accounts</h2>
      <OAuthAccountManagement />
    </div>
  );
}
```

## Setup & Configuration

### 1. Install Dependencies

Already installed:
```bash
npm install passport passport-google-oauth20 passport-microsoft passport-apple
```

### 2. Environment Variables

Add to your `.env` file:

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

APPLE_CLIENT_ID=your_apple_client_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY_PATH=./certs/AuthKey_XXXXXXXX.p8

# URLs
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

### 3. Provider Setup

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - `https://your-domain.com/api/auth/google/callback` (production)
7. Copy Client ID and Client Secret to `.env`

#### Microsoft OAuth Setup
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Set redirect URI:
   - `http://localhost:5000/api/auth/microsoft/callback` (development)
   - `https://your-domain.com/api/auth/microsoft/callback` (production)
5. Go to "Certificates & secrets" → Create new client secret
6. Copy Application (client) ID and client secret to `.env`

#### Apple OAuth Setup
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Sign in with your Apple Developer account
3. Go to "Certificates, Identifiers & Profiles"
4. Create a new Service ID
5. Enable "Sign In with Apple"
6. Configure domains and redirect URLs:
   - `http://localhost:5000/api/auth/apple/callback` (development)
   - `https://your-domain.com/api/auth/apple/callback` (production)
7. Create a private key for Sign In with Apple
8. Download the `.p8` key file and save to `backend/certs/`
9. Copy Team ID, Service ID (Client ID), and Key ID to `.env`

### 4. Frontend Environment

Add to `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

### 5. Router Configuration

Add the OAuth callback route to your React Router:
```jsx
import OAuthCallback from './components/auth/OAuthCallback';

<Routes>
  {/* ... other routes ... */}
  <Route path="/auth/callback" element={<OAuthCallback />} />
</Routes>
```

## Usage Examples

### Basic Login Page

```jsx
import React, { useState } from 'react';
import { Box, Input, Button, VStack } from '@chakra-ui/react';
import OAuthButtons from './components/auth/OAuthButtons';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Handle regular login
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6}>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" width="100%" colorScheme="blue">
            Sign In
          </Button>
          
          {/* OAuth Buttons */}
          <OAuthButtons redirectPath="/dashboard" />
        </VStack>
      </form>
    </Box>
  );
}
```

### User Profile Page with OAuth Management

```jsx
import React from 'react';
import { Box, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import OAuthAccountManagement from './components/auth/OAuthAccountManagement';

function UserProfile() {
  return (
    <Box p={6}>
      <Tabs>
        <TabList>
          <Tab>Profile</Tab>
          <Tab>Connected Accounts</Tab>
          <Tab>Security</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            {/* Profile form */}
          </TabPanel>
          
          <TabPanel>
            <OAuthAccountManagement />
          </TabPanel>
          
          <TabPanel>
            {/* Security settings */}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
```

### Checking OAuth Status

```javascript
import axios from 'axios';

async function checkOAuthProviders() {
  const response = await axios.get(
    'http://localhost:5000/api/auth/oauth/status'
  );
  
  console.log('Available providers:', response.data.providers);
  // { google: true, microsoft: false, apple: true }
}
```

## Security Considerations

### Best Practices

1. **Always Use HTTPS in Production**
   - OAuth requires secure connections
   - Update redirect URIs to use `https://`

2. **Keep Secrets Secure**
   - Never commit `.env` files
   - Use environment-specific secrets
   - Rotate credentials periodically

3. **Validate Redirect URIs**
   - Only whitelist your domains
   - Avoid wildcards in production

4. **Handle Token Storage**
   - OAuth tokens stored securely in database
   - Access tokens not returned by default (use `select: false`)
   - Consider token encryption for extra security

5. **Audit Logging**
   - All OAuth activities logged
   - Monitor for suspicious patterns
   - Review audit logs regularly

6. **Account Linking Protection**
   - Users must have at least one auth method
   - Cannot unlink if no password set and only one provider
   - Email verification required for manual registration

### Rate Limiting

OAuth endpoints use the global rate limiter:
- 100 requests per 15 minutes per IP
- Additional limits on sensitive operations

### Error Handling

The system gracefully handles:
- Missing OAuth credentials (provider won't appear)
- Failed authentication (redirects to login with error)
- Network errors (shows user-friendly message)
- Invalid tokens (clears storage and requires re-login)

## Monitoring & Analytics

### Audit Log Queries

Check OAuth usage:
```javascript
// Get OAuth login statistics
db.auditlogs.aggregate([
  {
    $match: {
      action: 'login_success',
      'details.method': { $regex: 'oauth' }
    }
  },
  {
    $group: {
      _id: '$details.method',
      count: { $sum: 1 }
    }
  }
]);

// Recent OAuth account links
db.auditlogs.find({
  action: 'oauth_link',
  category: 'authentication'
}).sort({ createdAt: -1 }).limit(10);
```

### User Statistics

```javascript
// Count users by OAuth provider
db.users.aggregate([
  { $unwind: '$oauthProviders' },
  {
    $group: {
      _id: '$oauthProviders.provider',
      count: { $sum: 1 }
    }
  }
]);

// Users with multiple OAuth providers
db.users.find({
  $expr: { $gt: [{ $size: '$oauthProviders' }, 1] }
});
```

## Testing

### Development Mode

OAuth works in development with proper configuration:

1. **Update Provider Redirect URIs**:
   - Add `http://localhost:5000/api/auth/{provider}/callback`

2. **Test Each Provider**:
   ```bash
   # Start backend
   cd backend
   npm run dev
   
   # Start frontend
   cd frontend
   npm run dev
   ```

3. **Test Flow**:
   - Click OAuth button
   - Sign in with provider
   - Check callback handling
   - Verify token storage
   - Confirm redirection

### Test Scenarios

1. **New User Registration via OAuth**
   - Should create new account
   - Email automatically verified
   - Default role: 'rider'

2. **Existing User Login via OAuth**
   - Should match by email
   - Link provider if not already linked
   - Update last used timestamp

3. **Account Linking**
   - User with password links Google
   - User with Google links Microsoft
   - Both should work

4. **Account Unlinking**
   - Cannot unlink if only auth method
   - Can unlink if has password
   - Can unlink if has other providers

5. **Error Handling**
   - Invalid credentials
   - User cancels OAuth
   - Network errors
   - Missing email from provider

## Troubleshooting

### Common Issues

#### 1. "OAuth provider not configured" Error
**Cause**: Missing environment variables  
**Solution**: 
- Check `.env` file for all required variables
- Restart backend server after adding variables
- Verify no typos in variable names

#### 2. "Redirect URI mismatch" Error
**Cause**: Redirect URI not whitelisted in provider console  
**Solution**:
- Add exact callback URL to provider settings
- Must match `BACKEND_URL + /api/auth/{provider}/callback`
- Check for trailing slashes

#### 3. OAuth Button Not Showing
**Cause**: Provider not configured or frontend can't reach status endpoint  
**Solution**:
- Check provider is configured in backend `.env`
- Verify CORS settings allow frontend origin
- Check browser console for network errors

#### 4. "No email found in profile" Error
**Cause**: Provider didn't return email or email permission not granted  
**Solution**:
- Ensure email scope is requested (Google: 'email', Microsoft: 'user.read')
- Check provider console for required permissions
- Verify user granted email permission

#### 5. Token Not Stored After Callback
**Cause**: Frontend not receiving token or localStorage issue  
**Solution**:
- Check network tab for redirect with token parameter
- Verify `OAuthCallback` component is mounted at `/auth/callback`
- Check for localStorage errors in console

## Future Enhancements

### Planned Features
- [ ] Refresh token rotation
- [ ] OAuth token expiration handling
- [ ] More providers (GitHub, LinkedIn, Twitter/X)
- [ ] OAuth for mobile apps (PKCE flow)
- [ ] SSO (Single Sign-On) support
- [ ] Admin analytics dashboard for OAuth usage
- [ ] OAuth profile photo sync
- [ ] Automatic email updates from OAuth providers

### Integration Opportunities
- **2FA Integration**: Require 2FA even with OAuth
- **Phone Verification**: Request phone after OAuth signup
- **Role Assignment**: Auto-assign roles based on email domain
- **Team Invites**: OAuth users can be invited to teams
- **Sync Contacts**: Import contacts from OAuth providers

## API Reference

### Check OAuth Status
```http
GET /api/auth/oauth/status
```

**Response:**
```json
{
  "success": true,
  "providers": {
    "google": true,
    "microsoft": false,
    "apple": true
  }
}
```

### Initiate OAuth (Google Example)
```http
GET /api/auth/google
```
Redirects to Google OAuth consent screen.

### OAuth Callback (Google Example)
```http
GET /api/auth/google/callback?code={auth_code}
```
Redirects to frontend with token:
```
http://localhost:5173/auth/callback?token={jwt_token}&provider=google
```

### Get Linked Providers
```http
GET /api/auth/oauth/linked
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "providers": [
    {
      "provider": "google",
      "linkedAt": "2025-12-06T10:30:00.000Z",
      "lastUsed": "2025-12-06T14:20:00.000Z",
      "email": "user@gmail.com"
    }
  ],
  "hasPassword": true
}
```

### Link OAuth Provider
```http
POST /api/auth/oauth/link/google
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "redirectUrl": "http://localhost:5000/api/auth/google",
  "message": "Redirect to this URL to link your google account"
}
```

### Unlink OAuth Provider
```http
DELETE /api/auth/oauth/google
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "message": "google account unlinked successfully"
}
```

**Error Response (Cannot Unlink):**
```json
{
  "success": false,
  "message": "Cannot unlink the only authentication method. Please set a password first."
}
```

---

## Summary

The OAuth integration provides a modern, secure, and user-friendly authentication option for the Transportation Management MVP. With support for three major providers and comprehensive account management features, users can choose their preferred sign-in method while maintaining security and flexibility.

**Key Benefits:**
- Faster user registration and login
- No password to remember (optional)
- Trusted authentication through major providers
- Flexible account linking
- Full audit trail for compliance

For additional support or questions, refer to the provider documentation or contact the development team.
