# Session Persistence Debugging Guide

## 🔍 Issue Summary

**Problem:** Session not persisting in localStorage, causing redirects to login page when navigating between pages.

**Root Cause:** The application is configured for static export (`output: "export"`), which pre-renders pages at build time. When serving from the `out/` directory, the session management code may not work correctly due to SSR/hydration issues.

## 🎯 Solution

### Option 1: Run Development Server (Recommended for Testing)

The development server runs with full client-side rendering and hot reload:

```bash
cd YANTECH-YNP01-GitHub-Priv-Repo-FrontEnd
npm run dev
```

Then open: `http://localhost:3000`

**Why this works:**
- Full client-side rendering
- `window` and `localStorage` are always available
- No SSR/hydration issues
- Hot reload for debugging

### Option 2: Test Static Build Locally

If you need to test the static build:

```bash
# Build the static export
npm run build

# Serve the static files with a simple HTTP server
npx serve out -p 3000
```

Then open: `http://localhost:3000`

**Note:** The static build should work, but you need to ensure:
1. All pages are marked with `'use client'`
2. localStorage operations only happen in `useEffect` or event handlers
3. No localStorage access during initial render

## 📊 Debugging Steps

### Step 1: Check Console Logs

After applying the debugging changes, you should see detailed logs:

**During Login:**
```
🔐 Login attempt for: admin
🌐 Window available: true
💾 localStorage available: true
📦 Session created: {token: "...", user: {...}, ...}
💾 [Storage] Attempting to set localStorage item: auth_session
🌐 [Storage] Window type: object
🌐 [Storage] Window undefined: false
📝 [Storage] Serialized value length: 234
✅ [Storage] Item saved successfully. Verification: EXISTS
💾 Session save result: true
🔍 Verification - Session in localStorage: EXISTS
📄 Stored session data: {"token":"...","user":{...},...}
✅ Login successful, session created
```

**During Page Load:**
```
🔄 Initializing session...
🌐 Window available: true
🔍 Raw session in localStorage: EXISTS
📄 Raw session data: {"token":"...","user":{...},...}
📊 Session data: {session: {...}, isValid: true, isExpired: false}
✅ Session restored from storage
```

### Step 2: Check localStorage in Browser

1. Open Browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Expand **Local Storage**
4. Click on your domain (e.g., `http://localhost:3000`)
5. Look for `auth_session` key

**Expected:** You should see the `auth_session` key with a JSON value

**If NOT found:** The session is not being saved (SSR issue or localStorage disabled)

### Step 3: Verify React Hooks Dependencies

The fix included correcting the React hooks dependency chain:

```typescript
// ✅ CORRECT - handleLogout is in dependencies
const initializeSession = useCallback(() => {
  // ... code that uses handleLogout
}, [handleLogout]);

// ✅ CORRECT - Both dependencies included
useEffect(() => {
  initializeSession();
  // ... interval code that uses handleLogout
}, [initializeSession, handleLogout]);
```

## 🐛 Common Issues

### Issue 1: "Window is undefined"

**Symptoms:**
```
❌ [Storage] Storage not available (SSR or disabled)
🌐 [Storage] Window undefined: true
```

**Cause:** Code is running during SSR (server-side rendering)

**Solution:** 
- Use development server (`npm run dev`)
- Ensure all pages have `'use client'` directive
- Only access localStorage in `useEffect` or event handlers

### Issue 2: Session Exists But Still Redirected

**Symptoms:**
- Console shows "Session restored from storage"
- localStorage has `auth_session` key
- Still redirected to login

**Cause:** React state not updating correctly due to dependency issues

**Solution:** Already fixed in AuthContext.tsx (dependency chain correction)

### Issue 3: Session Saves But Disappears

**Symptoms:**
- Session saves successfully during login
- On page refresh, session is gone

**Cause:** 
- Browser privacy mode
- localStorage disabled
- Browser extension blocking storage

**Solution:**
- Disable privacy/incognito mode
- Check browser settings
- Disable extensions temporarily

## 🧪 Testing Checklist

Use this checklist to verify the fix:

- [ ] **Step 1:** Clear browser localStorage completely
- [ ] **Step 2:** Start development server (`npm run dev`)
- [ ] **Step 3:** Open browser console (F12)
- [ ] **Step 4:** Navigate to `http://localhost:3000`
- [ ] **Step 5:** Login with admin/admin123
- [ ] **Step 6:** Verify console shows "Session saved successfully"
- [ ] **Step 7:** Check localStorage has `auth_session` key
- [ ] **Step 8:** Navigate to Dashboard - should work
- [ ] **Step 9:** Navigate to API Management - should work
- [ ] **Step 10:** Refresh page - should stay authenticated
- [ ] **Step 11:** Close and reopen browser - should stay authenticated

## 📝 Expected Console Output

### Successful Login Flow:
1. Login attempt logs
2. Session creation logs
3. Storage save logs with "EXISTS" verification
4. "Login successful" message

### Successful Page Load Flow:
1. "Initializing session..." message
2. "Raw session in localStorage: EXISTS"
3. Session data with isValid: true
4. "Session restored from storage"

### Failed Flow (SSR Issue):
1. "Window undefined: true"
2. "Storage not available (SSR or disabled)"
3. "Failed to save session"

## 🔧 Next Steps

If the issue persists after following this guide:

1. **Share console logs** - Copy all console output during login and navigation
2. **Share localStorage screenshot** - Show the Application/Storage tab
3. **Specify environment** - Are you using `npm run dev` or serving `out/` directory?
4. **Browser info** - Which browser and version?

## 📚 Related Files

- `contexts/AuthContext.tsx` - Main authentication context with session management
- `utils/sessionManager.ts` - Session creation, validation, and storage
- `utils/storage.ts` - Low-level localStorage operations
- `app/login/page.tsx` - Login page
- `app/dashboard/page.tsx` - Dashboard with auth guard
- `app/api_key_management/page.tsx` - API Management with auth guard

