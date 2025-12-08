# Complete Setup Guide - OAuth & Integrations

## 📋 Table of Contents
1. [Google Calendar OAuth Setup](#google-calendar-oauth-setup)
2. [Outlook Calendar OAuth Setup](#outlook-calendar-oauth-setup)
3. [Gmail Email Setup](#gmail-email-setup)
4. [Twilio SMS Setup](#twilio-sms-setup)
5. [Environment Variables Configuration](#environment-variables-configuration)
6. [Testing Integrations](#testing-integrations)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Google Calendar OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter project name: `Transportation Management System`
5. Click **"Create"**

### Step 2: Enable Google Calendar API

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Calendar API"**
3. Click on it and click **"Enable"**

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (or Internal if you have Google Workspace)
3. Click **"Create"**

4. **Fill in the required information**:
   - App name: `Transportation Management System`
   - User support email: Your email
   - Developer contact: Your email
   - Click **"Save and Continue"**

5. **Add Scopes**:
   - Click **"Add or Remove Scopes"**
   - Search for and add:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Click **"Update"** and **"Save and Continue"**

6. **Add Test Users** (for external apps):
   - Click **"Add Users"**
   - Add email addresses of users who will test
   - Click **"Save and Continue"**

7. Click **"Back to Dashboard"**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Select **"Web application"**
4. Enter name: `Transportation Web App`

5. **Add Authorized redirect URIs**:
   ```
   http://localhost:3001/api/calendar/google/callback
   https://yourdomain.com/api/calendar/google/callback
   ```
   (Add production URL when deploying)

6. Click **"Create"**

7. **Save the credentials**:
   - Copy **Client ID**
   - Copy **Client Secret**
   - Store these securely!

### Step 5: Add to .env

```bash
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/google/callback
```

---

## 📅 Outlook Calendar OAuth Setup

### Step 1: Register Azure AD Application

1. Go to [Azure Portal](https://portal.azure.com/)
2. Search for **"Azure Active Directory"** and click on it
3. In the left menu, click **"App registrations"**
4. Click **"New registration"**

### Step 2: Configure Application

1. **Fill in the registration form**:
   - Name: `Transportation Management System`
   - Supported account types: **"Accounts in any organizational directory and personal Microsoft accounts"**
   - Redirect URI: 
     - Platform: **Web**
     - URL: `http://localhost:3001/api/calendar/outlook/callback`
   - Click **"Register"**

2. **Note down the Application (client) ID** from the Overview page

### Step 3: Create Client Secret

1. In your app, go to **"Certificates & secrets"** in the left menu
2. Click **"New client secret"**
3. Enter description: `Transportation App Secret`
4. Select expiration: **24 months** (or your preference)
5. Click **"Add"**
6. **IMPORTANT**: Copy the **Value** immediately (you can't see it again!)

### Step 4: Add API Permissions

1. Go to **"API permissions"** in the left menu
2. Click **"Add a permission"**
3. Select **"Microsoft Graph"**
4. Select **"Delegated permissions"**
5. Search and add these permissions:
   - `Calendars.ReadWrite`
   - `offline_access`
6. Click **"Add permissions"**

7. **(Optional)** Click **"Grant admin consent"** if you're an admin

### Step 5: Add Redirect URIs for Production

1. Go to **"Authentication"** in the left menu
2. Under **"Platform configurations"** → **"Web"**
3. Add production URL:
   ```
   https://yourdomain.com/api/calendar/outlook/callback
   ```
4. Click **"Save"**

### Step 6: Add to .env

```bash
OUTLOOK_CLIENT_ID=your_application_client_id_here
OUTLOOK_CLIENT_SECRET=your_client_secret_value_here
OUTLOOK_REDIRECT_URI=http://localhost:3001/api/calendar/outlook/callback
```

---

## 📧 Gmail Email Setup

### Step 1: Enable 2-Factor Authentication

1. Go to your [Google Account](https://myaccount.google.com/)
2. Click **"Security"** in the left menu
3. Under **"Signing in to Google"**, click **"2-Step Verification"**
4. Follow the prompts to enable 2FA (if not already enabled)

### Step 2: Generate App Password

1. After enabling 2FA, go back to **Security**
2. Under **"Signing in to Google"**, click **"App passwords"**
   - If you don't see this option, make sure 2FA is enabled
3. Click **"Select app"** → Choose **"Mail"**
4. Click **"Select device"** → Choose **"Other (Custom name)"**
5. Enter: `Transportation Management System`
6. Click **"Generate"**

7. **Copy the 16-character password** (format: xxxx xxxx xxxx xxxx)
   - You won't be able to see this again!

### Step 3: Add to .env

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  # The app password (without spaces)
```

**Note**: Remove spaces from the app password in the .env file.

### Alternative: Use Other Email Providers

#### Microsoft 365/Outlook
```bash
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your.email@outlook.com
EMAIL_PASS=your_password
```

#### Yahoo Mail
```bash
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your.email@yahoo.com
EMAIL_PASS=your_app_password
```

#### Custom SMTP
```bash
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587  # or 465 for SSL
EMAIL_USER=your.email@domain.com
EMAIL_PASS=your_password
```

---

## 📱 Twilio SMS Setup

### Step 1: Create Twilio Account

1. Go to [Twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Verify your email and phone number

### Step 2: Get a Phone Number

#### For Trial Account:
1. After signing up, you'll see the Console Dashboard
2. Click **"Get a Trial Number"**
3. Twilio will assign you a free number
4. Click **"Choose this Number"**

**Trial Limitations**:
- Can only send to verified phone numbers
- Messages include "Sent from your Twilio trial account"
- $15.50 free credit

#### For Production (Paid):
1. Click **"Buy a Number"** in the dashboard
2. Select your country
3. Choose capabilities: **SMS** (and Voice if needed)
4. Search and buy a number (~$1/month)

### Step 3: Get Account Credentials

1. In the Twilio Console Dashboard, you'll see:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: Click "Show" to reveal it

2. Copy both values

### Step 4: Verify Phone Numbers (Trial Only)

If using trial account, verify numbers that will receive SMS:

1. Go to **"Phone Numbers"** → **"Verified Caller IDs"**
2. Click **"Add a new number"**
3. Enter the phone number (with country code)
4. Verify via SMS code
5. Repeat for all drivers who need SMS

### Step 5: Add to .env

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567  # Your Twilio number with country code
```

### Step 6: Upgrade for Production

When ready for production:
1. Go to **Console Dashboard**
2. Click **"Upgrade"** button
3. Add billing information
4. Your account will be upgraded (no trial limitations)

**Pricing** (US):
- Phone number: ~$1/month
- SMS sent: $0.0079 per message
- SMS received: $0.0079 per message

---

## 🔐 Environment Variables Configuration

### Complete .env File Template

Create/update `backend/.env` with all these variables:

```bash
# ============================================
# DATABASE
# ============================================
MONGODB_URI=mongodb://localhost:27017/transportation-mvp

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3001
NODE_ENV=development

# ============================================
# JWT & SECURITY
# ============================================
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long

# ============================================
# URLS
# ============================================
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173

# ============================================
# GOOGLE MAPS (Existing)
# ============================================
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# ============================================
# GOOGLE CALENDAR OAUTH
# ============================================
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/google/callback

# ============================================
# OUTLOOK CALENDAR OAUTH
# ============================================
OUTLOOK_CLIENT_ID=your_application_client_id
OUTLOOK_CLIENT_SECRET=your_client_secret
OUTLOOK_REDIRECT_URI=http://localhost:3001/api/calendar/outlook/callback

# ============================================
# EMAIL CONFIGURATION (Gmail)
# ============================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_gmail_app_password

# ============================================
# SMS CONFIGURATION (Twilio)
# ============================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+15551234567

# ============================================
# HOLIDAY API (Optional - Free fallback available)
# ============================================
# Get free API key from: https://calendarific.com/
CALENDARIFIC_API_KEY=your_calendarific_api_key_optional

# ============================================
# FIREBASE (Existing - if used)
# ============================================
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id

# ============================================
# ENCRYPTION (Existing - if used)
# ============================================
ENCRYPTION_MASTER_KEY=your_64_character_encryption_master_key

# ============================================
# REDIS (Optional - for caching)
# ============================================
REDIS_URL=redis://localhost:6379
```

### Environment Variable Descriptions

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | ✅ Yes (for calendar) | OAuth client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | ✅ Yes (for calendar) | OAuth client secret |
| `GOOGLE_REDIRECT_URI` | ✅ Yes (for calendar) | OAuth callback URL |
| `OUTLOOK_CLIENT_ID` | ✅ Yes (for calendar) | Azure AD application ID |
| `OUTLOOK_CLIENT_SECRET` | ✅ Yes (for calendar) | Azure AD client secret |
| `OUTLOOK_REDIRECT_URI` | ✅ Yes (for calendar) | OAuth callback URL |
| `EMAIL_HOST` | ✅ Yes (for email) | SMTP server hostname |
| `EMAIL_PORT` | ✅ Yes (for email) | SMTP port (587 or 465) |
| `EMAIL_USER` | ✅ Yes (for email) | Email address |
| `EMAIL_PASS` | ✅ Yes (for email) | Email password or app password |
| `TWILIO_ACCOUNT_SID` | ✅ Yes (for SMS) | Twilio account identifier |
| `TWILIO_AUTH_TOKEN` | ✅ Yes (for SMS) | Twilio authentication token |
| `TWILIO_PHONE_NUMBER` | ✅ Yes (for SMS) | Twilio phone number with country code |
| `CALENDARIFIC_API_KEY` | ❌ No (optional) | Holiday API key (free fallback available) |

---

## 🧪 Testing Integrations

### 1. Test Backend Server

```bash
cd backend
npm install
npm start
```

Server should start on http://localhost:3001

### 2. Test Google Calendar OAuth

**Method 1: Using Browser**
1. Navigate to: http://localhost:3001/api/calendar/google/auth
2. You should get a JSON response with `authUrl`
3. Copy the URL and paste in browser
4. Complete OAuth flow
5. You should be redirected back with success

**Method 2: Using curl**
```bash
# Get auth URL
curl http://localhost:3001/api/calendar/google/auth

# After OAuth, test sync
curl -X POST http://localhost:3001/api/calendar/google/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2025-12-01","endDate":"2025-12-31"}'
```

### 3. Test Outlook Calendar OAuth

```bash
# Get auth URL
curl http://localhost:3001/api/calendar/outlook/auth

# After OAuth, test sync
curl -X POST http://localhost:3001/api/calendar/outlook/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2025-12-01","endDate":"2025-12-31"}'
```

### 4. Test Email Notifications

Create a test endpoint or use the notification service:

```bash
# From Node.js/backend
node -e "
const notificationService = require('./services/notificationService.js').default;
notificationService.testEmail('test@example.com').then(console.log);
"
```

Or add a test route in your backend:
```javascript
// In backend/server.js or a test route
app.post('/api/test/email', async (req, res) => {
  const result = await notificationService.testEmail(req.body.email);
  res.json(result);
});
```

Then test:
```bash
curl -X POST http://localhost:3001/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 5. Test SMS Notifications

```bash
# Test SMS
curl -X POST http://localhost:3001/api/test/sms \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567"}'
```

### 6. Test Holiday Import

```bash
# Import US Federal holidays
curl -X POST http://localhost:3001/api/holidays/import-federal \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year":2025}'

# Check if imported
curl http://localhost:3001/api/holidays/federal/2025 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔍 Troubleshooting

### Google Calendar Issues

**Error: "redirect_uri_mismatch"**
- Solution: Make sure redirect URI in Google Cloud Console exactly matches the one in your .env file
- Include `http://` or `https://`
- No trailing slash

**Error: "invalid_grant"**
- Solution: Tokens expired or invalid
- Re-authenticate using the OAuth flow
- Check if refresh token is still valid

**Error: "insufficient permissions"**
- Solution: Make sure you added the correct scopes in OAuth consent screen
- Re-authenticate after adding scopes

### Outlook Calendar Issues

**Error: "AADSTS50011: redirect_uri mismatch"**
- Solution: Add redirect URI in Azure Portal → Authentication → Web → Redirect URIs

**Error: "invalid_client"**
- Solution: Check client ID and secret are correct
- Make sure secret hasn't expired

**Error: "AADSTS65001: consent required"**
- Solution: User needs to consent to permissions
- Admin may need to grant admin consent

### Email Issues

**Error: "Invalid login: 535-5.7.8 Username and Password not accepted"**
- Solution: 
  - Make sure 2FA is enabled for Gmail
  - Use App Password, not regular password
  - Remove spaces from app password

**Error: "Connection timeout"**
- Solution:
  - Check EMAIL_HOST and EMAIL_PORT are correct
  - Try port 465 with secure: true
  - Check firewall settings

### SMS Issues

**Error: "Unable to create record: The number +1XXX is unverified"**
- Solution: For trial accounts, verify the phone number in Twilio console first
- Or upgrade to paid account

**Error: "Authenticate: Account not authorized"**
- Solution: Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are correct
- Make sure you copied the Auth Token, not the Account SID

---

## 📝 Security Best Practices

### 1. Never Commit .env File
```bash
# Add to .gitignore (should already be there)
.env
.env.local
.env.production
```

### 2. Use Different Credentials for Production
- Create separate Google Cloud project for production
- Create separate Azure app registration for production
- Use different email account or separate app password
- Use separate Twilio account or sub-account

### 3. Rotate Secrets Regularly
- Rotate client secrets every 6-12 months
- Generate new app passwords periodically
- Update Auth tokens if compromised

### 4. Use Environment-Specific Files
```bash
# Development
.env.development

# Production
.env.production

# Load in code:
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })
```

### 5. Encrypt Sensitive Data
- Use encryption for storing tokens in database
- Current implementation uses `select: false` for tokens
- Consider encrypting at rest with a master key

---

## ✅ Verification Checklist

Use this checklist to verify everything is configured correctly:

- [ ] Google Cloud project created
- [ ] Google Calendar API enabled
- [ ] Google OAuth consent screen configured
- [ ] Google OAuth credentials created and added to .env
- [ ] Azure AD app registration created
- [ ] Outlook Calendar API permissions added
- [ ] Outlook client secret created and added to .env
- [ ] Gmail 2FA enabled
- [ ] Gmail app password generated and added to .env
- [ ] Twilio account created
- [ ] Twilio phone number obtained
- [ ] Twilio credentials added to .env
- [ ] .env file created with all variables
- [ ] Backend server starts without errors
- [ ] Google Calendar OAuth flow works
- [ ] Outlook Calendar OAuth flow works
- [ ] Test email sent successfully
- [ ] Test SMS sent successfully
- [ ] Holiday import works

---

## 🚀 Next Steps

After completing this setup:

1. **Test in Development**: Verify all integrations work locally
2. **Set Up Production**: Create production credentials and deploy
3. **Configure Cron Jobs**: Set up automated reminders and sync
4. **Update Frontend**: Add settings page for users to connect calendars
5. **Monitor Usage**: Track API usage and costs

---

## 📞 Support Resources

- **Google Calendar API**: https://developers.google.com/calendar
- **Microsoft Graph API**: https://docs.microsoft.com/en-us/graph/
- **Nodemailer**: https://nodemailer.com/
- **Twilio**: https://www.twilio.com/docs
- **Project Issues**: Create issue on GitHub repository

---

**Setup Complete! 🎉**

Your Transportation Management System now has full calendar sync, email notifications, and SMS capabilities!
