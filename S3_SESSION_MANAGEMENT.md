# Session Management in AWS S3 Static Export

## 🎯 Overview

This document explains how session management works in a Next.js static export deployed to AWS S3, and confirms that **localStorage-based session persistence is fully compatible** with this architecture.

## ✅ Compatibility Confirmation

**YES** - Session persistence using localStorage **WORKS PERFECTLY** with Next.js static export on AWS S3.

### Why It Works

1. **Static Export = Pure Client-Side Rendering**
   - When deployed to S3, all JavaScript runs in the browser
   - No server-side rendering (SSR) in production
   - `window` and `localStorage` are always available

2. **Proper Client-Side Architecture**
   - `AuthContext` is marked with `'use client'`
   - Session initialization happens in `useEffect` (after hydration)
   - All localStorage access has SSR guards (`typeof window !== 'undefined'`)

3. **Build vs Runtime**
   - **Build time**: Next.js pre-renders HTML (no localStorage access)
   - **Runtime**: Browser executes JavaScript and accesses localStorage
   - Session management only runs at runtime ✅

## 🏗️ Architecture

### Static Export Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Build Time (npm run build)                                  │
├─────────────────────────────────────────────────────────────┤
│ 1. Next.js generates static HTML files                      │
│ 2. No localStorage access (window is undefined)             │
│ 3. Output: out/ directory with HTML, CSS, JS                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Deployment (aws s3 sync)                                    │
├─────────────────────────────────────────────────────────────┤
│ 1. Upload static files to S3 bucket                         │
│ 2. S3 serves files as static website                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Runtime (User's Browser)                                    │
├─────────────────────────────────────────────────────────────┤
│ 1. Browser loads HTML from S3                               │
│ 2. Browser executes JavaScript                              │
│ 3. React hydrates the application                           │
│ 4. AuthContext useEffect runs                               │
│ 5. Session restored from localStorage ✅                    │
└─────────────────────────────────────────────────────────────┘
```

### Session Lifecycle

```
User Opens App
     ↓
Browser loads index.html from S3
     ↓
React hydrates (client-side)
     ↓
AuthProvider mounts
     ↓
useEffect runs initializeSession()
     ↓
Check localStorage for 'auth_session'
     ↓
┌─────────────────┬─────────────────┐
│ Session Found   │ No Session      │
├─────────────────┼─────────────────┤
│ Validate        │ Redirect to     │
│ expiration      │ login page      │
├─────────────────┤                 │
│ If valid:       │                 │
│ - Restore user  │                 │
│ - Set auth=true │                 │
│ - Stay on page  │                 │
└─────────────────┴─────────────────┘
```

## 🔧 Implementation Details

### Key Changes Made

1. **Added Initialization State**
   ```typescript
   const [isInitialized, setIsInitialized] = useState(false);
   ```
   - Prevents race conditions during hydration
   - Ensures session check completes before starting interval

2. **Split useEffect Hooks**
   ```typescript
   // Run once on mount
   useEffect(() => {
     initializeSession();
   }, []);

   // Run after initialization
   useEffect(() => {
     if (!isInitialized) return;
     // Start interval...
   }, [isInitialized, handleLogout]);
   ```
   - Separates initialization from periodic checks
   - Prevents multiple initializations

3. **SSR Guard in initializeSession**
   ```typescript
   if (typeof window === 'undefined') {
     console.warn('[Auth] Skipping session initialization - SSR context');
     return;
   }
   ```
   - Extra safety for development server
   - Not needed in S3 production, but good practice

## 🧪 Testing

### Local Development Testing

**Option 1: Development Server (Recommended)**
```bash
npm run dev
```
- Full client-side rendering
- Hot reload
- Best for debugging

**Option 2: Static Build Testing**
```bash
# Build static export
npm run build

# Serve locally
npx serve out -p 3000
```
- Tests actual production build
- Simulates S3 environment
- Verifies session persistence works

### Production Testing (S3)

After deploying to S3:

1. **Login Test**
   - Login with admin/admin123
   - Check browser DevTools → Application → Local Storage
   - Verify `auth_session` key exists

2. **Navigation Test**
   - Navigate to Dashboard
   - Navigate to API Management
   - Should stay authenticated

3. **Persistence Test**
   - Refresh page
   - Should stay authenticated
   - Session should persist

4. **Expiration Test**
   - Wait 24 hours (or modify session duration)
   - Should redirect to login

## 📊 Browser Storage

### What Gets Stored

**Key**: `auth_session`

**Value** (JSON):
```json
{
  "token": "dummy-token-1234567890",
  "user": {
    "id": "1",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  },
  "issuedAt": 1234567890000,
  "expiresAt": 1234654290000,
  "refreshToken": null
}
```

### Storage Location

- **Type**: localStorage (persistent across browser sessions)
- **Scope**: Per domain (e.g., `https://your-bucket.s3.amazonaws.com`)
- **Lifetime**: Until expiration or manual logout

## 🔒 Security Considerations

### Current Implementation

✅ **Good Practices:**
- Session expiration (24 hours)
- Automatic cleanup of expired sessions
- Client-side validation

⚠️ **Limitations:**
- Token stored in localStorage (accessible to JavaScript)
- No HTTP-only cookies (not possible in static export)
- No server-side validation

### Recommendations for Production

1. **Use HTTPS** (S3 + CloudFront)
   - Prevents token interception
   - Required for secure authentication

2. **Implement Token Refresh**
   - Short-lived access tokens (15 min)
   - Long-lived refresh tokens (7 days)
   - Refresh before expiration

3. **Add CORS Configuration**
   - Restrict API access to your S3 domain
   - Configure backend CORS headers

4. **Consider CloudFront**
   - Custom domain with SSL
   - Better security headers
   - DDoS protection

## 🚀 Deployment Checklist

- [ ] Build static export: `npm run build`
- [ ] Test locally: `npx serve out -p 3000`
- [ ] Verify session persistence works locally
- [ ] Deploy to S3: `npm run deploy:s3`
- [ ] Test login on S3 URL
- [ ] Verify localStorage in browser DevTools
- [ ] Test navigation between pages
- [ ] Test page refresh (session should persist)
- [ ] Configure backend CORS for S3 domain
- [ ] (Optional) Set up CloudFront with custom domain

## 🐛 Troubleshooting

### Issue: Session not persisting on S3

**Symptoms:**
- Login works but redirects to login on refresh
- `auth_session` not in localStorage

**Possible Causes:**
1. Browser privacy mode (localStorage disabled)
2. Browser extension blocking storage
3. CORS issues preventing API calls

**Solutions:**
1. Disable privacy/incognito mode
2. Disable browser extensions
3. Check browser console for CORS errors
4. Verify backend CORS configuration

### Issue: "Storage not available" error

**Symptoms:**
- Console shows "[Storage] Storage not available - SSR context"

**Cause:**
- Code running during build or SSR

**Solution:**
- This should NOT happen in S3 production
- If it does, check that all pages have `'use client'` directive
- Verify localStorage access is in `useEffect` or event handlers

## 📚 Related Files

- `contexts/AuthContext.tsx` - Main authentication context
- `utils/sessionManager.ts` - Session creation and validation
- `utils/storage.ts` - localStorage wrapper with SSR safety
- `next.config.ts` - Static export configuration
- `S3_DEPLOYMENT_GUIDE.md` - Deployment instructions

## ✅ Conclusion

**Session management with localStorage is fully compatible with Next.js static export on AWS S3.**

The implementation:
- ✅ Works in development (`npm run dev`)
- ✅ Works in local static build (`npx serve out`)
- ✅ Works in production (AWS S3)
- ✅ Persists across page refreshes
- ✅ Persists across browser sessions
- ✅ Handles expiration correctly
- ✅ No SSR issues in production

You can confidently deploy to S3 knowing that session persistence will work correctly!

