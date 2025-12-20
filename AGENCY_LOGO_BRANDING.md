# Agency Logo Branding Implementation

## Overview
This implementation adds agency logo-based branding to the Transportation MVP system. Users can upload custom logos that display in the Navbar and Sidebar instead of the generic "TransportHub" text.

## Phase 7.5 - Agency Branding Feature

### Completed Tasks

#### 1. Backend Implementation
- **Database Schema**: Added `logoUrl` field to User model
  - Type: String
  - Default: null
  - Trimmed and optional
  - Location: `backend/models/User.js` (after `profileImage` field)

- **Upload Endpoint**: Created POST `/api/auth/upload-logo`
  - Protected: Admin role required with authentication
  - File handling: Multer configured for logo uploads
  - Storage: Disk storage at `uploads/logos/`
  - File size limit: 5MB
  - Supported formats: JPEG, PNG, SVG, GIF, WebP
  - Returns: `logoUrl` and updated user object
  - Error handling: File type validation and size checks

#### 2. Frontend Components

##### BrandingLogo Component
- **Location**: `frontend/src/components/shared/BrandingLogo.jsx`
- **Features**:
  - Display agency logo from URL
  - Responsive sizing (sm, md, lg)
  - Fallback placeholder icon (BuildingOffice icon)
  - Error handling for broken image URLs
  - Optional agency name text display
  - Lazy loading for performance

- **Props**:
  ```jsx
  <BrandingLogo 
    logoUrl={string}           // URL to logo image
    agencyName={string}        // Agency name (default: "Drive")
    size="sm|md|lg"            // Component size
    showText={boolean}         // Display agency name below logo
  />
  ```

##### LogoUpload Component
- **Location**: `frontend/src/components/admin/LogoUpload.jsx`
- **Features**:
  - Drag-and-drop file upload
  - File type and size validation
  - Live preview of uploaded logo
  - Upload progress tracking
  - Toast notifications for feedback
  - Cancel/Upload buttons
  - Current logo preview display

#### 3. UI Integration

##### Navbar Updates
- **Mobile Layout** (base breakpoint):
  - Replaced text "TransportHub" with BrandingLogo
  - Size: sm (24px height)
  - Text display: disabled (icon only)
  - Click behavior: navigates to dashboard

- **Desktop Layout** (md+ breakpoint):
  - Replaced text-based branding with BrandingLogo
  - Size: md (32px height)
  - Text display: enabled
  - Integrated after sidebar toggle button

##### Sidebar Updates
- **Mobile Drawer Header**:
  - Replaced vertical text stack with BrandingLogo
  - Integrated in DrawerHeader component
  - Size: sm
  - Text display: enabled
  - Used HStack for proper alignment

#### 4. Admin Settings Integration
- **New Tab**: "Branding" tab added to Admin Settings
  - Icon: FaPalette
  - Position: After Sidebar settings tab
  - Content: LogoUpload component instance
  - User context: Passes current `user.logoUrl` and `user.firstName`
  - Success callback: Toast notification on successful upload

#### 5. Authentication Context
- **No changes required**: AuthContext already passes complete user object
- `user.logoUrl` automatically included in authenticated requests
- Logo data flows through existing context system

### Data Flow

```
1. Admin uploads logo in AdminSettings > Branding tab
   ↓
2. LogoUpload component → POST /api/auth/upload-logo
   ↓
3. Backend saves file to uploads/logos/
   ↓
4. Backend updates User.logoUrl with file path
   ↓
5. AuthContext receives updated user object
   ↓
6. Navbar & Sidebar components display BrandingLogo
   ↓
7. BrandingLogo renders image or fallback icon
```

### Files Modified

#### Backend
- `backend/models/User.js` - Added logoUrl field
- `backend/routes/auth.js` - Added upload endpoint with multer config

#### Frontend
- `frontend/src/components/shared/Navbar.jsx` - Integrated BrandingLogo (mobile & desktop)
- `frontend/src/components/shared/Sidebar.jsx` - Integrated BrandingLogo in drawer header
- `frontend/src/components/admin/AdminSettings.jsx` - Added Branding tab, imported LogoUpload

