# Session Management Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              React Application                          │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │         AuthContext (Provider)                    │  │    │
│  │  │                                                    │  │    │
│  │  │  State:                                            │  │    │
│  │  │  - isAuthenticated: boolean                       │  │    │
│  │  │  - user: User | null                              │  │    │
│  │  │  - session: AuthSession | null                    │  │    │
│  │  │  - isSessionExpiring: boolean                     │  │    │
│  │  │                                                    │  │    │
│  │  │  Methods:                                          │  │    │
│  │  │  - login(username, password)                      │  │    │
│  │  │  - logout()                                        │  │    │
│  │  │  - refreshSession()                               │  │    │
│  │  │                                                    │  │    │
│  │  └────────────┬───────────────────────────┬─────────┘  │    │
│  │               │                           │             │    │
│  │               ▼                           ▼             │    │
│  │  ┌────────────────────┐     ┌──────────────────────┐  │    │
│  │  │  Session Manager   │     │  Storage Utilities   │  │    │
│  │  │                    │     │                      │  │    │
│  │  │ - createSession()  │────▶│ - setStorageItem()  │  │    │
│  │  │ - saveSession()    │     │ - getStorageItem()  │  │    │
│  │  │ - getSession()     │     │ - removeStorageItem()│  │    │
│  │  │ - clearSession()   │     │ - clearStorage()    │  │    │
│  │  │ - isSessionValid() │     │                      │  │    │
│  │  │ - extendSession()  │     │                      │  │    │
│  │  └────────────────────┘     └──────────┬───────────┘  │    │
│  │                                         │              │    │
│  └─────────────────────────────────────────┼──────────────┘    │
│                                            │                   │
│  ┌─────────────────────────────────────────▼──────────────┐   │
│  │              localStorage                               │   │
│  │                                                          │   │
│  │  Key: 'auth_session'                                    │   │
│  │  Value: {                                               │   │
│  │    token: string,                                       │   │
│  │    user: { username, email, role, id },                │   │
│  │    issuedAt: number,                                    │   │
│  │    expiresAt: number,                                   │   │
│  │    refreshToken?: string                                │   │
│  │  }                                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

```
┌──────────────┐
│   User       │
└──────┬───────┘
       │
       │ 1. Enters credentials
       ▼
┌──────────────────────┐
│   Login Page         │
│                      │
│  - Input: username   │
│  - Input: password   │
│  - Button: Login     │
└──────┬───────────────┘
       │
       │ 2. Calls login()
       ▼
┌──────────────────────────────────┐
│   AuthContext                     │
│                                   │
│  login(username, password) {      │
│    // Validate credentials        │
│    // Create session              │
│    // Save to localStorage        │
│    // Update state                │
│  }                                │
└──────┬────────────────────────────┘
       │
       │ 3. Creates session
       ▼
┌──────────────────────────────────┐
│   Session Manager                 │
│                                   │
│  createSession() {                │
│    return {                       │
│      token,                       │
│      user,                        │
│      issuedAt: Date.now(),       │
│      expiresAt: Date.now() + 24h │
│    }                              │
│  }                                │
└──────┬────────────────────────────┘
       │
       │ 4. Saves session
       ▼
┌──────────────────────────────────┐
│   Storage Utilities               │
│                                   │
│  setStorageItem('auth_session', {│
│    token: "...",                  │
│    user: {...},                   │
│    expiresAt: ...                 │
│  })                               │
└──────┬────────────────────────────┘
       │
       │ 5. Stores in localStorage
       ▼
┌──────────────────────────────────┐
│   localStorage                    │
│                                   │
│  auth_session: "{...}"            │
└───────────────────────────────────┘
```

## Session Lifecycle

