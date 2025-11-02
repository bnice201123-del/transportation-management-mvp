# Environment Variables Setup Guide

This guide will help you configure all the required environment variables for the Transportation Management System.

## ✅ MongoDB Atlas (Already Configured)
Your MongoDB Atlas connection is already working:
- Connection string: `mongodb+srv://bk2162003_db_user:...@cluster0.z4rq2es.mongodb.net/transportation-mvp`
- Status: ✅ Connected and working

## 🗺️ Google Maps API Setup

### Step 1: Get Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Directions API
   - Places API
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

### Step 2: Secure Your API Key (Recommended)
1. Click on your API key in the credentials page
2. Under "Application restrictions", select "HTTP referrers"
3. Add these referrers:
   - `http://localhost:5173/*` (for development)
   - `http://localhost:5174/*` (backup port)
   - Your production domain when ready
4. Under "API restrictions", select "Restrict key" and choose the APIs listed above

### Step 3: Update .env File
Replace `your_google_maps_api_key_here` with your actual API key.

## 🔥 Firebase Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "transportation-mvp")
4. Enable Google Analytics (optional)
5. Create project

### Step 2: Enable Authentication
1. In your Firebase project, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider

### Step 3: Enable Cloud Messaging
1. Go to "Project settings" (gear icon)
2. Click "Cloud Messaging" tab
3. Note your "Server key" (for push notifications)

### Step 4: Generate Service Account Key
1. Go to "Project settings" → "Service accounts"
2. Click "Generate new private key"
3. Download the JSON file
4. Extract these values from the JSON:
   - `project_id`
   - `private_key_id`
   - `private_key` (entire value including \\n)
   - `client_email`
   - `client_id`

### Step 5: Update .env File
Replace all Firebase placeholder values with your actual credentials.

## 🔐 JWT Secret

### Generate Strong JWT Secret
Run this command in PowerShell to generate a secure random secret:

```powershell
[System.Web.Security.Membership]::GeneratePassword(64, 8)
```

Or use this Node.js command:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'));"
```

## 📝 Final .env Template

```env
# Database (Already configured)
MONGODB_URI=mongodb+srv://bk2162003_db_user:nB1zhuxGEjmWuGNg@cluster0.z4rq2es.mongodb.net/transportation-mvp?retryWrites=true&w=majority

# JWT Secret - Replace with generated secret
JWT_SECRET=your_generated_64_character_secret_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Google Maps API - Replace with your API key
GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Firebase Configuration - Replace with your Firebase credentials
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\\n-----END PRIVATE KEY-----\\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=1234567890123456789
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# CORS Configuration
FRONTEND_URL=http://localhost:5174
```

## 🚨 Security Notes

1. **Never commit .env files** - Already in .gitignore
2. **Use environment-specific keys** - Different keys for dev/prod
3. **Restrict API keys** - Limit Google Maps API to your domains
4. **Rotate secrets regularly** - Change JWT secret periodically
5. **Use Firebase security rules** - Secure your Firestore database

## 🧪 Testing Your Configuration

After updating your .env file:

1. Restart your backend server
2. Check server logs for any connection errors
3. Test registration/login (uses JWT)
4. Test map features (uses Google Maps)
5. Test notifications (uses Firebase)

## 📱 Frontend Environment Variables

The frontend may also need Google Maps API key. Check if `frontend/.env` exists and add:

```env
VITE_GOOGLE_MAPS_API_KEY=your_same_google_maps_api_key
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_PROJECT_ID=your-project-id
```

## 🔧 Troubleshooting

### Common Issues:
1. **Google Maps not loading**: Check API key and enabled APIs
2. **Firebase errors**: Verify service account JSON format
3. **CORS errors**: Update FRONTEND_URL to match your dev server port
4. **MongoDB connection**: Already working, but verify Atlas IP whitelist

### Getting Help:
- Google Maps API: Check quotas and billing in Google Cloud Console
- Firebase: Check project settings and authentication rules
- MongoDB: Verify connection string and network access

---

**Next Steps**: After configuring these variables, restart your servers and test each feature to ensure everything works correctly.