#### New Files
- `frontend/src/components/shared/BrandingLogo.jsx` - Logo display component
- `frontend/src/components/admin/LogoUpload.jsx` - Admin upload interface

### Fallback & Error Handling

**When Logo Unavailable:**
- Image load failure → Shows BuildingOffice icon
- No logoUrl set → Shows BuildingOffice icon
- Icon is styled to match brand colors (brand.600)
- Maintains consistent sizing

**Upload Validation:**
- File type check: Only image formats allowed
- Size check: Max 5MB limit
- Error messages: Toast notifications inform user
- Graceful degradation: Fallback icon always available

### Responsive Design

**Mobile (base):**
- Navbar: Logo icon only (24px)
- Sidebar: Logo with text label (32px)

**Tablet (md):**
- Navbar: Logo with text (32px)
- Sidebar: Logo with text (32px)

**Desktop (lg+):**
- Navbar: Logo with text (32px)
- Sidebar: Logo with text (32px)

### User Experience

1. **Admin Action**:
   - Navigate to Admin Settings
   - Click "Branding" tab
   - Upload logo via drag-drop or file picker
   - See live preview
   - Click "Upload Logo"
   - Receive success notification

2. **User View**:
   - Logo appears immediately in Navbar (mobile/desktop)
   - Logo appears in Sidebar header (mobile drawer)
   - Professional branding for agency

3. **Fallback**:
   - No logo uploaded → See placeholder icon
   - Logo URL broken → See placeholder icon
   - User identifies it as agency/building icon

### Technical Notes

**Multer Configuration:**
- Destination: `uploads/logos/`
- Filename pattern: `logo-{timestamp}-{random}.{ext}`
- Size limit: 5MB
- MIME types: image/*

**API Response:**
```json
{
  "message": "Logo uploaded successfully",
  "logoUrl": "/uploads/logos/logo-1234567890-123456.png",
  "user": { ...user object... }
}
```

**Activity Logging:**
- Logs uploaded logo filename to audit trail
- Useful for compliance and troubleshooting

### Testing Checklist

- [ ] Admin can upload logo in Admin Settings
- [ ] Logo displays in Navbar (mobile view)
- [ ] Logo displays in Navbar (desktop view)
- [ ] Logo displays in Sidebar header
- [ ] Fallback icon shows when no logo
- [ ] Fallback icon shows when image breaks
- [ ] File upload validates file type
- [ ] File upload validates file size
- [ ] Logo persists after page refresh
- [ ] Multiple agencies have independent logos
- [ ] Toast notifications appear on upload success
- [ ] Toast notifications appear on upload error

### Future Enhancements

1. **Logo Management**:
   - Multiple logo variants (favicon, full logo, icon-only)
   - Logo history and rollback
   - Logo positioning customization

2. **Advanced Branding**:
   - Custom color scheme per agency
   - Font customization
   - Header/footer customization
   - Logo cropping tool before upload

3. **Performance**:
   - CDN integration for logo storage
   - Image optimization and compression
   - Caching strategies

4. **Analytics**:
   - Track which agencies have branding
   - Usage metrics for logo display
   - A/B testing different logos

### Troubleshooting

**Logo Not Displaying:**
1. Check `user.logoUrl` value in browser console
2. Verify file exists in `uploads/logos/` directory
3. Check browser Network tab for failed requests
4. Verify file permissions on uploads folder

**Upload Fails:**
1. Check file size (max 5MB)
2. Verify file format (JPEG, PNG, SVG, GIF, WebP)
3. Check server logs for multer errors
4. Verify uploads folder exists and is writable

**Logo Appears in Admin but Not in UI:**
1. Check if page was refreshed
2. Verify AuthContext is returning updated user
3. Check if logoUrl path is correct
4. Verify BrandingLogo component received logoUrl prop

---

**Implementation Date**: Phase 7.5 Mobile Responsiveness + Agency Branding
**Status**: ✅ Complete and ready for testing
