# Phase 2: Integration & Setup Guide

## Quick Integration Steps

### Step 1: Update App.jsx

Wrap the entire app with DualLoginProvider:

```javascript
import { DualLoginProvider } from './contexts/DualLoginContext';

function App() {
  return (
    <DualLoginProvider>
      <BrowserRouter>
        <ChakraProvider>
          {/* Your app routes here */}
        </ChakraProvider>
      </BrowserRouter>
    </DualLoginProvider>
  );
}
```

### Step 2: Add Routes

Add these routes to your Router configuration:

```javascript
import DriverLoginForm from './components/driver/DriverLoginForm';
import DualLoginDriverDashboard from './components/driver/DualLoginDriverDashboard';
import ProtectedDriverRoute from './components/driver/ProtectedDriverRoute';

// In your routes:
<Routes>
  {/* Public route */}
  <Route path="/driver/dual-login" element={<DriverLoginForm />} />
  
  {/* Protected route - driver section */}
  <Route 
    path="/driver/dashboard" 
    element={
      <ProtectedDriverRoute>
        <DualLoginDriverDashboard />
      </ProtectedDriverRoute>
    } 
  />
  
  {/* Other routes... */}
</Routes>
```

### Step 3: Add Navigation

Update your navigation to include driver section link:

```javascript
// In your Navbar or Sidebar
<Link to="/driver/dual-login">Driver Section</Link>
```

### Step 4: Update API Configuration

Ensure `.env.local` has correct API URL:

```
REACT_APP_API_URL=http://localhost:3001
```

### Step 5: Test the Integration

1. Start backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to: `http://localhost:5173/driver/dual-login`

4. Test login with:
   - Driver ID: `DRV-A1B2-1234` (or any valid format)
   - PIN: Optional
   - Vehicle Phone: Any E.164 format phone
   - Device Password: Any password

---

## File Structure Summary

```
frontend/
├── src/
│   ├── components/
│   │   └── driver/
│   │       ├── DriverLoginForm.jsx ✨ NEW
│   │       ├── DualLoginDriverDashboard.jsx ✨ NEW
│   │       ├── ProtectedDriverRoute.jsx ✨ NEW
│   │       └── (other driver components...)
│   │
│   ├── contexts/
│   │   ├── DualLoginContext.jsx ✨ NEW
│   │   └── (other contexts...)
│   │
│   ├── App.jsx (NEEDS UPDATE)
│   └── index.jsx
│
├── package.json
└── vite.config.js

backend/
├── models/
│   ├── VehicleTracker.js ✨ NEW
│   └── User.js (MODIFIED)
├── services/
│   └── dualLoginService.js ✨ NEW
├── routes/
│   └── dualLogin.js ✨ NEW
└── server.js (MODIFIED)
```

---

## Feature Checklist

### Phase 1 Backend (COMPLETED ✅)
- [x] VehicleTracker model
- [x] DualLoginService
- [x] 11 API endpoints
- [x] User model enhancement
- [x] Rate limiting
- [x] Activity logging
- [x] Database indexes

### Phase 2 Frontend (IN PROGRESS 🔄)
- [x] DriverLoginForm component
- [x] DualLoginContext hook
- [x] DualLoginDriverDashboard
- [x] ProtectedDriverRoute wrapper
- [ ] App.jsx integration
- [ ] Router configuration
- [ ] Navigation links
- [ ] Testing

### Phase 3 Testing (PENDING)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance tests
- [ ] Security validation

---

## Common Issues & Solutions

### Issue: "DualLoginProvider not found"
**Solution:** Make sure you wrapped App with DualLoginProvider in index.jsx

```javascript
// ❌ Wrong
function App() {
  return <DualLoginContext.Provider>...</DualLoginContext.Provider>
}

// ✅ Correct
import { DualLoginProvider } from './contexts/DualLoginContext';

function App() {
  return (
    <DualLoginProvider>
      {/* Your app */}
    </DualLoginProvider>
  );
}
```

### Issue: "Cannot read property 'driverAuth' of undefined"
**Solution:** Make sure you're calling useDualLogin() inside DualLoginProvider

```javascript
// ❌ Won't work - outside provider
const { driverAuth } = useDualLogin();
<App />

// ✅ Works - inside provider
<DualLoginProvider>
  <App />  {/* Now useDualLogin() works */}
</DualLoginProvider>
```

### Issue: "API call returns 401 Unauthorized"
**Solution:** Check that token is being sent in headers

```javascript
// ✅ Correct
const instance = getDriverAxios();
const response = await instance.get('/api/drivers/:id/dashboard');
// Headers automatically include: Authorization: Bearer {token}
```

### Issue: "Login form not redirecting after successful login"
**Solution:** Check that navigate is called after state update

```javascript
// In DriverLoginForm.jsx
const navigate = useNavigate();
const { loginDriver } = useDualLogin();

const handleLogin = async () => {
  const result = await loginDriver(driverId, pin);
  if (result.success) {
    navigate('/driver/dashboard');  // ✅ Add this
  }
};
```

