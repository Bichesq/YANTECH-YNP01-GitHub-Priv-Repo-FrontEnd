# Session Management - Quick Start Guide

## 🚀 What's Been Implemented

Your Next.js application now has a complete persistent authentication session storage system with:

✅ **Persistent Sessions** - Sessions survive page refreshes and browser restarts  
✅ **Automatic Expiration** - Sessions expire after 24 hours (configurable)  
✅ **Auto-Cleanup** - Expired sessions are automatically removed  
✅ **Session Refresh** - Users can extend their session before it expires  
✅ **Expiration Warnings** - Users get notified 5 minutes before session expires  
✅ **Type-Safe** - Full TypeScript support  
✅ **SSR-Safe** - Works with Next.js server-side rendering  
✅ **Auto-Logout** - Automatic redirect to login on session expiration  

## 📁 New Files Created

```
YANTECH-YNP01-GitHub-Priv-Repo-FrontEnd/
├── utils/
│   ├── storage.ts              # Low-level storage utilities
│   └── sessionManager.ts       # Session management functions
├── components/
│   └── SessionExpirationWarning.tsx  # Warning banner component
└── docs/
    ├── SESSION_MANAGEMENT.md   # Complete documentation
    └── SESSION_QUICK_START.md  # This file
```

## 📝 Modified Files

```
YANTECH-YNP01-GitHub-Priv-Repo-FrontEnd/
├── contexts/AuthContext.tsx    # Enhanced with session management
├── types/index.ts              # Added session-related types
├── services/api.ts             # Added auth token interceptors
└── app/layout.tsx              # Added SessionExpirationWarning
```

## 🎯 How It Works

### 1. Login Flow

```
User enters credentials
    ↓
AuthContext.login() validates credentials
    ↓
Creates AuthSession object with:
  - token
  - user info
  - expiration time (24 hours from now)
    ↓
Saves to localStorage as 'auth_session'
    ↓
Updates React state (isAuthenticated, user, session)
```

### 2. Page Refresh Flow

```
User refreshes page
    ↓
AuthContext initializes
    ↓
Reads 'auth_session' from localStorage
    ↓
Validates session (checks expiration)
    ↓
If valid: Restores authentication state
If expired: Clears session and redirects to login
```

### 3. Session Expiration Flow

```
Every 60 seconds, AuthContext checks:
    ↓
Is session expired?
  Yes → Clear session, redirect to login
  No → Continue
    ↓
Is session expiring soon? (< 5 minutes)
  Yes → Show warning banner
  No → Continue
```

## 🔧 Quick Usage Examples

### In a React Component

```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function MyPage() {
  const { 
    isAuthenticated, 
    user, 
    session,
    logout,
    refreshSession,
    isSessionExpiring 
  } = useAuth()

  return (
    <div>
      {isAuthenticated ? (
        <>
          <h1>Welcome, {user?.username}!</h1>
          <p>Email: {user?.email}</p>
          <p>Role: {user?.role}</p>
          
          {isSessionExpiring && (
            <button onClick={refreshSession}>
              Extend Session
            </button>
          )}
          
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  )
}
```

### Outside React Components

```typescript
import { getSessionToken, getSessionUser } from '@/contexts/AuthContext'

// Get token for API calls
const token = getSessionToken()

// Get current user
const user = getSessionUser()

console.log('Token:', token)
console.log('User:', user)
```

### In API Calls (Already Configured!)

The API service (`services/api.ts`) automatically includes the auth token in all requests:

```typescript
// This automatically includes: Authorization: Bearer <token>
const apps = await getApplications()
```

## 🧪 Testing the Implementation

### Test 1: Login Persistence

1. Open the app and login with `admin` / `admin123`
2. Open browser DevTools → Application → Local Storage
3. You should see `auth_session` with your session data
4. Refresh the page
5. ✅ You should still be logged in

### Test 2: Session Expiration

To test quickly, temporarily change the session duration:

**In `utils/sessionManager.ts`:**
```typescript
// Change from 24 hours to 2 minutes
const DEFAULT_SESSION_DURATION = 2 * 60 * 1000
```

1. Login
2. Wait 2 minutes
3. ✅ You should be automatically logged out

### Test 3: Session Warning

**In `utils/sessionManager.ts`:**
```typescript
// Set to 6 minutes for testing
const DEFAULT_SESSION_DURATION = 6 * 60 * 1000
```

1. Login
2. Wait 1 minute
3. ✅ You should see a yellow warning banner at the top
4. Click "Extend Session"
5. ✅ Warning should disappear and session should be extended

