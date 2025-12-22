# 🧪 Soft Deployment Testing Plan

> **Date:** December 22, 2025  
> **Phase:** Soft Deployment Testing  
> **Duration:** 3-5 days  
> **Scope:** Complete feature validation before production  

---

## 🎯 Testing Objectives

1. ✅ Validate all recent features work as expected
2. ✅ Identify and document any bugs
3. ✅ Verify mobile responsiveness
4. ✅ Performance baseline establishment
5. ✅ Security & data integrity verification
6. ✅ User experience feedback collection

---

## 👥 Testing Roles & Responsibilities

| Role | Responsibilities | Count |
|------|------------------|-------|
| **QA Testers** | Execute test cases, report bugs | 2-3 |
| **Admin Testers** | Test admin panel, settings, branding | 1-2 |
| **Mobile Testers** | Test iOS/Android, responsive design | 1-2 |
| **Performance Tester** | Monitor loads, latency, memory | 1 |
| **Security Tester** | Verify auth, rate limiting, permissions | 1 |

---

## 📋 Test Categories

### Category 1: Authentication & Security (Critical)

**Test Case 1.1: User Registration**
```
Steps:
1. Navigate to /register
2. Enter valid email, password, name
3. Submit form
4. Should receive confirmation
5. Should be able to login with credentials

Expected: ✅ User created, can login
```

**Test Case 1.2: User Login**
```
Steps:
1. Navigate to /login
2. Enter valid credentials
3. Click login button
4. Should redirect to dashboard
5. JWT token should be stored

Expected: ✅ Logged in, token stored, dashboard accessible
```

**Test Case 1.3: Login with Wrong Password**
```
Steps:
1. Navigate to /login
2. Enter wrong password (try 5 times)
3. Check rate limiting after 5 attempts

Expected: ✅ Rate limit triggered, user informed
```

**Test Case 1.4: JWT Token Refresh**
```
Steps:
1. Login to app
2. Wait 5 minutes
3. Make API request
4. Token should auto-refresh

Expected: ✅ Token refreshed, session continues
```

**Test Case 1.5: Logout**
```
Steps:
1. Login to app
2. Navigate to profile/settings
3. Click logout
4. Token should be cleared
5. Should redirect to login

Expected: ✅ Logged out, token cleared, no dashboard access
```

---

### Category 2: Branding System (HIGH PRIORITY)

**Test Case 2.1: Change TEXT to LOGO Branding**
```
Setup: Admin user logged in, company logo uploaded

Steps:
1. Go to Settings → Branding
2. Select "Logo Branding" option
3. Click save or wait for auto-save
4. Observe navbar/sidebar
5. Text company name should disappear
6. Logo should display instead

Expected: ✅ TEXT hidden, LOGO visible, change persists
```

**Test Case 2.2: Change LOGO back to TEXT Branding**
```
Setup: Branding is currently set to LOGO

Steps:
1. Go to Settings → Branding
2. Select "Text Branding" option
3. Auto-save should trigger
4. Observe navbar/sidebar
5. Logo should disappear
6. Company name should display

Expected: ✅ LOGO hidden, TEXT visible, change persists
```

**Test Case 2.3: Branding Persistence Across Pages**
```
Setup: Branding set to LOGO

Steps:
1. Set branding to LOGO
2. Navigate to different pages (dashboard, users, trips)
3. Go to login and back
4. Refresh page multiple times
5. Check navbar/sidebar branding on each

Expected: ✅ Branding consistent across all pages
```

**Test Case 2.4: Branding on Mobile View**
```
Setup: Responsive design mode enabled

Steps:
1. Set branding to LOGO
2. Test on mobile view (375px width)
3. Check navbar branding appears
4. Check sidebar/mobile menu branding
5. Test all responsive breakpoints

Expected: ✅ Branding displays correctly on all sizes
```

**Test Case 2.5: Fallback When Logo Missing**
```
Setup: Logo not uploaded, branding set to LOGO

Steps:
1. Don't upload a logo
2. Try to set branding to LOGO
3. Should show warning or disable option
4. Or fallback to default icon

Expected: ✅ Graceful handling, no errors
```

---

### Category 3: Logo Upload (HIGH PRIORITY)

**Test Case 3.1: Upload Valid Logo**
```
Steps:
1. Go to Settings → Branding → Logo Upload
2. Select PNG/JPG file (< 5MB)
3. Click upload
4. Should show success message
5. Logo should appear in preview

Expected: ✅ File uploaded, preview shows logo
```

**Test Case 3.2: Upload Invalid File Type**
```
Steps:
1. Try uploading .PDF or .TXT file
2. Should reject with error message
3. No file should be created

Expected: ✅ File rejected, error shown
```

**Test Case 3.3: Upload File > 5MB**
```
Steps:
1. Try uploading logo > 5MB
2. Should show size error
3. File should not be stored

Expected: ✅ Size validation works
```

