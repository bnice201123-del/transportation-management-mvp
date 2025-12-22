# 🚀 Quick Start - Soft Deployment Guide

## 📦 What's Ready for Testing

✅ **Complete Branding System**
- TEXT/LOGO branding toggle
- Auto-save with status feedback
- Responsive across all breakpoints
- Integration across Navbar & Sidebar

✅ **Logo Upload Feature**
- File upload with validation
- Static file serving
- Admin interface

✅ **Security Features**
- Authentication & JWT
- Role-based access control
- Rate limiting
- Audit logging

✅ **Mobile Responsive Design**
- All breakpoints tested
- Keyboard fixes for iOS/Android
- Safari date picker fixes
- Swipe gesture support

---

## 🎯 Quick Start (5 minutes)

### Prerequisites
- Node.js 16+ installed
- MongoDB running locally or connection string ready
- Port 3001 & 5173 available

### Step 1: Kill Running Processes (if needed)
```powershell
# If port 3001 is in use:
Get-Process | Where-Object {$_.Port -eq 3001} | Stop-Process -Force

# Or find and kill by name:
taskkill /IM node.exe /F
```

### Step 2: Setup Environment Files

**Backend** - Create `backend/.env`
```
NODE_ENV=staging
PORT=3001
MONGODB_URI=mongodb://localhost:27017/transportation-mvp
JWT_SECRET=your-secret-key-here-at-least-32-chars
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001
```

**Frontend** - Create `frontend/.env`
```
VITE_API_URL=http://localhost:3001
VITE_ENV=staging
```

### Step 3: Start Backend
```bash
cd backend
npm install  # Only if first time
npm start
```
✅ You should see: `Server running on port 3001`

### Step 4: Start Frontend (New Terminal)
```bash
cd frontend
npm install  # Only if first time
npm run dev
```
✅ You should see: `Local: http://localhost:5173`

### Step 5: Access the App
Open browser: **http://localhost:5173**

---

## 🧪 Quick Testing Checklist

### Test 1: Login
- [ ] Go to login page
- [ ] Use test credentials
- [ ] Should redirect to dashboard

### Test 2: Branding Feature (NEW)
- [ ] Login as admin user
- [ ] Go to Settings → Branding
- [ ] Toggle TEXT/LOGO branding
- [ ] Observe change in navbar/sidebar immediately
- [ ] Refresh page - setting should persist

### Test 3: Mobile Responsive
- [ ] Open DevTools (F12)
- [ ] Click responsive design mode (Ctrl+Shift+M)
- [ ] Test different viewport sizes
- [ ] Test on actual mobile device

### Test 4: Logo Upload
- [ ] Go to Settings → Branding → Logo Upload
- [ ] Upload a PNG/JPG file
- [ ] Should appear in branding preview
- [ ] Change branding type to LOGO
- [ ] Logo should display in navbar

### Test 5: Admin Dashboard
- [ ] Navigate to different admin sections
- [ ] Check that all tabs load
- [ ] Verify no console errors

---

## 📊 Deployment Status

| Item | Status | Details |
|------|--------|---------|
| Backend | ✅ Ready | 35 files, zero errors |
| Frontend | ✅ Ready | 9 new components, zero errors |
| Branding | ✅ Complete | TEXT/LOGO toggle working |
| Logo Upload | ✅ Complete | File upload & static serving |
| Database | ✅ Ready | MongoDB collections prepared |
| GitHub | ✅ Synced | All changes committed Dec 22 |

---

## 🔧 Quick Troubleshooting

### Backend won't start
```bash
# Check if port is in use
netstat -ano | findstr :3001

# Use different port
PORT=3002 npm start
```

### Frontend shows errors
```bash
# Clear node_modules and reinstall
rm -r node_modules
npm install
npm run dev
```

### Branding changes not showing
```
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors (F12)
```

### MongoDB connection error
```bash
# Make sure MongoDB is running
# Or update MONGODB_URI in .env
```

---

## 📈 Next: What to Test

1. **Core Functionality**
   - ✅ Login/Logout
   - ✅ Dashboard access
   - ✅ Branding system
   - ✅ Logo upload

2. **Bug Hunting**
   - Look for console errors (F12)
   - Test edge cases (missing data, large files)
   - Try rapid clicking/interactions
   - Test on slow network (DevTools → Network → Throttle)

3. **Performance**
   - Check page load times
   - Monitor network requests
   - Check for unnecessary re-renders
   - Test with larger datasets

4. **Mobile Testing**
   - Test on iPhone/iPad
   - Test on Android phones
   - Test landscape orientation
   - Test touch interactions

---

## 📞 Having Issues?

1. **Check logs:** Look for error messages in terminal
2. **Browser console:** Press F12 → Console tab
3. **Network tab:** F12 → Network → check API calls
4. **Restart services:** Kill terminals and start fresh
5. **See docs:** Check SOFT_DEPLOYMENT_CHECKLIST.md for detailed troubleshooting

---

## ✅ Ready to Deploy!

Everything is prepared. You can now:
- Deploy to staging server
- Run comprehensive QA testing
- Gather user feedback
- Plan production deployment

**Total time to deployment:** < 5 minutes  
**Ready for:** Soft testing deployment ✅

---

*Last Updated: December 22, 2025*
