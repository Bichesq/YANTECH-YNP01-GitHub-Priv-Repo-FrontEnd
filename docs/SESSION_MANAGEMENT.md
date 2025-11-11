# Session Management Documentation

## Overview

This application implements a comprehensive persistent authentication session storage system using browser localStorage. The system provides secure session management with automatic expiration checks, session refresh capabilities, and cross-page persistence.

## Architecture

### Components

1. **Storage Utilities** (`utils/storage.ts`)
   - Low-level localStorage/sessionStorage operations
   - Type-safe storage with JSON serialization
   - Error handling and SSR safety

2. **Session Manager** (`utils/sessionManager.ts`)
   - High-level session management functions
   - Session creation, validation, and expiration checks
   - Automatic cleanup of expired sessions

3. **Auth Context** (`contexts/AuthContext.tsx`)
   - React context provider for authentication state
   - Session initialization on app load
   - Periodic session validation
   - Login/logout functionality

4. **Session Expiration Warning** (`components/SessionExpirationWarning.tsx`)
   - Optional UI component for session expiration alerts
   - Allows users to extend their session

## Features

### ✅ Implemented Features

- **Persistent Session Storage**: Sessions are stored in localStorage and persist across browser refreshes
- **Automatic Session Restoration**: Sessions are automatically restored when the app loads
- **Session Expiration**: Configurable session duration (default: 24 hours)
- **Expiration Checks**: Automatic periodic checks for expired sessions (every 60 seconds)
- **Session Refresh**: Ability to extend session duration
- **Automatic Cleanup**: Expired sessions are automatically removed from storage
- **Type Safety**: Full TypeScript support with proper interfaces
- **SSR Safety**: Storage operations are safe for server-side rendering
- **Session Expiration Warnings**: Optional UI component to warn users before session expires

## Usage

### Basic Authentication

```typescript
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth()

  const handleLogin = () => {
    const success = login('username', 'password')
    if (success) {
      console.log('Logged in as:', user)
    }
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.username}!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  )
}
```

### Session Refresh

```typescript
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { refreshSession, isSessionExpiring } = useAuth()

  const handleRefresh = () => {
    const success = refreshSession()
    if (success) {
      console.log('Session extended successfully')
    }
  }

  return (
    <div>
      {isSessionExpiring && (
        <div>
          <p>Your session is expiring soon!</p>
          <button onClick={handleRefresh}>Extend Session</button>
        </div>
      )}
    </div>
  )
}
```

### Using Session Expiration Warning Component

Add the component to your layout:

```typescript
import SessionExpirationWarning from '@/components/SessionExpirationWarning'

export default function Layout({ children }) {
  return (
    <div>
      <SessionExpirationWarning />
      {children}
    </div>
  )
}
```

### Direct Session Access (Outside React Components)

```typescript
import { getSessionToken, getSessionUser } from '@/contexts/AuthContext'
import { getSession, isSessionValid } from '@/utils/sessionManager'

// Get current session token
const token = getSessionToken()

// Get current user
const user = getSessionUser()

// Get full session object
const session = getSession()

// Check if session is valid
const valid = isSessionValid(session)
```

## Session Data Structure

### AuthSession Interface

```typescript
interface AuthSession {
  token: string              // Authentication token
  user: User                 // User information
  expiresAt: number         // Unix timestamp (milliseconds)
  refreshToken?: string     // Optional refresh token
  issuedAt: number          // Unix timestamp (milliseconds)
}
```

### User Interface

```typescript
interface User {
  username: string
  email?: string
  role?: string
  id?: string | number
}
```

## Configuration

### Session Duration

Default session duration is 24 hours. To change it, modify the `DEFAULT_SESSION_DURATION` constant in `utils/sessionManager.ts`:

```typescript
const DEFAULT_SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
```

Or specify a custom duration when creating a session:

```typescript
const session = createSession(
  token,
  user,
  48 * 60 * 60 // 48 hours in seconds
)
```

### Expiration Check Interval

The AuthContext checks for expired sessions every 60 seconds. To change this, modify the interval in `contexts/AuthContext.tsx`:

```typescript
const intervalId = setInterval(() => {
  // Check logic
}, 60000) // Change this value (in milliseconds)
```

### Session Expiration Warning Threshold

By default, users are warned when their session will expire within 5 minutes. To change this, modify the threshold in `contexts/AuthContext.tsx`:

```typescript
const expiringSoon = isSessionExpiringSoon(5) // Change this value (in minutes)
```

## Storage Keys

The session is stored in localStorage with the following key:

- `auth_session`: Contains the complete AuthSession object

## Security Considerations

### Current Implementation

- ✅ Sessions are stored in localStorage (persists across browser sessions)
- ✅ Automatic expiration and cleanup
- ✅ Type-safe storage operations
- ✅ SSR-safe implementation

### Recommendations for Production

1. **Use HTTPS**: Always use HTTPS in production to prevent token interception
2. **Implement Real Authentication**: Replace the dummy authentication with a real backend API
3. **Use Secure Tokens**: Implement JWT or similar secure token format
4. **Add Token Refresh**: Implement refresh token rotation for enhanced security
5. **Consider httpOnly Cookies**: For maximum security, consider using httpOnly cookies instead of localStorage
6. **Add CSRF Protection**: Implement CSRF tokens for state-changing operations
7. **Implement Rate Limiting**: Add rate limiting to prevent brute force attacks
8. **Add Session Invalidation**: Implement server-side session invalidation

## API Integration

### Integrating with Backend Authentication

Replace the dummy login function in `contexts/AuthContext.tsx`:

```typescript
const login = async (username: string, password: string): Promise<boolean> => {
  try {
    // Call your authentication API
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    
    // Create session with data from API
    const newSession = createSession(
      data.token,
      data.user,
      data.expiresIn, // Duration in seconds from API
      data.refreshToken
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

### Adding Authorization Headers to API Calls

Update your API service to include the session token:

```typescript
import { getSessionToken } from '@/contexts/AuthContext'
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = getSessionToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 responses (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired, redirect to login
      clearSession()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

## Testing

### Manual Testing Checklist

- [ ] Login creates a session in localStorage
- [ ] Session persists after page refresh
- [ ] Session is restored on app initialization
- [ ] Logout clears the session
- [ ] Expired sessions are automatically cleared
- [ ] Session expiration warning appears before expiration
- [ ] Session refresh extends the expiration time
- [ ] Protected routes redirect to login when not authenticated

### Testing Session Expiration

To test session expiration quickly, temporarily reduce the session duration:

```typescript
// In utils/sessionManager.ts
const DEFAULT_SESSION_DURATION = 2 * 60 * 1000 // 2 minutes for testing
```

## Troubleshooting

### Session Not Persisting

- Check browser console for storage errors
- Verify localStorage is enabled in the browser
- Check for storage quota issues

### Session Expiring Too Quickly

- Verify the `DEFAULT_SESSION_DURATION` setting
- Check if the system clock is correct
- Ensure the expiration check interval is appropriate

### Session Not Clearing on Logout

- Verify `clearSession()` is being called
- Check browser console for errors
- Manually clear localStorage if needed

## Future Enhancements

- [ ] Implement refresh token rotation
- [ ] Add multi-device session management
- [ ] Implement "Remember Me" functionality
- [ ] Add session activity tracking
- [ ] Implement concurrent session limits
- [ ] Add session analytics and monitoring