**Test Case 3.4: Logo Display in Navbar**
```
Setup: Logo uploaded, branding set to LOGO

Steps:
1. Logo should display in navbar
2. Logo should be responsive (different sizes per breakpoint)
3. Logo should have no border/background on desktop
4. Logo should be clickable (optional - link to home)

Expected: ✅ Logo displays correctly, responsive
```

**Test Case 3.5: Logo Persistence**
```
Setup: Logo uploaded

Steps:
1. Upload logo
2. Refresh page
3. Logo should still be visible
4. Go back to admin settings
5. Logo preview should still show

Expected: ✅ Logo file persists, database updated
```

---

### Category 4: Admin Dashboard (Critical)

**Test Case 4.1: Admin Access**
```
Steps:
1. Login as admin user
2. Go to admin panel
3. Should see all admin options
4. Should access all tabs

Expected: ✅ Full admin access granted
```

**Test Case 4.2: Settings Tabs**
```
Steps:
1. Go to Settings
2. Click each tab: General, Branding, Users, etc.
3. Each tab should load without errors
4. Data should display correctly

Expected: ✅ All tabs load and display content
```

**Test Case 4.3: User Management**
```
Steps:
1. Go to Settings → Users
2. View list of users
3. Try to edit a user
4. Try to deactivate a user
5. Try to delete a user

Expected: ✅ CRUD operations work
```

**Test Case 4.4: Dashboard Analytics**
```
Steps:
1. Go to Dashboard
2. Check metric cards (trips, users, vehicles)
3. Check charts and graphs
4. Verify data appears correct

Expected: ✅ Analytics display without errors
```

---

### Category 5: Mobile Responsiveness (High Priority)

**Test Case 5.1: Mobile View (375px)**
```
Steps:
1. Open DevTools (F12)
2. Enable responsive design
3. Set to iPhone size (375x667)
4. Navigate through app
5. Check all text readable
6. Check buttons clickable
7. Check forms functional

Expected: ✅ All elements readable, no overflow
```

**Test Case 5.2: Tablet View (768px)**
```
Steps:
1. Set viewport to 768x1024
2. Navigate through app
3. Check layout adapts
4. Check navigation works
5. Check forms functional

Expected: ✅ Layout adapts well, no issues
```

**Test Case 5.3: Desktop View (1920px)**
```
Steps:
1. Full screen desktop
2. Navigate app
3. Check branding displays without border (new)
4. Check all features visible

Expected: ✅ Full desktop experience works
```

**Test Case 5.4: Landscape Orientation**
```
Steps:
1. Mobile device landscape mode
2. App should rotate and adapt
3. All content should be readable
4. Navigation should work

Expected: ✅ Orientation change handled
```

**Test Case 5.5: Sidebar Mobile Behavior**
```
Steps:
1. Mobile view
2. Click hamburger menu
3. Sidebar should slide out
4. Swipe left (if implemented)
5. Sidebar should close

Expected: ✅ Sidebar works on mobile
```

---

### Category 6: API Endpoints (Critical)

**Test Case 6.1: Auth Endpoints**
```
Endpoints to test:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh-token
- POST /api/auth/update-branding-type (NEW)

Each should:
- Accept valid input ✅
- Reject invalid input ✅
- Return proper status codes ✅
```

**Test Case 6.2: Branding Endpoints**
```
Endpoints to test:
- POST /api/auth/update-branding-type
  - Valid values: 'TEXT', 'LOGO'
  - Should validate brandingType
  - Should update database
  - Should return updated user

Expected: ✅ All validations work
```

**Test Case 6.3: Logo Endpoints**
```
Endpoints to test:
- POST /api/upload/logo
  - Should validate file
  - Should store file
  - Should return file path
- GET /api/uploads/logos/:filename
  - Should serve static file
  - Should return 404 if not found

Expected: ✅ File operations work
```

**Test Case 6.4: User Endpoints**
```
Endpoints to test:
- GET /api/users
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id

Should require admin auth
```

**Test Case 6.5: Vehicle Endpoints**
```
Endpoints to test:
- GET /api/vehicles
- POST /api/vehicles
- PUT /api/vehicles/:id
- DELETE /api/vehicles/:id

Should require proper auth
```

---

### Category 7: Error Handling (High Priority)

**Test Case 7.1: 404 Not Found**
```
Steps:
1. Navigate to /nonexistent-page
2. Should show 404 error page
3. Should allow navigation back

Expected: ✅ 404 page shows, no crash
```

**Test Case 7.2: 401 Unauthorized**
```
Steps:
1. Try to access protected route without login
2. Should redirect to login
3. Should show message

Expected: ✅ Proper redirect, no error
```

**Test Case 7.3: 403 Forbidden**
```
Steps:
1. Non-admin tries to access /admin/settings
2. Should show forbidden error
3. Should not grant access

Expected: ✅ Proper access denial
```

