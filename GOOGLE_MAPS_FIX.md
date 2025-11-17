# Google Maps API Error - Quick Fix Guide

## 🚨 Current Issue
The Google Maps API is failing to load with the error: "Failed to load Google Maps script"

## 🔍 Root Cause
The API key `AIzaSyDDh52GbebsiHlJX4HBhAD0zLrBaC3lsZU` is either:
1. **Invalid or expired**
2. **Has domain restrictions** that don't include localhost
3. **Missing required APIs enabled** (Maps JavaScript API, Places API, etc.)
4. **Billing not enabled** on the Google Cloud project

## ✅ Solution Steps

### Option 1: Get a New API Key (Recommended)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create/Select a Project**
   - Click "Select a project" → "New Project"
   - Name it (e.g., "Transportation App")

3. **Enable Required APIs**
   - Go to: APIs & Services → Library
   - Enable these APIs:
     * Maps JavaScript API ✓
     * Places API ✓
     * Directions API ✓
     * Geocoding API ✓

4. **Create API Key**
   - Go to: APIs & Services → Credentials
   - Click: "Create Credentials" → "API Key"
   - **Copy the key immediately**

5. **Enable Billing** (Required!)
   - Go to: Billing
   - Link a billing account
   - ⚠️ You won't be charged - Google provides $200/month free credit

6. **Update .env File**
   ```bash
   # Open: frontend/.env
   VITE_GOOGLE_MAPS_API_KEY=YOUR_NEW_API_KEY_HERE
   ```

7. **Restart Dev Server**
   ```powershell
   cd frontend
   npm run dev
   ```

### Option 2: Fix Current API Key

If you have access to the Google Cloud project for the current key:

1. **Check Billing**
   - Ensure billing is enabled

2. **Check API Restrictions**
   - Go to: APIs & Services → Credentials
   - Click on your API key
   - Under "Application restrictions":
     * Select "HTTP referrers (web sites)"
     * Add: `http://localhost:*`
     * Add: `http://127.0.0.1:*`
   
3. **Check API Restrictions**
   - Under "API restrictions":
     * Select "Restrict key"
     * Check all of these:
       - Maps JavaScript API
       - Places API
       - Directions API
       - Geocoding API

4. **Save and Wait**
   - Click "Save"
   - Wait 5 minutes for changes to propagate
   - Restart your dev server

## 🧪 Test Your API Key

The app now includes automatic API key testing:
1. Check browser console for "🗺️ Testing Google Maps API Key..." message
2. Look for test results showing the issue
3. Use the interactive troubleshooting panel in the UI when maps fail to load

## 📝 Important Notes

- **Billing is REQUIRED** even though it's free (up to $200/month credit)
- API key changes can take **5-10 minutes** to take effect
- Always restart your dev server after changing `.env` file
- Keep your API key secret - don't commit it to public repositories

## 🆘 Still Having Issues?

1. Check the browser console for detailed error messages
2. Review `GOOGLE_MAPS_SETUP.md` for complete instructions
3. The app now shows a detailed troubleshooting panel when maps fail
4. Test your key at: https://developers.google.com/maps/documentation/javascript/get-api-key

## 📊 What Changed

I've enhanced the error handling:
- ✅ Added automatic API key validation on app startup
- ✅ Created interactive troubleshooting component
- ✅ Improved error messages with specific solutions
- ✅ Added API key testing utility
- ✅ Better visual feedback when maps fail to load

Look for the new error panel in the UI for step-by-step guidance!
