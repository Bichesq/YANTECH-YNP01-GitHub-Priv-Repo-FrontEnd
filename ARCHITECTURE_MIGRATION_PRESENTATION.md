# Next.js Application Migration: Docker Container to AWS S3 Static Hosting

## Architectural Transformation Presentation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Before State - Docker Container Deployment](#before-state---docker-container-deployment)
3. [Structural Changes Made](#structural-changes-made)
4. [After State - S3 Static Hosting](#after-state---s3-static-hosting)
5. [Benefits and Trade-offs](#benefits-and-trade-offs)
6. [Deployment Process](#deployment-process)
7. [Technical Requirements](#technical-requirements)

---

## Executive Summary

This presentation documents the architectural migration of a Next.js application from a **server-based Docker container deployment** to a **serverless AWS S3 static hosting** solution.

### Key Transformation
- **From:** Node.js server runtime with server-side features
- **To:** Pure static HTML/CSS/JS files hosted on AWS S3
- **Result:** Reduced infrastructure complexity, lower costs, improved scalability

---

## Before State - Docker Container Deployment

### 1. Next.js Configuration (`next.config.ts`)

The application was configured for **standalone server deployment**:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",  // ← Generates Node.js server bundle
  
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'http://100.26.23.64:80/:path*',  // EC2 Instance 1
      },
      {
        source: '/api/requestor/:path*',
        destination: 'http://54.196.198.21:80/:path*',  // EC2 Instance 2
      },
    ];
  },
};

export default nextConfig;
```

**Key Characteristics:**
- ✅ Required Node.js runtime environment
- ✅ Server-side request proxying to backend services
- ✅ No CORS issues (same-origin requests)
- ❌ Required container orchestration (Docker)
- ❌ Higher infrastructure costs

---

### 2. Server-Side API Routes

The application included **server-side API routes** that executed on the Node.js server:

#### `/app/api/proxy/[...path]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Server-side proxy logic
  const response = await fetch(`http://100.26.23.64:80${path}`);
  return NextResponse.json(await response.json());
}

export async function POST(request: NextRequest) {
  // Server-side proxy logic
  // ...
}
```

#### `/app/api/health/route.ts`
```typescript
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
```

**Purpose:**
- Proxy requests to backend EC2 instances
- Avoid CORS issues by keeping requests same-origin
- Handle authentication tokens server-side

---

### 3. Dynamic Route Segments

The application used **Next.js dynamic routes** with file-based routing:

```
app/
├── application/
│   └── [id]/
│       ├── page.tsx          # /application/123
│       ├── layout.tsx
│       └── edit/
│           └── page.tsx      # /application/123/edit
```

#### `app/application/[id]/page.tsx`
```typescript
'use client'

import { useParams } from 'next/navigation'

export default function ApplicationDetailPage() {
  const params = useParams()
  const id = params.id  // ← Dynamic route parameter
  
  // Fetch application data using id
  // ...
}
```

**Navigation:**
```typescript
// In ApplicationList.tsx
router.push(`/application/${app.Application}`)
router.push(`/application/${app.Application}/edit`)
```

---

### 4. API Service Configuration

API calls were made to **local proxy endpoints**:

#### `services/api.ts` (Before)
```typescript
const APPS_BASE_URL = "/api/proxy";
const REQUESTOR_BASE_URL = "/api/requestor";