**Test Case 7.4: Network Error Handling**
```
Steps:
1. Simulate offline (DevTools → Network → Offline)
2. Try to load page/API
3. Should show friendly error
4. Should allow retry

Expected: ✅ Graceful error handling
```

**Test Case 7.5: Invalid Form Input**
```
Steps:
1. Login form - try empty email
2. Register form - try mismatched passwords
3. Should show validation errors
4. Should prevent submission

Expected: ✅ Validation works
```

---

### Category 8: Performance Testing (Medium Priority)

**Test Case 8.1: Page Load Time**
```
Measure:
- Login page load: < 2 seconds ✅
- Dashboard load: < 3 seconds ✅
- Settings page: < 2 seconds ✅

Use: DevTools → Performance tab
```

**Test Case 8.2: API Response Time**
```
Measure:
- Login request: < 1 second
- Branding update: < 500ms
- Logo upload: < 5 seconds (for 5MB file)

Use: DevTools → Network tab
```

**Test Case 8.3: Bundle Size**
```
Check:
- Frontend bundle size: < 500KB (gzipped)
- No unused dependencies
- Code splitting working

Use: npm build → analyze output
```

**Test Case 8.4: Memory Usage**
```
Measure:
- Initial load: < 50MB
- After 10 min: < 100MB
- No memory leaks after operations

Use: DevTools → Memory tab
```

---

### Category 9: Browser Compatibility

Test on these browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

Each should:
- [ ] Load without errors
- [ ] Display correctly
- [ ] Responsive design works
- [ ] Forms functional

---

### Category 10: Data Integrity

**Test Case 10.1: Branding Data Persists**
```
Steps:
1. Change branding type
2. Close browser completely
3. Reopen app
4. Login again
5. Branding type should be same as before

Expected: ✅ Data persisted in database
```

**Test Case 10.2: User Data Not Leaked**
```
Steps:
1. Login with user A
2. Check profile - should see own data only
3. Logout
4. Login with user B
5. User B should NOT see user A's data

Expected: ✅ Data properly isolated
```

**Test Case 10.3: File Storage**
```
Steps:
1. Upload logo for agency A
2. Login with agency B
3. Agency B should see own logo, not A's

Expected: ✅ Files properly isolated
```

---

## 📊 Test Execution Tracking

### Daily Testing Schedule

**Day 1: Authentication & Branding**
- [ ] Test cases 1.1 - 1.5 (Authentication)
- [ ] Test cases 2.1 - 2.5 (Branding)
- [ ] Document any issues found

**Day 2: Logo Upload & Admin**
- [ ] Test cases 3.1 - 3.5 (Logo Upload)
- [ ] Test cases 4.1 - 4.4 (Admin Dashboard)
- [ ] Document any issues found

**Day 3: Mobile & Responsive**
- [ ] Test cases 5.1 - 5.5 (Mobile Responsiveness)
- [ ] Test on actual devices
- [ ] Document any issues found

**Day 4: API & Errors**
- [ ] Test cases 6.1 - 6.5 (API Endpoints)
- [ ] Test cases 7.1 - 7.5 (Error Handling)
- [ ] Document any issues found

**Day 5: Performance & Cleanup**
- [ ] Test cases 8.1 - 8.4 (Performance)
- [ ] Browser compatibility testing
- [ ] Final bug review
- [ ] Sign-off for production deployment

---

## 🐛 Bug Reporting Template

```markdown
## Bug Report

**Title:** [Brief description]

**Severity:** Critical | High | Medium | Low

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Browser/Device:**
[Chrome 120, iPhone 15, etc.]

**Screenshots/Logs:**
[Attach if applicable]

**Date Found:** [Date]
```

---

## ✅ Sign-Off Checklist

Before moving to production:

- [ ] All critical bugs fixed
- [ ] All high priority bugs fixed or documented
- [ ] Mobile responsiveness verified
- [ ] Performance baseline established
- [ ] Security audit completed
- [ ] Data integrity verified
- [ ] Documentation complete
- [ ] Team sign-off obtained
- [ ] Backup strategy confirmed
- [ ] Monitoring alerts configured

---

## 📈 Success Criteria

✅ **Deployment is SUCCESSFUL if:**

1. **Zero Critical Bugs:** No breaking bugs remain
2. **All Core Features:** Login, branding, logo upload all work
3. **Mobile Functional:** App works on mobile devices
4. **Performance Good:** Page loads < 3 seconds
5. **Data Safe:** No data leaks or corruption
6. **Users Can Test:** Test users can perform all actions
7. **Errors Handled:** App doesn't crash on errors
8. **Documentation Clear:** Testing docs and guides provided

---

## 📞 Support & Escalation

If you find critical issues:
1. Document in bug report
2. Take screenshots
3. Note exact reproduction steps
4. Report immediately
5. Don't proceed until fixed

---

**Testing Started:** December 22, 2025  
**Expected Completion:** December 26-27, 2025  
**Ready for Production:** December 27, 2025 (estimated)

---

*This document will be updated as testing progresses.*
