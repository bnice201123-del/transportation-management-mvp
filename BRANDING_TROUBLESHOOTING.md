# Branding System - Troubleshooting Guide

**Last Updated:** December 22, 2025  
**Version:** 1.0

---

## Overview

The branding system allows agencies to choose between:
- **TEXT Branding**: Display company name as text
- **LOGO Branding**: Display company logo as image

Only one can be active at a time.

---

## How to Change Branding Type

### Step 1: Navigate to Admin Settings
1. Click on your profile icon (top-right)
2. Select "Settings"
3. Click on the "Branding" tab

### Step 2: Choose Branding Type
In the **Branding Choice** section:
- Select **Text Branding** to display your company name
- Select **Logo Branding** to display your uploaded logo

### Step 3: Upload/Set Assets
Below the branding choice, you'll see options to:
- **Upload Logo Image**: PNG, JPG, or SVG format (max 5MB)
- **Set Company Name**: Enter your agency name (max 100 characters)

### Step 4: Confirm Changes
- Click the appropriate **Save** button
- You should see a success message
- Changes appear immediately across all pages

---

## Troubleshooting

### Issue: Change Doesn't Take Effect

**Solution:**
1. Refresh the page (F5 or Cmd+R)
2. Check browser console for errors (F12)
3. Verify you're logged in as an admin user
4. Try again

### Issue: "Failed to Update Branding" Error

**Possible Causes & Solutions:**

#### Network Error
- Check internet connection
- Ensure backend server is running
- Try again in a few seconds

#### Invalid Branding Type
- Only "TEXT" and "LOGO" are valid
- If this appears, contact support

#### Missing Required Asset
- **For Logo Branding**: Must have a logo uploaded before switching
  - Solution: Upload logo first, then switch to Logo branding
  
- **For Text Branding**: Must have company name set
  - Solution: Enter company name first, then switch to Text branding

#### Permission Denied
- Error: "Forbidden (403)"
- Only admin users can change branding
- Solution: Log out and log in with admin account

#### Server Error
- Error: "Internal Server Error (500)"
- Backend may have crashed
- Solution: Contact technical support

### Issue: Logo Not Showing Despite Being Uploaded

**Solution:**
1. Verify logo was uploaded successfully
   - Check upload progress reached 100%
   - See success notification

2. Switch to Logo branding type
   - Go to Branding Choice section
   - Select "Logo Branding"
   - Save changes

3. Refresh page
   - Clear browser cache (Ctrl+Shift+Delete)
   - Refresh page (F5)

4. Check image size
   - Images over 5MB may be rejected
   - Try smaller image file

### Issue: Text Not Updating

**Solution:**
1. Verify company name is set
   - In LogoUpload section
   - Enter name and click "Save Company Name"
   - See success message

2. Switch to Text branding type
   - Go to Branding Choice section
   - Select "Text Branding"
   - Save changes

3. Refresh page
   - Clear browser cache
   - Refresh page

### Issue: Default Icon/Placeholder Showing

**Meaning:** Neither branding type is fully configured

**Solution:**
Choose one option:

**Option A: Set up Text Branding**
1. Enter company name in LogoUpload section
2. Click "Save Company Name"
3. Go to Branding Choice and select "Text Branding"
4. Refresh page

**Option B: Set up Logo Branding**
1. Upload logo file in LogoUpload section
2. Wait for upload to complete
3. Go to Branding Choice and select "Logo Branding"
4. Refresh page

---

## Fallback Behavior

| Scenario | Result |
|----------|--------|
| Logo selected, logo uploaded | Shows logo image |
| Logo selected, logo not uploaded | Falls back to text branding |
| Text selected, company name set | Shows company name text |
| Text selected, company name not set | Shows default icon |
| Neither configured | Shows default icon |

---

## Branding Locations

Your chosen branding appears in:
- ✅ **Navbar** (top bar of all pages)
- ✅ **Sidebar** (left menu on desktop, mobile drawer)
- 🔲 **Login Screen** (planned integration)
- 🔲 **Exports/PDFs** (planned integration)

---

## Technical Details

### Frontend Components
- **BrandingSettings.jsx**: Choice interface
- **BrandingLogo.jsx**: Display component
- **LogoUpload.jsx**: Upload interface

### Backend Endpoint
- **POST /api/auth/update-branding-type**
  - Takes: `{ brandingType: 'TEXT' | 'LOGO' }`
  - Returns: Updated user object with new branding type

### Database Fields
User model includes:
- `brandingType`: 'TEXT' | 'LOGO'
- `logoUrl`: URL to uploaded logo
- `companyName`: Text for text branding

---

## Browser Compatibility

Tested on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

---

## Performance

- Logo images cached by browser
- Responsive sizing (different sizes for mobile/tablet/desktop)
- No impact on page load speed

---

## FAQs

**Q: Can I use both logo and text together?**  
A: No, only one is active at a time. However, text can appear below logo if you enable it.

**Q: What image formats are supported?**  
A: PNG, JPG, and SVG formats.

**Q: Is there a file size limit?**  
A: Yes, 5MB maximum per image.

**Q: Can I revert to default if I'm unhappy?**  
A: Yes, delete your branding or choose default app icon in settings.

**Q: Will changes affect other users immediately?**  
A: Yes, all users see updated branding on next page refresh.

**Q: Can I change branding for specific roles?**  
A: Currently no, branding is global for the agency.

---

## Support

If issues persist:
1. Check browser console for error messages (F12)
2. Verify backend is running
3. Try different browser
4. Clear browser cache
5. Contact technical support with error message

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 22, 2025 | Initial release with TEXT/LOGO choice |

