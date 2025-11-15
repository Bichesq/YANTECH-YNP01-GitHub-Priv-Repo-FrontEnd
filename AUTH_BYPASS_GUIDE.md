# Authentication Bypass Guide

## ⚠️ IMPORTANT: Development Only

This guide explains how to temporarily disable authentication requirements for development and testing purposes. **NEVER deploy to production with authentication disabled!**

---

## 🔓 How to Disable Authentication

### Step 1: Edit `.env.local`

Open `YANTECH-YNP01-GitHub-Priv-Repo-FrontEnd/.env.local` and set:

```bash
NEXT_PUBLIC_DISABLE_AUTH=true
```

### Step 2: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Verify

Open your browser and navigate to `http://localhost:3000`. You should:
- ✅ Be automatically redirected to the dashboard (no login required)
- ✅ See console message: `🚨 AUTHENTICATION IS DISABLED - Development mode only!`
- ✅ Be able to access all pages without logging in

---

## 🔒 How to Re-Enable Authentication

### Option 1: Set to False (Recommended)

Edit `.env.local`:

```bash
NEXT_PUBLIC_DISABLE_AUTH=false
```

### Option 2: Remove the Line

Delete or comment out the line in `.env.local`:

```bash
# NEXT_PUBLIC_DISABLE_AUTH=true
```

### Step 2: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Verify

- ✅ Opening `http://localhost:3000` should redirect to `/login`
- ✅ Accessing protected pages should require login
- ✅ No console warning about disabled auth

---

## 📋 What Gets Bypassed

When `NEXT_PUBLIC_DISABLE_AUTH=true`, the following authentication checks are disabled:

### 1. **AuthContext** (`contexts/AuthContext.tsx`)
- `initializeSession()` - Auto-sets `isAuthenticated = true`
- `login()` - Always returns success without checking credentials
- Creates a mock user: `{ id: 'dev-user', username: 'dev-user', email: 'dev@example.com', role: 'admin' }`

### 2. **Protected Pages**
All pages skip the authentication check:
- ✅ `/dashboard` - Dashboard page
- ✅ `/api_key_management` - API Management page
- ✅ `/application?id=...` - Application detail page
- ✅ `/application/edit?id=...` - Edit application page
- ✅ `/` - Home page (redirects to dashboard instead of login)

### 3. **API Service** (`services/api.ts`)
- 401 responses no longer trigger automatic redirect to login
- Session token still sent if available, but 401 errors are ignored

---

## 🛡️ What Is Preserved

The authentication bypass does NOT delete or break any code:

- ✅ All session management code remains intact
- ✅ All authentication logic is preserved
- ✅ All security checks can be re-enabled instantly
- ✅ No code is deleted or commented out
- ✅ Changes are controlled by a single environment variable

---

## 🧪 Testing Scenarios

### Scenario 1: Access Dashboard Without Login

**With Auth Disabled:**
```bash
# In .env.local
NEXT_PUBLIC_DISABLE_AUTH=true
```

1. Navigate to `http://localhost:3000`
2. Should redirect to `/dashboard` automatically
3. No login required

**With Auth Enabled:**
```bash
# In .env.local
NEXT_PUBLIC_DISABLE_AUTH=false
```

1. Navigate to `http://localhost:3000`
2. Should redirect to `/login`
3. Must login to access dashboard

### Scenario 2: Navigate Between Pages

**With Auth Disabled:**
- Can freely navigate between all pages
- No redirects to login
- All pages accessible

**With Auth Enabled:**
- Must be logged in to access protected pages
- Redirected to login if not authenticated
- Session must be valid

---

## 🚨 Security Warnings

### ⚠️ NEVER Deploy with Auth Disabled

**Before deploying to production:**

1. **Check `.env.local`:**
   ```bash
   NEXT_PUBLIC_DISABLE_AUTH=false  # or remove the line
   ```