### Test 4: Logout

1. Login
2. Click logout
3. Check DevTools → Local Storage
4. ✅ `auth_session` should be removed

## 🔐 Session Data Structure

When you login, this is stored in localStorage:

```json
{
  "token": "dummy-token-1699123456789",
  "user": {
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "id": "1"
  },
  "issuedAt": 1699123456789,
  "expiresAt": 1699209856789
}
```

## ⚙️ Configuration

### Change Session Duration

**File:** `utils/sessionManager.ts`

```typescript
// Default: 24 hours
const DEFAULT_SESSION_DURATION = 24 * 60 * 60 * 1000

// Change to 48 hours:
const DEFAULT_SESSION_DURATION = 48 * 60 * 60 * 1000

// Change to 7 days:
const DEFAULT_SESSION_DURATION = 7 * 24 * 60 * 60 * 1000
```

### Change Expiration Check Interval

**File:** `contexts/AuthContext.tsx`

```typescript
// Default: Check every 60 seconds
setInterval(() => { /* ... */ }, 60000)

// Change to every 30 seconds:
setInterval(() => { /* ... */ }, 30000)
```

### Change Warning Threshold

**File:** `contexts/AuthContext.tsx`

```typescript
// Default: Warn 5 minutes before expiration
const expiringSoon = isSessionExpiringSoon(5)

// Change to 10 minutes:
const expiringSoon = isSessionExpiringSoon(10)
```

### Disable Session Warning Banner

**File:** `app/layout.tsx`

```typescript
// Remove or comment out this line:
<SessionExpirationWarning />
```

## 🔄 Integrating with Real Backend

### Step 1: Update Login Function

**File:** `contexts/AuthContext.tsx`

Replace the dummy login with a real API call:

```typescript
const login = async (username: string, password: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) return false

    const data = await response.json()
    // Expected response: { token, user, expiresIn }
    
    const newSession = createSession(
      data.token,
      data.user,
      data.expiresIn // seconds
    )

    const saved = saveSession(newSession)
    if (saved) {
      setIsAuthenticated(true)
      setUser(data.user)
      setSession(newSession)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Login error:', error)
    return false
  }
}
```

### Step 2: Backend Response Format

Your backend should return:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "john_doe",
    "email": "john@example.com",
    "role": "admin",
    "id": "123"
  },
  "expiresIn": 86400
}
```

### Step 3: Token Already Included in API Calls!

The `services/api.ts` file already includes interceptors that:
- ✅ Add `Authorization: Bearer <token>` to all requests
- ✅ Automatically logout on 401 responses
- ✅ Redirect to login when session expires

## 📊 Session State in React DevTools

Install React DevTools and inspect the AuthContext:

```
AuthProvider
├── isAuthenticated: true
├── user: { username: "admin", email: "...", ... }
├── session: { token: "...", expiresAt: 1699209856789, ... }
├── isSessionExpiring: false
├── login: ƒ
├── logout: ƒ
└── refreshSession: ƒ
```

## 🐛 Troubleshooting

### Session not persisting after refresh

**Check:**
- Browser console for errors
- DevTools → Application → Local Storage → `auth_session` exists
- localStorage is enabled in browser

**Fix:**
```typescript
// In browser console:
localStorage.getItem('auth_session')
// Should return session JSON
```

### Session expiring immediately

**Check:**
- System clock is correct
- `DEFAULT_SESSION_DURATION` is set correctly

**Fix:**
```typescript
// In utils/sessionManager.ts
console.log('Session duration:', DEFAULT_SESSION_DURATION)
```

### Warning banner not showing

**Check:**
- `SessionExpirationWarning` is in layout
- Session is actually expiring soon

**Test:**
```typescript
// Set short duration for testing
const DEFAULT_SESSION_DURATION = 6 * 60 * 1000 // 6 minutes
```

## 📚 Next Steps

1. ✅ Test the implementation with the examples above
2. ✅ Integrate with your real backend authentication API
3. ✅ Customize session duration for your needs
4. ✅ Review the full documentation in `SESSION_MANAGEMENT.md`
5. ✅ Consider implementing refresh token rotation for production

## 🎉 You're All Set!

Your application now has enterprise-grade session management. The session will:
- ✅ Persist across page refreshes
- ✅ Automatically expire after 24 hours
- ✅ Warn users before expiration
- ✅ Allow session extension
- ✅ Auto-logout on expiration
- ✅ Include auth tokens in API calls

Happy coding! 🚀