```
┌─────────────┐
│   Login     │
└──────┬──────┘
       │
       │ Session Created
       │ expiresAt = now + 24h
       ▼
┌─────────────────────┐
│   Active Session    │
│                     │
│  ✓ isAuthenticated  │
│  ✓ Token valid      │
│  ✓ User data loaded │
└──────┬──────────────┘
       │
       │ Time passes...
       │
       ▼
┌─────────────────────────┐
│  Session Expiring Soon  │◀─── Checked every 60s
│                         │
│  ⚠ < 5 minutes left     │
│  ⚠ Warning shown        │
└──────┬──────────────────┘
       │
       │ User can:
       │ A) Extend session
       │ B) Do nothing
       │
       ├─────────────────┐
       │                 │
       │ A) Extend       │ B) Do nothing
       ▼                 ▼
┌─────────────┐   ┌──────────────┐
│  Extended   │   │   Expired    │
│  Session    │   │   Session    │
│             │   │              │
│ expiresAt   │   │ ✗ Logged out │
│ += 24h      │   │ ✗ Redirected │
└─────────────┘   └──────────────┘
```

## API Request Flow with Authentication

```
┌──────────────────┐
│  React Component │
└────────┬─────────┘
         │
         │ 1. Calls API function
         │    e.g., getApplications()
         ▼
┌─────────────────────────┐
│  API Service            │
│  (services/api.ts)      │
└────────┬────────────────┘
         │
         │ 2. Axios interceptor
         │    adds auth token
         ▼
┌─────────────────────────────────┐
│  Request Interceptor            │
│                                 │
│  const token = getSessionToken()│
│  config.headers.Authorization = │
│    `Bearer ${token}`            │
└────────┬────────────────────────┘
         │
         │ 3. HTTP Request with token
         ▼
┌─────────────────────────────────┐
│  Backend API                    │
│                                 │
│  Headers:                       │
│    Authorization: Bearer xxx... │
└────────┬────────────────────────┘
         │
         │ 4. Response
         │
         ├──────────────┬──────────────┐
         │              │              │
    200 OK         401 Unauthorized   Other
         │              │              │
         ▼              ▼              ▼
┌─────────────┐  ┌──────────────┐  ┌─────────┐
│  Success    │  │  Auto-Logout │  │  Error  │
│  Return data│  │  Clear session│  │  Throw  │
└─────────────┘  │  Redirect /login│ └─────────┘
                 └──────────────┘
```

## Session Restoration on Page Load

```
┌──────────────────┐
│  Page Refresh    │
│  or              │
│  Browser Restart │
└────────┬─────────┘
         │
         │ 1. App initializes
         ▼
┌─────────────────────────┐
│  AuthContext useEffect  │
│  (runs on mount)        │
└────────┬────────────────┘
         │
         │ 2. Calls initializeSession()
         ▼
┌─────────────────────────────┐
│  Session Manager            │
│  getSessionData()           │
└────────┬────────────────────┘
         │
         │ 3. Reads from localStorage
         ▼
┌─────────────────────────────┐
│  localStorage               │
│  getItem('auth_session')    │
└────────┬────────────────────┘
         │
         │ 4. Returns session data
         ▼
┌─────────────────────────────┐
│  Validate Session           │
│                             │
│  - Exists?                  │
│  - Not expired?             │
│  - Has required fields?     │
└────────┬────────────────────┘
         │
         ├──────────────┬──────────────┐
         │              │              │
    Valid          Expired        Not Found
         │              │              │
         ▼              ▼              ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│  Restore    │  │  Clear &     │  │  Stay       │
│  Auth State │  │  Redirect    │  │  Logged Out │
│             │  │  to Login    │  │             │
│ ✓ Set user  │  │              │  │ Redirect to │
│ ✓ Set token │  │              │  │ Login       │
└─────────────┘  └──────────────┘  └─────────────┘
```

## Periodic Session Validation

```
┌─────────────────────────┐
│  setInterval (60s)      │
│  in AuthContext         │
└────────┬────────────────┘
         │
         │ Every 60 seconds
         ▼
┌─────────────────────────────┐
│  Check Session Status       │
│                             │
│  const session = getSession()│
│  const expired = isExpired()│
│  const expiring = isSoon()  │
└────────┬────────────────────┘
         │
         ├──────────────┬──────────────┐
         │              │              │
    Expired        Expiring Soon    Valid
         │              │              │
         ▼              ▼              ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│  Logout     │  │  Show        │  │  Continue   │
│  Clear      │  │  Warning     │  │             │
│  Redirect   │  │  Banner      │  │             │
└─────────────┘  └──────────────┘  └─────────────┘
```