2. **Verify in build:**
   ```bash
   npm run build
   ```
   - Should NOT see warning: `🚨 AUTHENTICATION IS DISABLED`

3. **Test production build:**
   ```bash
   npx serve out -p 3000
   ```
   - Should require login to access protected pages

### ⚠️ Environment Variables in Static Export

**Important:** `NEXT_PUBLIC_*` variables are **embedded in the build** at build time.

This means:
- If you build with `NEXT_PUBLIC_DISABLE_AUTH=true`, the static files will have auth disabled
- You MUST rebuild if you change this variable
- The S3 deployment will use whatever value was set during build

**Safe Deployment Checklist:**
- [ ] Set `NEXT_PUBLIC_DISABLE_AUTH=false` in `.env.local`
- [ ] Run `npm run build`
- [ ] Test locally: `npx serve out -p 3000`
- [ ] Verify login is required
- [ ] Deploy to S3: `npm run deploy:s3`

---

## 🔍 How It Works

### Implementation Details

The bypass is implemented using a single environment variable that is checked in multiple locations:

```typescript
// Read environment variable
const AUTH_DISABLED = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

// Example: Skip auth check in protected page
useEffect(() => {
  // ⚠️ AUTH BYPASS: Skip authentication check if auth is disabled
  if (!AUTH_DISABLED && !isAuthenticated) {
    router.push("/login");
    return;
  }
  // ... rest of code
}, [isAuthenticated, router]);
```

### Files Modified

All modifications are clearly marked with `⚠️ AUTH BYPASS` comments:

1. **`.env.local`** - Environment variable definition
2. **`contexts/AuthContext.tsx`** - Auto-authenticate when disabled
3. **`app/page.tsx`** - Skip login redirect
4. **`app/dashboard/page.tsx`** - Skip auth check
5. **`app/api_key_management/page.tsx`** - Skip auth check
6. **`app/application/page.tsx`** - Skip auth check
7. **`app/application/edit/page.tsx`** - Skip auth check
8. **`services/api.ts`** - Skip 401 redirect

### Reverting Changes

To completely remove the auth bypass feature:

1. Search for `⚠️ AUTH BYPASS` in the codebase
2. Remove all code blocks marked with this comment
3. Remove `NEXT_PUBLIC_DISABLE_AUTH` from `.env.local`
4. Rebuild the application

---

## 📝 Quick Reference

| Action | Command/Setting |
|--------|----------------|
| **Disable Auth** | Set `NEXT_PUBLIC_DISABLE_AUTH=true` in `.env.local` |
| **Enable Auth** | Set `NEXT_PUBLIC_DISABLE_AUTH=false` in `.env.local` |
| **Restart Server** | `npm run dev` |
| **Check Status** | Look for console warning on page load |
| **Build for Production** | Ensure `NEXT_PUBLIC_DISABLE_AUTH=false` before `npm run build` |

---

## ❓ FAQ

**Q: Can I use this in production?**  
A: **NO!** This is for development only. Never deploy with auth disabled.

**Q: Do I need to rebuild after changing the variable?**  
A: Yes, for static builds. For dev server, just restart.

**Q: Will this affect my session management code?**  
A: No, all session code is preserved and can be re-enabled instantly.

**Q: What if I forget to re-enable auth before deploying?**  
A: Your production site will be accessible without login! Always verify before deploying.

**Q: Can I use different values for dev and prod?**  
A: Yes, but be careful. The value is embedded at build time, so make sure to build with the correct value.

---

## ✅ Summary

- **To Disable:** `NEXT_PUBLIC_DISABLE_AUTH=true` in `.env.local` + restart server
- **To Enable:** `NEXT_PUBLIC_DISABLE_AUTH=false` in `.env.local` + restart server
- **For Production:** Always ensure auth is enabled before building and deploying
- **Reversible:** All changes can be toggled with a single environment variable
- **Safe:** No authentication code is deleted or permanently modified