---

## Environment Variables

Create `.env.local` in frontend root:

```
VITE_API_URL=http://localhost:3001
REACT_APP_API_URL=http://localhost:3001
```

Note: Both variables work, components use `process.env.REACT_APP_API_URL`

---

## Backend Requirements

Ensure backend is running with:
- ✅ Node.js 16+
- ✅ MongoDB connected
- ✅ VehicleTracker model loaded
- ✅ dualLogin routes registered
- ✅ Rate limiting configured

Check backend is ready:
```bash
curl http://localhost:3001/api/health
# Should return: { status: 'OK', message: '...', timestamp: '...' }
```

---

## Testing Scenarios

### Scenario 1: Driver ID Login
```
1. Navigate to /driver/dual-login
2. Click "Driver ID" tab
3. Enter: DRV-ABCD-1234
4. Click "Sign In"
5. Should redirect to /driver/dashboard
6. Should show driver info
```

### Scenario 2: Vehicle Phone Login
```
1. Navigate to /driver/dual-login
2. Click "Vehicle Phone" tab
3. Enter phone: +1 (555) 123-4567
4. Enter password: testpassword
5. Click "Activate Tracker"
6. Should redirect to /driver/tracker-dashboard
```

### Scenario 3: Token Expiry
```
1. Login successfully
2. Wait 12 hours (or mock time)
3. Try to access /driver/dashboard
4. Should redirect to /driver/dual-login
```

### Scenario 4: Protected Routes
```
1. Try to access /driver/dashboard without login
2. Should redirect to /driver/dual-login
3. Login with valid credentials
4. Should access dashboard
```

---

## Performance Tips

### Optimize Re-renders
```javascript
// ✅ Good - memoized callback
const handleLogin = useCallback(async (credentials) => {
  await loginDriver(credentials.driverId);
}, [loginDriver]);

// ✅ Good - memoized component
const Dashboard = React.memo(() => {
  const { driverAuth } = useDualLogin();
  return <div>{driverAuth.userName}</div>;
});
```

### Lazy Load Components
```javascript
// ✅ Code splitting
const DualLoginDriverDashboard = lazy(() => 
  import('./components/driver/DualLoginDriverDashboard')
);

<Suspense fallback={<Spinner />}>
  <DualLoginDriverDashboard />
</Suspense>
```

---

## Debugging

### Enable Debug Logging

Add to DualLoginContext:

```javascript
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Driver Auth:', driverAuth);
    console.log('Tracker Auth:', trackerAuth);
  }
}, [driverAuth, trackerAuth]);
```

### Check localStorage

In browser console:
```javascript
localStorage.getItem('driverToken')      // Check driver token
localStorage.getItem('trackerToken')     // Check tracker token
localStorage.getItem('driverId')         // Check driver ID
```

### Network Inspector

Check DevTools Network tab:
1. Open Network tab
2. Login
3. Check POST request to `/api/drivers/section-login`
4. Verify response includes token
5. Check subsequent requests have Authorization header

---

## Next Steps After Integration

1. **Test Thoroughly**
   - Test all login scenarios
   - Test token refresh
   - Test logout
   - Test protected routes

2. **Add Remaining Components**
   - TrackerConfigPanel
   - TrackerDetailView
   - VehicleTrackerList
   - DriverSettings

3. **Error Handling**
   - Add retry logic for failed requests
   - Implement error boundaries
   - Add user-friendly error messages

4. **Monitoring**
   - Add analytics tracking
   - Monitor API performance
   - Track authentication success rates
   - Log errors for debugging

---

## Support Resources

- **Backend Docs:** [PHASE_1_DUAL_LOGIN_IMPLEMENTATION.md](PHASE_1_DUAL_LOGIN_IMPLEMENTATION.md)
- **Frontend Docs:** [PHASE_2_FRONTEND_IMPLEMENTATION.md](PHASE_2_FRONTEND_IMPLEMENTATION.md)
- **API Reference:** [DUAL_LOGIN_QUICK_REFERENCE.md](DUAL_LOGIN_QUICK_REFERENCE.md)
- **System Index:** [DUAL_LOGIN_SYSTEM_INDEX.md](DUAL_LOGIN_SYSTEM_INDEX.md)

---

## Timeline

**Phase 1 (Backend):** ✅ Complete - 6 hours
**Phase 2 (Frontend):** 🔄 In Progress - 50% (2-3 hours total)
- Components built: 1,200+ lines ✅
- Integration: Pending (1-2 hours)
- Testing: Pending (30 min)

**Phase 3 (Testing):** ⏳ Pending - 1-2 hours

**Total Estimated:** 9-11 hours for complete system

---

**Date Started:** December 21, 2025
**Last Updated:** December 21, 2025
**Status:** Integration Ready