## Data Flow Summary

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐
│   User   │────▶│ AuthContext  │────▶│   Session   │
│  Action  │     │   (State)    │     │   Manager   │
└──────────┘     └──────┬───────┘     └──────┬──────┘
                        │                     │
                        │                     │
                        ▼                     ▼
                 ┌─────────────┐     ┌──────────────┐
                 │  React UI   │     │  localStorage│
                 │  Updates    │     │   (Persist)  │
                 └─────────────┘     └──────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────┐
│  Layer 1: Client-Side Validation                │
│  - Check session expiration                     │
│  - Validate token format                        │
│  - Auto-logout on expiration                    │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  Layer 2: API Interceptors                      │
│  - Add Authorization header                     │
│  - Handle 401 responses                         │
│  - Auto-redirect on auth failure                │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  Layer 3: Backend Validation (Your API)         │
│  - Verify JWT signature                         │
│  - Check token expiration                       │
│  - Validate user permissions                    │
└─────────────────────────────────────────────────┘
```

## File Structure

```
YANTECH-YNP01-GitHub-Priv-Repo-FrontEnd/
│
├── contexts/
│   └── AuthContext.tsx
│       ├── AuthProvider (React Context)
│       ├── useAuth() hook
│       ├── Session initialization
│       ├── Periodic validation
│       └── Login/Logout logic
│
├── utils/
│   ├── storage.ts
│   │   ├── setStorageItem()
│   │   ├── getStorageItem()
│   │   ├── removeStorageItem()
│   │   └── clearStorage()
│   │
│   └── sessionManager.ts
│       ├── createSession()
│       ├── saveSession()
│       ├── getSession()
│       ├── clearSession()
│       ├── isSessionValid()
│       ├── isSessionExpired()
│       ├── extendSession()
│       └── getSessionToken()
│
├── components/
│   └── SessionExpirationWarning.tsx
│       └── Warning banner UI
│
├── services/
│   └── api.ts
│       ├── Request interceptor (add token)
│       └── Response interceptor (handle 401)
│
└── types/
    └── index.ts
        ├── User
        ├── AuthSession
        ├── SessionData
        └── LoginResponse
```

## Key Design Decisions

### 1. localStorage vs sessionStorage
- **Choice**: localStorage
- **Reason**: Persist sessions across browser restarts
- **Trade-off**: Less secure than sessionStorage, but better UX

### 2. Client-Side Session Management
- **Choice**: Store session in browser
- **Reason**: Static site deployment (S3), no server-side state
- **Trade-off**: Token visible in browser, but suitable for this architecture

### 3. Automatic Expiration Checks
- **Choice**: Check every 60 seconds
- **Reason**: Balance between responsiveness and performance
- **Trade-off**: Not instant, but good enough for most use cases

### 4. Session Duration
- **Choice**: 24 hours default
- **Reason**: Balance between security and user convenience
- **Trade-off**: Configurable per deployment needs

### 5. Warning Threshold
- **Choice**: 5 minutes before expiration
- **Reason**: Enough time for user to react
- **Trade-off**: Not too annoying, but timely enough

## Extension Points

### 1. Add Refresh Token Rotation
```typescript
// In sessionManager.ts
export const refreshToken = async (refreshToken: string) => {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken })
  })
  // Update session with new tokens
}
```

### 2. Add Multi-Device Session Management
```typescript
// Track sessions per device
interface DeviceSession {
  deviceId: string
  sessions: AuthSession[]
}
```

### 3. Add Session Activity Tracking
```typescript
// Track last activity
export const updateLastActivity = () => {
  const session = getSession()
  if (session) {
    session.lastActivity = Date.now()
    saveSession(session)
  }
}
```