export const getApplications = async () => {
  const response = await axios.get(`${APPS_BASE_URL}/applications`);
  return response.data;
};
```

**Request Flow:**
```
Browser → /api/proxy/applications → Next.js Server → http://100.26.23.64:80/applications
```

---

### 5. Deployment Architecture (Before)

```
┌─────────────────────────────────────────────────┐
│           Docker Container                      │
│  ┌──────────────────────────────────────────┐  │
│  │      Next.js Node.js Server              │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │  Server-Side Features:             │  │  │
│  │  │  • API Routes (/api/proxy/*)       │  │  │
│  │  │  • Rewrites (proxy to EC2)         │  │  │
│  │  │  • Dynamic Routes ([id])           │  │  │
│  │  │  • Image Optimization              │  │  │
│  │  └────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │   EC2 Backend APIs    │
        │  • 100.26.23.64:80    │
        │  • 54.196.198.21:80   │
        └───────────────────────┘
```

**Infrastructure Requirements:**
- Docker runtime environment
- Container orchestration (ECS, Kubernetes, or Docker Compose)
- Load balancer for scaling
- Persistent compute resources (always running)

---

## Structural Changes Made

### Change 1: Next.js Configuration Update

#### `next.config.ts` (After)
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",  // ← Changed from "standalone" to "export"
  
  images: {
    unoptimized: true,  // ← Added: Disable Next.js Image Optimization API
  },
  
  trailingSlash: true,  // ← Added: Better S3 compatibility
  
  // ❌ Removed: rewrites() function (not supported in static export)
  // ❌ Removed: Server-side features
};

export default nextConfig;
```

**Impact:**
- Generates static HTML/CSS/JS files in `out/` directory
- No Node.js server required
- All pages pre-rendered at build time

---

### Change 2: Removed Server-Side API Routes

**Deleted directories:**
```bash
❌ app/api/proxy/[...path]/route.ts
❌ app/api/health/route.ts
```

**Rationale:**
- API routes require Node.js server runtime
- Not compatible with static export (`output: "export"`)
- Replaced with direct backend API calls from browser

---

### Change 3: Updated API Service Configuration

#### `services/api.ts` (After)
```typescript
// Call backend services directly (requires CORS configuration on backend)
const APPS_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://100.26.23.64:80";
const REQUESTOR_BASE_URL = process.env.NEXT_PUBLIC_REQUESTOR_URL || "http://54.196.198.21:80";

export const getApplications = async () => {
  const response = await axios.get(`${APPS_BASE_URL}/applications`);
  return response.data;
};
```

**Key Changes:**
- ✅ Direct calls to EC2 backend services
- ✅ Environment variables for configuration (`NEXT_PUBLIC_*`)
- ⚠️ Requires CORS configuration on backend servers

**New Request Flow:**
```
Browser → http://100.26.23.64:80/applications (Direct CORS request)
```

---

### Change 4: Refactored Dynamic Routes to Query Parameters

#### New Directory Structure
```
app/
├── application/
│   ├── page.tsx          # /application?id=123
│   └── edit/
│       └── page.tsx      # /application/edit?id=123
```

#### `app/application/page.tsx` (After)
```typescript
'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ApplicationDetailContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')  // ← Query parameter instead of route param
  
  if (!id) {
    router.push("/dashboard");
    return null;
  }
  
  // Fetch application data using id
  // ...
}

export default function ApplicationDetailPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ApplicationDetailContent />
    </Suspense>
  );
}
```

**Why Suspense?**
- Next.js requires `useSearchParams()` to be wrapped in `<Suspense>` for static export
- Prevents build-time errors during static generation

---

### Change 5: Updated Navigation Calls

#### `components/ApplicationList.tsx` (Before)
```typescript
const handleViewDetails = (app: Application) => {
  router.push(`/application/${app.Application}`);
};

const handleEdit = (app: Application) => {
  router.push(`/application/${app.Application}/edit`);
};
```

#### `components/ApplicationList.tsx` (After)
```typescript
const handleViewDetails = (app: Application) => {
  router.push(`/application?id=${app.Application}`);  // ← Query parameter
};

const handleEdit = (app: Application) => {
  router.push(`/application/edit?id=${app.Application}`);  // ← Query parameter
};
```

---

### Change 6: Environment Variables Configuration

#### `.env.local` (Production)
```bash
NEXT_PUBLIC_API_URL=http://100.26.23.64:80
NEXT_PUBLIC_REQUESTOR_URL=http://54.196.198.21:80
```

**Important Notes:**
- ⚠️ `NEXT_PUBLIC_*` prefix required for browser access
- ⚠️ Values are embedded at **build time** (not runtime)
- ⚠️ Must rebuild application when changing environment variables

---

## After State - S3 Static Hosting

### 1. Build Output

Running `npm run build` now generates a static `out/` directory:

```bash
$ npm run build

✓ Generating static pages (9/9)
✓ Exporting (3/3)
✓ Finalizing page optimization

Route (app)                                 Size  First Load JS
┌ ○ /                                      758 B         101 kB
├ ○ /api_key_management                  2.46 kB         130 kB
├ ○ /application                         3.35 kB         128 kB
├ ○ /application/edit                    2.71 kB         127 kB
├ ○ /dashboard                            3.6 kB         131 kB
└ ○ /login                               2.48 kB         105 kB

○  (Static)  prerendered as static content
```

**Output Directory Structure:**
```
out/
├── _next/
│   ├── static/
│   │   ├── chunks/
│   │   └── css/
├── application/
│   ├── index.html
│   └── edit/
│       └── index.html
├── dashboard/
│   └── index.html
├── login/
│   └── index.html
├── index.html
└── 404.html
```

---

### 2. Deployment Architecture (After)

```
┌─────────────────────────────────────────────────┐
│              AWS S3 Bucket                      │
│         (Static Website Hosting)                │
│  ┌──────────────────────────────────────────┐  │
│  │  Static Files:                           │  │
│  │  • HTML pages (pre-rendered)             │  │
│  │  • CSS bundles                           │  │
│  │  • JavaScript bundles                    │  │
│  │  • Images & assets                       │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │  CloudFront CDN       │
        │  (Optional)           │
        │  • HTTPS              │
        │  • Custom Domain      │
        │  • Global Edge Cache  │
        └───────────────────────┘
                    ↓
            ┌───────────────┐
            │   Browser     │
            └───────────────┘
                    ↓ (Direct CORS requests)
        ┌───────────────────────┐
        │   EC2 Backend APIs    │
        │  • 100.26.23.64:80    │
        │  • 54.196.198.21:80   │
        │  (CORS enabled)       │
        └───────────────────────┘
```

---

### 3. Client-Side Rendering Flow

All pages are now **fully client-side rendered**:

```
1. User visits https://your-app.s3-website.amazonaws.com/application?id=123
2. S3 serves static /application/index.html
3. Browser loads React/Next.js JavaScript bundles
4. JavaScript executes:
   - Reads query parameter: id=123
   - Checks authentication (localStorage)
   - Makes direct API call to http://100.26.23.64:80/applications
5. Backend responds with data (CORS headers required)
6. React renders the UI with fetched data
```

---

## Benefits and Trade-offs

### ✅ Benefits

#### 1. **Significantly Lower Hosting Costs**
- **Before:** EC2/ECS container running 24/7 (~$30-100/month)
- **After:** S3 storage + data transfer (~$1-5/month for typical traffic)
- **Savings:** 90-95% reduction in hosting costs

#### 2. **Infinite Scalability**
- S3 automatically scales to handle any traffic volume
- No need to manage load balancers or auto-scaling groups
- CloudFront CDN provides global edge caching

#### 3. **Simpler Deployment**
- No container orchestration required
- No server maintenance or patching
- Simple deployment: `aws s3 sync out/ s3://bucket-name`

#### 4. **Better Performance (with CloudFront)**
- Static files served from global edge locations
- Reduced latency for users worldwide
- Cached at CDN edge for faster delivery

#### 5. **Higher Availability**
- S3 provides 99.99% availability SLA
- No single point of failure
- No server downtime for deployments

---

### ⚠️ Trade-offs

#### 1. **Requires CORS Configuration on Backend**

Backend EC2 services must add CORS headers:

```javascript
// Express.js example
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://your-cloudfront-domain.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
```

#### 2. **No Server-Side Rendering (SSR)**
- All pages are pre-rendered at build time
- No dynamic server-side data fetching
- SEO may be impacted for dynamic content (mitigated by client-side rendering)

#### 3. **No API Routes**
- Cannot have server-side API endpoints
- All API logic must be in separate backend services
- Cannot hide API keys or secrets (must use backend authentication)

#### 4. **Images Are Unoptimized**
- Next.js Image Optimization API not available
- Must manually optimize images before deployment
- Or use external image CDN (Cloudinary, Imgix)

#### 5. **Environment Variables Baked at Build Time**
- Cannot change configuration without rebuilding
- Need separate builds for different environments
- Runtime configuration requires alternative approaches

---

## Deployment Process

### Step 1: Configure Environment Variables

Create `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://100.26.23.64:80
NEXT_PUBLIC_REQUESTOR_URL=http://54.196.198.21:80
```

### Step 2: Build Static Files

```bash
npm run build
```

This generates the `out/` directory with all static files.

### Step 3: Configure S3 Bucket

```bash
# Create S3 bucket
aws s3 mb s3://your-app-bucket-name

# Enable static website hosting
aws s3 website s3://your-app-bucket-name \
  --index-document index.html \
  --error-document 404.html

# Set bucket policy for public read access
aws s3api put-bucket-policy \
  --bucket your-app-bucket-name \
  --policy file://bucket-policy.json
```

**bucket-policy.json:**
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

### Step 4: Deploy to S3

```bash
# Sync files to S3
aws s3 sync out/ s3://your-app-bucket-name --delete

# Or use npm script
npm run deploy:s3
```

### Step 5: (Optional) Configure CloudFront

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name your-app-bucket-name.s3-website-us-east-1.amazonaws.com \
  --default-root-object index.html
```

**Benefits of CloudFront:**
- HTTPS support with ACM certificate
- Custom domain names
- Global CDN with edge caching
- Better performance and lower latency

---

## Technical Requirements

### Backend CORS Configuration

Your EC2 backend services **must** be configured to accept CORS requests:

**Required Headers:**
```
Access-Control-Allow-Origin: https://your-cloudfront-domain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

**Testing CORS:**
```bash
curl -H "Origin: https://your-cloudfront-domain.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://100.26.23.64:80/applications
```

---

## Summary

### Migration Checklist

- [x] Changed `output: "standalone"` to `output: "export"` in next.config.ts
- [x] Added `images: { unoptimized: true }` configuration
- [x] Removed `rewrites()` function from next.config.ts
- [x] Deleted all server-side API routes (`/app/api/*`)
- [x] Updated `services/api.ts` to call EC2 backends directly
- [x] Refactored dynamic routes (`[id]`) to query parameters (`?id=`)
- [x] Updated all navigation calls to use query parameters
- [x] Wrapped `useSearchParams()` in Suspense boundaries
- [x] Successfully built static export (`npm run build`)
- [x] Generated `out/` directory with static files
- [ ] Configure CORS on backend EC2 services
- [ ] Deploy to AWS S3
- [ ] (Optional) Configure CloudFront CDN
- [ ] (Optional) Set up custom domain with Route 53

### Key Takeaways

1. **Architectural Shift:** From server-based to serverless static hosting
2. **Cost Reduction:** 90-95% lower hosting costs
3. **Simplified Operations:** No server maintenance required
4. **Trade-off:** Requires CORS configuration on backend
5. **Deployment:** Simple `aws s3 sync` command

---

## Questions?

For detailed deployment instructions, see:
- `S3_DEPLOYMENT_GUIDE.md` - Complete AWS S3 deployment guide
- `README.md` - Application documentation

**Contact:** [Your Team/Contact Information]

---

*End of Presentation*

