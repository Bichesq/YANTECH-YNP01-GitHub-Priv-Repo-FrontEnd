# Technical Documentation - Notification System Admin Frontend

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Design Decisions](#architecture--design-decisions)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Component Architecture](#component-architecture)
6. [State Management](#state-management)
7. [Routing & Navigation](#routing--navigation)
8. [API Integration](#api-integration)
9. [Authentication & Authorization](#authentication--authorization)
10. [Session Management](#session-management)
11. [Environment Configuration](#environment-configuration)
12. [Development Workflow](#development-workflow)
13. [Build & Deployment](#build--deployment)
14. [Testing Strategy](#testing-strategy)
15. [Performance Optimization](#performance-optimization)
16. [Security Considerations](#security-considerations)
17. [Troubleshooting Guide](#troubleshooting-guide)
18. [Best Practices](#best-practices)
19. [Future Enhancements](#future-enhancements)

---

## Overview

### Purpose

The Notification System Admin Frontend is a web-based administrative interface for managing notification applications, API keys, and AWS resources (SES, SNS). It provides a user-friendly dashboard for administrators to:

- Create and manage notification applications
- Generate and manage API keys
- Configure AWS SES domains and SNS topics
- Send test notifications
- Monitor notification history

### Target Users

- System Administrators
- DevOps Engineers
- Application Developers
- IT Support Staff

### Key Features

- **Application Management**: Full CRUD operations for notification applications
- **API Key Management**: Generate, view, and revoke API keys with expiration support
- **AWS Integration**: Automatic SES domain verification and SNS topic creation
- **Notification Testing**: Send test notifications via Email, SMS, or Push
- **Session Management**: Secure authentication with automatic session expiration warnings
- **Responsive Design**: Mobile-first design that works on all devices
- **Static Export**: Optimized for AWS S3 hosting with minimal infrastructure costs

---

## Architecture & Design Decisions

### 1. Static Site Generation (SSG) vs Server-Side Rendering (SSR)

**Decision**: Use Next.js static export (`output: "export"`)

**Rationale**:
- **Cost Efficiency**: Reduces hosting costs by 90-95% compared to container deployment
- **Scalability**: S3 provides infinite scalability without configuration
- **Simplicity**: No server management, patching, or maintenance required
- **Performance**: Static files served from CDN edge locations
- **Reliability**: 99.99% SLA from AWS S3

**Trade-offs**:
- No server-side rendering capabilities
- No API routes (must use external backend)
- No dynamic route segments (use query parameters instead)
- No Next.js Image Optimization API
- Environment variables embedded at build time

### 2. Client-Side Routing with Query Parameters

**Decision**: Use query parameters (`/application?id=123`) instead of dynamic routes (`/application/[id]`)

**Rationale**:
- Static export doesn't support dynamic route segments without `generateStaticParams`
- Query parameters work seamlessly with client-side routing
- Simpler to implement and maintain
- Compatible with S3 static hosting

**Implementation**:
```typescript
// Using useSearchParams with Suspense boundary
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ApplicationDetail() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  // ...
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ApplicationDetail />
    </Suspense>
  )
}
```

### 3. Direct Backend API Calls

**Decision**: Frontend makes direct HTTP calls to backend EC2 instance

**Rationale**:
- Static export doesn't support Next.js API routes
- Reduces complexity by eliminating proxy layer
- Backend already has proper authentication and authorization
- CORS configuration is straightforward

**Requirements**:
- Backend must enable CORS for S3/CloudFront origin
- Backend must handle authentication via JWT tokens
- Frontend must include Authorization header in all requests

### 4. Client-Side State Management

**Decision**: Use React Context API for global state (authentication)

**Rationale**:
- Lightweight solution for simple state management needs
- No external dependencies required
- Sufficient for authentication and session state
- Easy to understand and maintain

**Alternative Considered**: Redux, Zustand
- **Rejected**: Overkill for current application complexity
- **Future**: Consider if state management becomes more complex

### 5. localStorage for Session Persistence

**Decision**: Store authentication tokens and session data in localStorage

**Rationale**:
- Persists across browser sessions
- Simple API for read/write operations
- No server-side session management required
- Works well with static site architecture

**Security Considerations**:
- Vulnerable to XSS attacks (mitigated by input sanitization)
- Not suitable for highly sensitive data
- Session expiration enforced client-side
- Tokens should have short expiration times

---

## Technology Stack

### Core Framework
- **Next.js 15.4.2**: React framework with App Router
- **React 19.1.0**: UI library
- **TypeScript 5**: Type-safe JavaScript

### Styling
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **PostCSS 8.5.6**: CSS processing
- **Autoprefixer 10.4.21**: Vendor prefix automation

### HTTP Client
- **Axios 1.6.0**: Promise-based HTTP client with interceptors

### UI Components
- **React Icons 5.5.0**: Icon library
- **clsx 2.0.0**: Conditional className utility
- **tailwind-merge 2.0.0**: Merge Tailwind classes intelligently

### Development Tools
- **ESLint 9**: Code linting
- **eslint-config-next**: Next.js-specific ESLint rules
- **@typescript-eslint**: TypeScript ESLint integration

### Build Tools
- **Next.js Build System**: Static export generation
- **SWC**: Fast TypeScript/JavaScript compiler

---

## Project Structure

### Directory Organization

```
YANTECH-YNP01-GitHub-Priv-Repo-FrontEnd/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with AuthProvider
│   ├── page.tsx                 # Home page (redirects to login/dashboard)
│   ├── globals.css              # Global styles and Tailwind imports
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── dashboard/
│   │   └── page.tsx            # Main dashboard
│   ├── application/
│   │   ├── page.tsx            # Application detail (?id=123)
│   │   └── edit/
│   │       └── page.tsx        # Edit application (?id=123)
│   └── api_key_management/
│       └── page.tsx            # API key management page
│
├── components/                   # Reusable React components
│   ├── Header.tsx               # Navigation header
│   ├── ApplicationForm.tsx      # Create/edit application form
│   ├── ApplicationList.tsx      # List of applications
│   ├── ApiKeyManagement.tsx     # API key management UI
│   ├── ApiCreationForm.tsx      # Create API key form
│   ├── NotificationForm.tsx     # Send notification form
│   └── SessionExpirationWarning.tsx  # Session timeout warning
│
├── contexts/                     # React Context providers
│   └── AuthContext.tsx          # Authentication context and provider
│
├── services/                     # API service layer
│   └── api.ts                   # Axios instances and API functions
│
├── types/                        # TypeScript type definitions
│   └── index.ts                 # All application types
│
├── utils/                        # Utility functions
│   ├── sessionManager.ts        # Session management utilities
│   └── storage.ts               # localStorage wrapper
│
├── public/                       # Static assets
│   ├── *.svg                    # SVG icons
│   └── ...
│
├── out/                          # Build output (generated)
│   └── ...                      # Static HTML, CSS, JS files
│
├── docs/                         # Additional documentation
│   ├── SESSION_ARCHITECTURE.md
│   ├── SESSION_MANAGEMENT.md
│   └── SESSION_QUICK_START.md
│
├── next.config.ts               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies and scripts
├── .env.local                   # Environment variables (not committed)
├── .env.example                 # Environment variable template
├── bucket-policy.json           # S3 bucket policy template
├── README.md                    # Quick start guide
└── TECHNICAL_DOCUMENTATION.md   # This file
```

### File Naming Conventions

- **Pages**: `page.tsx` (Next.js App Router convention)
- **Components**: PascalCase (e.g., `ApplicationForm.tsx`)
- **Utilities**: camelCase (e.g., `sessionManager.ts`)
- **Types**: `index.ts` in `types/` directory
- **Styles**: `globals.css` for global, component styles inline with Tailwind

### Import Aliases

```typescript
// Configured in tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Usage**:
```typescript
import { useAuth } from '@/contexts/AuthContext'
import { getApplications } from '@/services/api'
import type { Application } from '@/types'
```

---

## Component Architecture

### Component Hierarchy

```
RootLayout (app/layout.tsx)
├── AuthProvider (contexts/AuthContext.tsx)
│   ├── SessionExpirationWarning
│   └── Page Content
│       ├── Header (if authenticated)
│       └── Page-specific components
```

### Core Components

#### 1. Header Component

**Location**: `components/Header.tsx`

**Purpose**: Navigation bar with user info and logout

**Props**: None (uses AuthContext)

**Features**:
- Displays current user information
- Navigation links to dashboard, applications, API keys
- Logout button
- Responsive mobile menu

**Usage**:
```typescript
import Header from '@/components/Header'

export default function DashboardPage() {
  return (
    <>
      <Header />
      <main>{/* Page content */}</main>
    </>
  )
}
```

#### 2. ApplicationForm Component

**Location**: `components/ApplicationForm.tsx`

**Purpose**: Form for creating or editing applications

**Props**:
```typescript
interface ApplicationFormProps {
  initialData?: ApplicationFormData
  onSubmit: (data: ApplicationFormData) => Promise<void>
  onCancel?: () => void
  isEdit?: boolean
}
```

**Features**:
- Form validation
- Loading states
- Error handling
- Success feedback

#### 3. ApplicationList Component

**Location**: `components/ApplicationList.tsx`

**Purpose**: Display list of applications with actions

**Props**:
```typescript
interface ApplicationListProps {
  applications: ApplicationResponse[]
  onUpdate: () => void
}
```

**Features**:
- Grid/list view of applications
- View, edit, delete actions
- Loading and empty states
- Responsive layout

#### 4. ApiKeyManagement Component

**Location**: `components/ApiKeyManagement.tsx`

**Purpose**: Manage API keys for an application

**Props**:
```typescript
interface ApiKeyManagementProps {
  applicationId: number
}
```

**Features**:
- List existing API keys
- Create new API keys
- Revoke/delete API keys
- Display key metadata (created, expires, last used)
- Copy API key to clipboard

#### 5. SessionExpirationWarning Component

**Location**: `components/SessionExpirationWarning.tsx`

**Purpose**: Warn users about session expiration

**Props**: None (uses AuthContext)

**Features**:
- Modal dialog when session is expiring soon
- Countdown timer
- Extend session button
- Auto-logout on expiration

### Component Design Patterns

#### 1. Container/Presentational Pattern

**Container Components** (Smart):
- Located in `app/` directory
- Manage state and side effects
- Fetch data from API
- Handle business logic

**Presentational Components** (Dumb):
- Located in `components/` directory
- Receive data via props
- Focus on UI rendering
- Minimal logic

#### 2. Composition Pattern

Components are composed together to build complex UIs:

```typescript
// Dashboard page composes multiple components
export default function DashboardPage() {
  return (
    <>
      <Header />
      <main>
        <ApplicationList applications={apps} onUpdate={refresh} />
      </main>
    </>
  )
}
```

#### 3. Render Props Pattern

Used for flexible component composition:

```typescript
<Suspense fallback={<LoadingSpinner />}>
  <ApplicationDetail />
</Suspense>
```

---

## State Management

### Global State (React Context)

#### AuthContext

**Location**: `contexts/AuthContext.tsx`

**Purpose**: Manage authentication state across the application

**State**:
```typescript
interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  session: AuthSession | null
  login: (username: string, password: string) => boolean
  logout: () => void
  refreshSession: () => boolean
  isSessionExpiring: boolean
}
```

**Usage**:
```typescript
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { isAuthenticated, user, logout } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  return <div>Welcome, {user?.username}!</div>
}
```

**Features**:
- Automatic session restoration on page load
- Session expiration detection
- Session extension
- Logout functionality
- Development mode auth bypass

### Local State (useState)

Used for component-specific state:

```typescript
function ApplicationForm() {
  const [formData, setFormData] = useState<ApplicationFormData>({
    App_name: '',
    Application: '',
    Email: '',
    Domain: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ...
}
```

### Server State (API Data)

No dedicated library (like React Query) is used. API data is fetched and stored in local state:

```typescript
function DashboardPage() {
  const [applications, setApplications] = useState<ApplicationResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getApplications()
        setApplications(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // ...
}
```

**Future Enhancement**: Consider React Query or SWR for:
- Automatic caching
- Background refetching
- Optimistic updates
- Request deduplication

---

## Routing & Navigation

### Next.js App Router

The application uses Next.js 15 App Router with file-based routing.

### Route Structure

```
/                           → app/page.tsx (Home/Redirect)
/login                      → app/login/page.tsx
/dashboard                  → app/dashboard/page.tsx
/application?id=123         → app/application/page.tsx
/application/edit?id=123    → app/application/edit/page.tsx
/api_key_management         → app/api_key_management/page.tsx
```

### Query Parameters

Since static export doesn't support dynamic routes, query parameters are used:

```typescript
// Navigate to application detail
import { useRouter } from 'next/navigation'

function ApplicationCard({ app }: { app: ApplicationResponse }) {
  const router = useRouter()

  const handleView = () => {
    router.push(`/application?id=${app.id}`)
  }

  return <button onClick={handleView}>View</button>
}
```

```typescript
// Read query parameters
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ApplicationDetail() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  // Fetch application data using id
  // ...
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ApplicationDetail />
    </Suspense>
  )
}
```

### Protected Routes

Routes are protected using the AuthContext:

```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null // or loading spinner
  }

  return <div>Dashboard content</div>
}
```

### Navigation Methods

```typescript
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Programmatic navigation
const router = useRouter()
router.push('/dashboard')
router.back()
router.refresh()

// Declarative navigation
<Link href="/dashboard">Dashboard</Link>
```

---

## API Integration

### Service Layer Architecture

All API calls are centralized in `services/api.ts`.

### Axios Configuration

```typescript
import axios from 'axios'

// Base URLs from environment variables
const APPS_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://13.221.91.36:80"
const REQUESTOR_BASE_URL = process.env.NEXT_PUBLIC_REQUESTOR_URL || "http://13.221.91.36:80"

// Create axios instances
const api = axios.create({
  baseURL: APPS_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const apiRequestor = axios.create({
  baseURL: REQUESTOR_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})
```

### Request Interceptors

Automatically add authentication token to all requests:

```typescript
api.interceptors.request.use(
  (config) => {
    const token = getSessionToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
```

### Response Interceptors

Handle authentication errors globally:

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired, clear and redirect to login
      clearSession()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
```

### API Functions

#### Application Management

```typescript
// Get all applications
export const getApplications = async (): Promise<ApplicationResponse[]> => {
  const response = await api.get('/apps')
  return response.data
}

// Create application
export const createApplication = async (
  data: ApplicationFormData
): Promise<ApplicationResponse> => {
  const response = await api.post('/app', data)
  const createdApp = response.data

  // Automatically generate API key
  const apiKeyResponse = await api.post(`/app/${createdApp.id}/api-key`, {
    name: `API Key for ${createdApp.name}`,
    expires_at: null,
  })

  return {
    ...createdApp,
    apiKey: apiKeyResponse.data.api_key,
    apiKeyId: apiKeyResponse.data.id,
  }
}

// Update application
export const updateApplication = async (
  id: string,
  data: ApplicationFormData
): Promise<Application> => {
  const response = await api.put(`/app/${id}`, data)
  return response.data
}

// Delete application
export const deleteApplication = async (id: string): Promise<void> => {
  await api.delete(`/app/${id}`)
}
```

#### API Key Management

```typescript
// Get API keys for application
export const getApplicationApiKeys = async (
  applicationId: number
): Promise<APIKeyInfo[]> => {
  const response = await api.get(`/app/${applicationId}/api-keys`)
  return response.data
}

// Create API key
export const createApiKey = async (
  data: ApiCreationFormData
): Promise<APIKeyResponse> => {
  const requestBody = {
    name: data.name || undefined,
    expires_at: data.expires_at || null,
  }

  const response = await api.post(
    `/app/${data.app_id}/api-key`,
    requestBody
  )

  return response.data
}

// Delete API key
export const deleteApiKey = async (
  appId: number,
  keyId: number
): Promise<void> => {
  await api.delete(`/app/${appId}/api-key/${keyId}`)
}
```

#### Notification Requests

```typescript
// Send notification
export const requestNotification = async (
  data: NotificationRequest
): Promise<NotificationResponse> => {
  const response = await apiRequestor.post('/request', data)
  return response.data
}

// Get notifications for application
export const getNotifications = async (
  applicationId: string
): Promise<Notification[]> => {
  const response = await api.get(`/app/${applicationId}/notifications`)
  return response.data
}
```

### Error Handling

All API functions throw errors that should be caught by the calling component:

```typescript
async function handleCreateApplication(data: ApplicationFormData) {
  try {
    setIsLoading(true)
    setError(null)

    const newApp = await createApplication(data)

    // Success handling
    console.log('Application created:', newApp)
    router.push('/dashboard')
  } catch (error: any) {
    // Error handling
    const errorMessage = error.response?.data?.detail || error.message || 'Failed to create application'
    setError(errorMessage)
    console.error('Error creating application:', error)
  } finally {
    setIsLoading(false)
  }
}
```

### Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/apps` | List all applications |
| POST | `/app` | Create new application |
| GET | `/app/:id` | Get application by ID |
| PUT | `/app/:id` | Update application |
| DELETE | `/app/:id` | Delete application |
| GET | `/app/:id/api-keys` | List API keys for application |
| POST | `/app/:id/api-key` | Create API key |
| DELETE | `/app/:id/api-key/:keyId` | Delete API key |
| GET | `/app/:id/notifications` | Get notifications for application |
| POST | `/request` | Send notification request |
| GET | `/health` | Health check endpoint |

---

## Authentication & Authorization

### Authentication Flow

```
1. User enters credentials on /login page
2. Frontend validates credentials (currently hardcoded)
3. On success, create session with JWT token
4. Store session in localStorage
5. Redirect to /dashboard
6. All subsequent API calls include Authorization header
7. Backend validates JWT token
8. On 401 response, clear session and redirect to /login
```

### Current Implementation

**Note**: The current implementation uses hardcoded credentials for demonstration purposes. In production, this should be replaced with a proper backend authentication service.

```typescript
// contexts/AuthContext.tsx
const login = (username: string, password: string): boolean => {
  // ⚠️ DEMO ONLY - Replace with actual API call
  if (username === 'admin' && password === 'admin123') {
    const user: User = {
      username,
      email: 'admin@example.com',
      role: 'admin',
      id: '1',
    }

    const newSession = createSession(user, 'demo-jwt-token')
    saveSession(newSession)
    setSession(newSession)
    setIsAuthenticated(true)
    setUser(user)

    return true
  }

  return false
}
```

### Production Authentication (Recommended)

Replace hardcoded login with API call:

```typescript
const login = async (username: string, password: string): Promise<boolean> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username,
      password,
    })

    const { token, user, expiresIn } = response.data

    const newSession = createSession(user, token, expiresIn)
    saveSession(newSession)
    setSession(newSession)
    setIsAuthenticated(true)
    setUser(user)

    return true
  } catch (error) {
    console.error('Login failed:', error)
    return false
  }
}
```

### Authorization

Currently, all authenticated users have full access. For role-based access control:

```typescript
// Add to AuthContext
const hasPermission = (permission: string): boolean => {
  if (!user) return false

  const rolePermissions = {
    admin: ['create', 'read', 'update', 'delete'],
    editor: ['create', 'read', 'update'],
    viewer: ['read'],
  }

  return rolePermissions[user.role]?.includes(permission) || false
}

// Usage in components
const { hasPermission } = useAuth()

if (hasPermission('delete')) {
  return <button onClick={handleDelete}>Delete</button>
}
```

### Auth Bypass for Development

For development/testing, authentication can be disabled:

```env
# .env.local
NEXT_PUBLIC_DISABLE_AUTH=true
```

This bypasses all authentication checks and allows direct access to all pages.

---

## Session Management

### Session Architecture

The application implements a robust client-side session management system with automatic expiration and renewal.

### Session Data Structure

```typescript
interface AuthSession {
  token: string              // JWT token
  user: User                 // User information
  expiresAt: number         // Unix timestamp (ms)
  refreshToken?: string     // Optional refresh token
  issuedAt: number          // Unix timestamp (ms)
}
```

### Session Lifecycle

```
1. Login → Create session with expiration time
2. Store session in localStorage
3. On page load → Restore session from localStorage
4. Check if session is valid (not expired)
5. If expiring soon (< 5 min) → Show warning
6. User can extend session
7. On expiration → Auto logout and redirect to login
8. On logout → Clear session from localStorage
```

### Session Manager Utilities

**Location**: `utils/sessionManager.ts`

```typescript
// Create new session
export const createSession = (
  user: User,
  token: string,
  expiresIn: number = 3600 // seconds
): AuthSession => {
  const now = Date.now()
  return {
    token,
    user,
    issuedAt: now,
    expiresAt: now + (expiresIn * 1000),
  }
}

// Save session to localStorage
export const saveSession = (session: AuthSession): void => {
  localStorage.setItem('auth_session', JSON.stringify(session))
}

// Get session from localStorage
export const getSessionData = (): SessionData => {
  const stored = localStorage.getItem('auth_session')
  if (!stored) {
    return { session: null, isValid: false, isExpired: false }
  }

  const session: AuthSession = JSON.parse(stored)
  const now = Date.now()
  const isExpired = now >= session.expiresAt
  const isValid = !isExpired

  return { session, isValid, isExpired }
}

// Clear session
export const clearSession = (): void => {
  localStorage.removeItem('auth_session')
}

// Check if session is expiring soon (< 5 minutes)
export const isSessionExpiringSoon = (session: AuthSession): boolean => {
  const now = Date.now()
  const timeRemaining = session.expiresAt - now
  const fiveMinutes = 5 * 60 * 1000

  return timeRemaining > 0 && timeRemaining < fiveMinutes
}

// Extend session
export const extendSession = (session: AuthSession): AuthSession => {
  const now = Date.now()
  const extendedSession = {
    ...session,
    expiresAt: now + (3600 * 1000), // Extend by 1 hour
  }

  saveSession(extendedSession)
  return extendedSession
}
```

### Session Expiration Warning

The `SessionExpirationWarning` component monitors session expiration and displays a warning modal:

```typescript
// components/SessionExpirationWarning.tsx
export default function SessionExpirationWarning() {
  const { isSessionExpiring, refreshSession, logout } = useAuth()
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  useEffect(() => {
    if (isSessionExpiring) {
      const interval = setInterval(() => {
        const session = getSessionData().session
        if (session) {
          const remaining = Math.max(0, session.expiresAt - Date.now())
          setTimeRemaining(remaining)

          if (remaining === 0) {
            logout()
          }
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isSessionExpiring, logout])

  if (!isSessionExpiring) return null

  return (
    <div className="modal">
      <h2>Session Expiring Soon</h2>
      <p>Your session will expire in {formatTime(timeRemaining)}</p>
      <button onClick={refreshSession}>Extend Session</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Session Security Best Practices

1. **Short Expiration Times**: Sessions expire after 1 hour by default
2. **Secure Storage**: Consider using httpOnly cookies instead of localStorage for production
3. **Token Refresh**: Implement refresh token mechanism for seamless renewal
4. **Automatic Cleanup**: Clear session on logout and expiration
5. **HTTPS Only**: Always use HTTPS in production to prevent token interception

---

## Environment Configuration

### Environment Variables

All environment variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

### Available Variables

```env
# Backend API URL (EC2 instance)
NEXT_PUBLIC_API_URL=http://13.221.91.36:80

# Requestor API URL (same as API URL for now)
NEXT_PUBLIC_REQUESTOR_URL=http://13.221.91.36:80

# Development: Disable authentication
NEXT_PUBLIC_DISABLE_AUTH=false
```

### Environment Files

- `.env.local` - Local development (not committed)
- `.env.example` - Template for environment variables
- `.env.production` - Production environment (optional)

### Build-Time vs Runtime

**Important**: Environment variables are embedded at **build time**, not runtime.

```typescript
// This value is replaced at build time
const apiUrl = process.env.NEXT_PUBLIC_API_URL

// After build, the code becomes:
const apiUrl = "http://13.221.91.36:80"
```

**Implications**:
- Must rebuild application when changing environment variables
- Cannot change API URL without rebuilding
- Different builds required for different environments

### Multi-Environment Setup

For different environments (dev, staging, production):

```bash
# Development
cp .env.example .env.local
# Edit .env.local with dev values
npm run build

# Staging
cp .env.example .env.staging
# Edit .env.staging with staging values
npm run build

# Production
cp .env.example .env.production
# Edit .env.production with production values
npm run build
```

### Accessing Environment Variables

```typescript
// In any component or file
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

// Type-safe access
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL: string
      NEXT_PUBLIC_REQUESTOR_URL: string
      NEXT_PUBLIC_DISABLE_AUTH?: string
    }
  }
}
```

---

## Development Workflow

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd YANTECH-YNP01-GitHub-Priv-Repo-FrontEnd

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your backend URL
# NEXT_PUBLIC_API_URL=http://your-ec2-ip:80

# Start development server
npm run dev
```

### Development Server

```bash
npm run dev
```

- Runs on `http://localhost:3000`
- Hot module replacement (HMR) enabled
- Fast refresh for React components
- TypeScript type checking in IDE

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### TypeScript Type Checking

```bash
# Check types
npx tsc --noEmit
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
```

### Commit Message Convention

Follow conventional commits:

```
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: update dependencies
```

### Code Review Checklist

- [ ] Code follows TypeScript best practices
- [ ] Components are properly typed
- [ ] No console.log statements (use proper logging)
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Responsive design tested
- [ ] Accessibility considerations
- [ ] No hardcoded values (use environment variables)
- [ ] Comments for complex logic
- [ ] ESLint passes with no errors

---

## Build & Deployment

### Build Process

```bash
# Build static export
npm run build
```

**Output**: `out/` directory containing:
- Static HTML files for each page
- Optimized JavaScript bundles
- CSS files
- Static assets (images, fonts, etc.)

### Build Configuration

**next.config.ts**:
```typescript
const nextConfig: NextConfig = {
  output: "export",              // Enable static export
  images: { unoptimized: true }, // Disable Image Optimization API
  trailingSlash: true,           // Add trailing slashes to URLs
}
```

### Deployment to AWS S3

#### Step 1: Build Application

```bash
npm run build
```

#### Step 2: Create S3 Bucket

```bash
aws s3 mb s3://your-app-bucket-name
```

#### Step 3: Enable Static Website Hosting

```bash
aws s3 website s3://your-app-bucket-name \
  --index-document index.html \
  --error-document 404.html
```

#### Step 4: Set Bucket Policy

Update `bucket-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-app-bucket-name/*"
    }
  ]
}
```

Apply policy:
```bash
aws s3api put-bucket-policy \
  --bucket your-app-bucket-name \
  --policy file://bucket-policy.json
```

#### Step 5: Deploy Files

```bash
# Using npm script
npm run deploy:s3

# Or manually
aws s3 sync out/ s3://your-app-bucket-name --delete
```

#### Step 6: Access Application

```
http://your-app-bucket-name.s3-website-us-east-1.amazonaws.com
```

### CloudFront CDN Setup (Optional)

#### Benefits
- HTTPS support with free SSL certificate
- Custom domain names
- Global CDN with edge caching
- Better performance and lower latency
- DDoS protection

#### Setup

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name your-app-bucket-name.s3-website-us-east-1.amazonaws.com \
  --default-root-object index.html
```

#### Configure Custom Error Pages

In CloudFront console:
- Error Code: 403 → Response Page: `/index.html` → Response Code: 200
- Error Code: 404 → Response Page: `/index.html` → Response Code: 200

This enables client-side routing to work properly.

### CI/CD Pipeline (Recommended)

#### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to S3

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
          NEXT_PUBLIC_REQUESTOR_URL: ${{ secrets.REQUESTOR_URL }}

      - name: Deploy to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --delete
        env:
          AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: 'us-east-1'
          SOURCE_DIR: 'out'
```

### Deployment Checklist

- [ ] Update environment variables in `.env.local`
- [ ] Run `npm run build` successfully
- [ ] Test build locally (serve `out/` directory)
- [ ] Verify backend CORS configuration
- [ ] Update S3 bucket policy if needed
- [ ] Deploy to S3
- [ ] Test application in browser
- [ ] Verify API calls work correctly
- [ ] Test authentication flow
- [ ] Check CloudFront cache invalidation (if using CDN)

---

## Testing Strategy

### Current State

The application currently does not have automated tests. This section outlines a recommended testing strategy.

### Recommended Testing Approach

#### 1. Unit Tests (Jest + React Testing Library)

**Setup**:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Example Test**:
```typescript
// components/__tests__/Header.test.tsx
import { render, screen } from '@testing-library/react'
import Header from '../Header'
import { AuthProvider } from '@/contexts/AuthContext'

describe('Header', () => {
  it('renders user information when authenticated', () => {
    render(
      <AuthProvider>
        <Header />
      </AuthProvider>
    )

    expect(screen.getByText(/admin/i)).toBeInTheDocument()
  })
})
```

#### 2. Integration Tests

Test component interactions and API calls:

```typescript
// app/dashboard/__tests__/page.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import DashboardPage from '../page'
import { getApplications } from '@/services/api'

jest.mock('@/services/api')

describe('DashboardPage', () => {
  it('loads and displays applications', async () => {
    const mockApps = [
      { id: 1, name: 'App 1', application_id: 'app1' },
      { id: 2, name: 'App 2', application_id: 'app2' },
    ]

    ;(getApplications as jest.Mock).mockResolvedValue(mockApps)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('App 1')).toBeInTheDocument()
      expect(screen.getByText('App 2')).toBeInTheDocument()
    })
  })
})
```

#### 3. E2E Tests (Playwright or Cypress)

**Setup Playwright**:
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Example E2E Test**:
```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test('user can login and view dashboard', async ({ page }) => {
  await page.goto('http://localhost:3000')

  await page.fill('input[name="username"]', 'admin')
  await page.fill('input[name="password"]', 'admin123')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL(/dashboard/)
  await expect(page.locator('h1')).toContainText('Dashboard')
})
```

#### 4. API Mocking (MSW)

Mock API responses for testing:

```bash
npm install --save-dev msw
```

```typescript
// mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.get('http://13.221.91.36:80/apps', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, name: 'Test App', application_id: 'test' },
      ])
    )
  }),
]
```

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage for utilities and components
- **Integration Tests**: Critical user flows (login, create app, manage keys)
- **E2E Tests**: Happy path scenarios

---

## Performance Optimization

### Current Optimizations

#### 1. Static Export
- Pre-rendered HTML pages
- No server-side processing
- Fast initial page load

#### 2. Code Splitting
- Automatic code splitting by Next.js
- Each page loads only required JavaScript
- Lazy loading for components

#### 3. Tailwind CSS Purging
- Unused CSS classes removed in production
- Minimal CSS bundle size

#### 4. Image Optimization
- Currently disabled (`unoptimized: true`)
- Consider using next/image with external image optimization service

### Recommended Optimizations

#### 1. Implement React.lazy for Large Components

```typescript
import { lazy, Suspense } from 'react'

const ApplicationForm = lazy(() => import('@/components/ApplicationForm'))

function CreateApplicationPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ApplicationForm />
    </Suspense>
  )
}
```

#### 2. Memoization for Expensive Computations

```typescript
import { useMemo } from 'react'

function ApplicationList({ applications }) {
  const sortedApps = useMemo(() => {
    return applications.sort((a, b) => a.name.localeCompare(b.name))
  }, [applications])

  return <div>{/* render sortedApps */}</div>
}
```

#### 3. Debounce Search Inputs

```typescript
import { useState, useCallback } from 'react'
import { debounce } from 'lodash'

function SearchBar() {
  const [query, setQuery] = useState('')

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      // Perform search
      console.log('Searching for:', value)
    }, 300),
    []
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    debouncedSearch(value)
  }

  return <input value={query} onChange={handleChange} />
}
```

#### 4. Implement Request Caching

Consider using React Query or SWR:

```typescript
import useSWR from 'swr'
import { getApplications } from '@/services/api'

function DashboardPage() {
  const { data, error, isLoading } = useSWR('/apps', getApplications, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  })

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage />

  return <ApplicationList applications={data} />
}
```

### Performance Monitoring

#### Web Vitals

Monitor Core Web Vitals:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

---

## Security Considerations

### Current Security Measures

#### 1. Client-Side Authentication
- JWT tokens stored in localStorage
- Automatic session expiration
- Session timeout warnings
- Logout on token expiration

#### 2. HTTPS Communication
- CloudFront provides HTTPS for frontend
- Backend should use HTTPS in production

#### 3. CORS Configuration
- Backend restricts origins to S3/CloudFront domain
- Credentials included in requests

#### 4. Input Validation
- Form validation on client-side
- Backend should validate all inputs

### Security Vulnerabilities & Mitigations

#### 1. XSS (Cross-Site Scripting)

**Risk**: Malicious scripts injected through user input

**Mitigation**:
- React automatically escapes JSX content
- Avoid using `dangerouslySetInnerHTML`
- Sanitize user input before rendering
- Use Content Security Policy (CSP) headers

```typescript
// Bad
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// Good
<div>{userInput}</div>
```

#### 2. localStorage Security

**Risk**: Tokens accessible to JavaScript (XSS vulnerability)

**Mitigation**:
- Use httpOnly cookies for production (requires backend support)
- Implement short token expiration times
- Clear tokens on logout
- Consider using secure, httpOnly cookies instead

**Production Recommendation**:
```typescript
// Backend sets httpOnly cookie
res.cookie('auth_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000, // 1 hour
})

// Frontend doesn't need to handle token storage
// Browser automatically includes cookie in requests
```

#### 3. CSRF (Cross-Site Request Forgery)

**Risk**: Unauthorized requests from malicious sites

**Mitigation**:
- Use CSRF tokens for state-changing operations
- Verify Origin/Referer headers on backend
- Use SameSite cookie attribute

```typescript
// Backend generates CSRF token
const csrfToken = generateCSRFToken()
res.cookie('csrf_token', csrfToken, { sameSite: 'strict' })

// Frontend includes CSRF token in requests
axios.post('/app', data, {
  headers: {
    'X-CSRF-Token': getCookie('csrf_token'),
  },
})
```

#### 4. API Key Exposure

**Risk**: API keys visible in browser

**Current**: API keys are only shown once during creation

**Best Practice**:
- Never log API keys
- Mask keys in UI (show only last 4 characters)
- Implement key rotation
- Monitor key usage

#### 5. Sensitive Data in Environment Variables

**Risk**: Secrets committed to version control

**Mitigation**:
- Never commit `.env.local` to Git
- Use `.env.example` as template
- Use secrets management service (AWS Secrets Manager, HashiCorp Vault)
- Rotate credentials regularly

### Security Headers

Implement security headers on CloudFront or S3:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Security Checklist

- [ ] HTTPS enabled (CloudFront)
- [ ] CORS properly configured on backend
- [ ] Input validation on all forms
- [ ] XSS protection (React escaping)
- [ ] CSRF tokens for state-changing operations
- [ ] Secure session management
- [ ] API keys properly handled
- [ ] Environment variables not committed
- [ ] Security headers configured
- [ ] Regular dependency updates
- [ ] Authentication timeout enforced
- [ ] Error messages don't leak sensitive info

---

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Build Errors

**Error**: `useSearchParams() should be wrapped in a suspense boundary`

**Solution**:
```typescript
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function MyComponent() {
  const searchParams = useSearchParams()
  // ...
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MyComponent />
    </Suspense>
  )
}
```

**Error**: `Error: Image Optimization using the default loader is not compatible with export`

**Solution**: Already configured in `next.config.ts`:
```typescript
images: { unoptimized: true }
```

#### 2. CORS Errors

**Error**: `Access to fetch at 'http://...' has been blocked by CORS policy`

**Cause**: Backend not configured to accept requests from S3/CloudFront origin

**Solution**: Configure CORS on backend:

```python
# FastAPI example
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-cloudfront-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Test CORS**:
```bash
curl -H "Origin: https://your-cloudfront-domain.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://your-backend-url:80/apps
```

#### 3. 404 on Page Refresh

**Problem**: Refreshing `/application?id=123` returns 404

**Cause**: S3 doesn't know how to handle client-side routes

**Solution**: Configure CloudFront custom error pages:
- Error Code: 403 → Response Page: `/index.html` → Response Code: 200
- Error Code: 404 → Response Page: `/index.html` → Response Code: 200

#### 4. Environment Variables Not Working

**Problem**: `process.env.NEXT_PUBLIC_API_URL` is undefined

**Solutions**:
1. Ensure variable name starts with `NEXT_PUBLIC_`
2. Restart dev server after adding `.env.local`
3. Rebuild application (`npm run build`)
4. Verify `.env.local` is in project root directory
5. Check for typos in variable names

#### 5. Authentication Loop

**Problem**: Redirects between login and dashboard infinitely

**Cause**: Session not being saved or restored properly

**Debug**:
```typescript
// Check localStorage
console.log('Session:', localStorage.getItem('auth_session'))

// Check session validity
import { getSessionData } from '@/utils/sessionManager'
console.log('Session data:', getSessionData())
```

**Solution**:
- Clear localStorage: `localStorage.clear()`
- Check browser console for errors
- Verify session creation logic

#### 6. API Calls Failing

**Problem**: All API calls return 401 Unauthorized

**Cause**: Token not being sent or invalid

**Debug**:
```typescript
// Check if token is being sent
api.interceptors.request.use((config) => {
  console.log('Request headers:', config.headers)
  return config
})
```

**Solution**:
- Verify token exists in localStorage
- Check token format (should be JWT)
- Verify backend is validating token correctly
- Check token expiration

#### 7. Slow Build Times

**Problem**: `npm run build` takes too long

**Solutions**:
1. Clear `.next` cache: `rm -rf .next`
2. Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Disable source maps in production (already default)
4. Use `npm ci` instead of `npm install` for faster installs

#### 8. S3 Deployment Issues

**Problem**: Files uploaded but site not accessible

**Checklist**:
- [ ] Static website hosting enabled on bucket
- [ ] Bucket policy allows public read access
- [ ] Index document set to `index.html`
- [ ] Error document set to `404.html` or `index.html`
- [ ] Correct region in S3 website URL

**Verify**:
```bash
# Check bucket website configuration
aws s3api get-bucket-website --bucket your-bucket-name

# Check bucket policy
aws s3api get-bucket-policy --bucket your-bucket-name
```

### Debugging Tools

#### 1. React Developer Tools
- Install browser extension
- Inspect component tree
- View props and state
- Profile performance

#### 2. Network Tab
- Monitor API requests
- Check request/response headers
- Verify CORS headers
- Check response status codes

#### 3. Console Logging
```typescript
// API service logging
console.log('[getApplications] Sending request')
console.log('[getApplications] Response:', response.data)
console.error('[getApplications] Error:', error)
```

#### 4. Source Maps
- Enabled in development
- Map minified code to source
- Debug production builds locally

---

## Best Practices

### Code Organization

1. **One component per file**
2. **Group related files together**
3. **Use index files for exports**
4. **Separate business logic from UI**
5. **Keep components small and focused**

### TypeScript

1. **Always define types for props**
```typescript
interface MyComponentProps {
  title: string
  count: number
  onUpdate: () => void
}

function MyComponent({ title, count, onUpdate }: MyComponentProps) {
  // ...
}
```

2. **Use type inference when possible**
```typescript
// Good
const [count, setCount] = useState(0) // inferred as number

// Unnecessary
const [count, setCount] = useState<number>(0)
```

3. **Avoid `any` type**
```typescript
// Bad
function handleData(data: any) { }

// Good
function handleData(data: ApplicationResponse) { }
```

### React

1. **Use functional components**
2. **Prefer hooks over class components**
3. **Extract custom hooks for reusable logic**
```typescript
// Custom hook
function useApplications() {
  const [apps, setApps] = useState<ApplicationResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchApps() {
      const data = await getApplications()
      setApps(data)
      setIsLoading(false)
    }
    fetchApps()
  }, [])

  return { apps, isLoading }
}

// Usage
function DashboardPage() {
  const { apps, isLoading } = useApplications()
  // ...
}
```

4. **Memoize expensive computations**
5. **Use proper dependency arrays in useEffect**

### Styling

1. **Use Tailwind utility classes**
2. **Create reusable component classes**
```typescript
const buttonClasses = "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
```

3. **Use consistent spacing scale**
4. **Mobile-first responsive design**

### Error Handling

1. **Always handle errors in async functions**
```typescript
async function fetchData() {
  try {
    const data = await getApplications()
    setData(data)
  } catch (error) {
    console.error('Failed to fetch:', error)
    setError('Failed to load applications')
  }
}
```

2. **Display user-friendly error messages**
3. **Log errors for debugging**
4. **Implement error boundaries for React errors**

### Performance

1. **Lazy load components when appropriate**
2. **Debounce user input**
3. **Memoize expensive computations**
4. **Optimize images**
5. **Code split by route**

---

## Future Enhancements

### Short-Term (1-3 months)

1. **Implement Proper Backend Authentication**
   - Replace hardcoded credentials
   - JWT token generation on backend
   - Refresh token mechanism
   - Password reset functionality

2. **Add Automated Tests**
   - Unit tests for components
   - Integration tests for API calls
   - E2E tests for critical flows

3. **Improve Error Handling**
   - Global error boundary
   - Toast notifications for errors
   - Retry mechanism for failed requests

4. **Add Loading States**
   - Skeleton screens
   - Progress indicators
   - Optimistic UI updates

5. **Implement Search and Filtering**
   - Search applications by name
   - Filter by status, date created
   - Sort by various fields

### Medium-Term (3-6 months)

1. **Role-Based Access Control (RBAC)**
   - Admin, Editor, Viewer roles
   - Permission-based UI rendering
   - Backend authorization

2. **Notification History**
   - View sent notifications
   - Filter by application, date, status
   - Resend failed notifications

3. **Analytics Dashboard**
   - Notification statistics
   - API key usage metrics
   - Application performance

4. **Audit Logging**
   - Track all user actions
   - View audit trail
   - Export audit logs

5. **Multi-Language Support (i18n)**
   - English, Spanish, French
   - User language preference
   - RTL support

### Long-Term (6-12 months)

1. **Advanced API Key Management**
   - Key rotation
   - Usage limits and quotas
   - Rate limiting per key
   - Key scopes and permissions

2. **Webhook Support**
   - Configure webhooks for events
   - Webhook delivery logs
   - Retry failed webhooks

3. **Template Management**
   - Email/SMS templates
   - Template variables
   - Template versioning

4. **Batch Operations**
   - Bulk create applications
   - Bulk send notifications
   - Import/export data

5. **Mobile Application**
   - React Native app
   - Push notifications
   - Offline support

### Technical Debt

1. **Migrate to httpOnly Cookies**
   - More secure than localStorage
   - Requires backend changes

2. **Implement React Query**
   - Better server state management
   - Automatic caching and refetching

3. **Add Storybook**
   - Component documentation
   - Visual testing
   - Design system

4. **Improve TypeScript Coverage**
   - Stricter type checking
   - Remove any types
   - Better type inference

5. **Performance Optimization**
   - Implement virtual scrolling for large lists
   - Image optimization
   - Bundle size reduction

---

## Conclusion

This technical documentation provides a comprehensive overview of the Notification System Admin Frontend application. It covers architecture decisions, implementation details, development workflows, and best practices.

### Key Takeaways

1. **Static Export Architecture**: The application uses Next.js static export for cost-effective, scalable hosting on AWS S3
2. **Decoupled Frontend/Backend**: Frontend makes direct API calls to backend EC2 instance
3. **Client-Side State Management**: React Context API for authentication, local state for components
4. **Security Considerations**: Multiple layers of security with room for improvement
5. **Development Workflow**: Modern tooling with TypeScript, ESLint, and Git workflow

### Getting Help

- **README.md**: Quick start guide and deployment instructions
- **S3_DEPLOYMENT_GUIDE.md**: Detailed S3 deployment steps
- **SESSION_MANAGEMENT.md**: Session architecture details
- **GitHub Issues**: Report bugs and request features
- **Team Chat**: Ask questions and get support

### Contributing

When contributing to this project:
1. Read this documentation thoroughly
2. Follow the established patterns and conventions
3. Write tests for new features
4. Update documentation for significant changes
5. Submit pull requests for review

---

**Last Updated**: 2025-11-19
**Version**: 1.0.0
**Maintainer**: Cloud Heroes Africa Team







