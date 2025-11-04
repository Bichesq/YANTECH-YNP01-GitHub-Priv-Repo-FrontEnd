# Admin Frontend - Next.js

Modern React frontend built with Next.js 15, TypeScript, and Tailwind CSS for the Notification System Admin service.

**Deployment Architecture:** Static export hosted on AWS S3 with optional CloudFront CDN

## ✨ Features

- **Modern Stack**: Next.js 15 with App Router, React 19, TypeScript, ESLint
- **Elegant UI**: Tailwind CSS with custom design system
- **Authentication**: Secure admin login system with JWT tokens
- **Application Management**: Create, view, edit, and delete applications
- **AWS Integration**: Automatic SES and SNS resource configuration
- **API Key Management**: Generate and manage API keys for applications
- **Notification Tracking**: Real-time notification history and status
- **Responsive Design**: Mobile-first responsive layout
- **Static Export**: Optimized for AWS S3 static hosting
- **Serverless Architecture**: No server runtime required, reduced costs by 90-95%

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://your-backend-api-url:80
NEXT_PUBLIC_REQUESTOR_URL=http://your-requestor-api-url:80
```

**Important:**
- Variables must use the `NEXT_PUBLIC_` prefix to be accessible in the browser
- These values are embedded at build time, not runtime
- Update these URLs to point to your backend EC2 instances

3. **Start development server:**
```bash
npm run dev
```

4. **Open browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

## 🏗️ Project Structure

```
├── app/                      # Next.js App Router
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── login/               # Login page
│   ├── dashboard/           # Dashboard page
│   ├── application/         # Application pages (query-based routing)
│   │   ├── page.tsx         # Detail page (/application?id=123)
│   │   └── edit/
│   │       └── page.tsx     # Edit page (/application/edit?id=123)
│   └── api_key_management/  # API key management page
├── components/              # Reusable components
│   ├── Header.tsx
│   ├── ApplicationForm.tsx
│   ├── ApplicationList.tsx
│   └── ApiKeyManagement.tsx
├── contexts/                # React contexts
│   └── AuthContext.tsx
├── services/                # API services
│   └── api.ts              # Direct backend API calls
├── types/                   # TypeScript types
│   └── index.ts
├── bucket-policy.json       # S3 bucket policy template
├── next.config.ts           # Next.js configuration (static export)
└── .env.local              # Environment variables (not committed)
```

**Key Changes from Previous Architecture:**
- Removed `/app/api/` directory (no server-side API routes)
- Changed from dynamic routes `[id]` to query parameters `?id=`
- All API calls now go directly to backend EC2 instances
- Static export configuration in `next.config.ts`

## 🎨 Design System

The application uses a custom design system built with Tailwind CSS:

- **Colors**: Primary blue, success green, warning orange, danger red
- **Typography**: Inter font family with consistent sizing
- **Components**: Reusable button, input, and card components
- **Animations**: Smooth transitions and micro-interactions

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Grid System**: CSS Grid and Flexbox for layouts
- **Touch Friendly**: Large touch targets and gestures

## 🔧 Available Scripts

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build static export to `out/` directory
- `npm run build:static` - Alias for `npm run build`
- `npm run start` - Start production server (not used for S3 deployment)
- `npm run lint` - Run ESLint
- `npm run deploy:s3` - Deploy built files to S3 bucket (requires AWS CLI)

## 🚀 Deployment

### AWS S3 Static Hosting (Current Architecture)

This application is configured for static export and deployment to AWS S3.

#### Prerequisites

- AWS CLI installed and configured
- AWS account with S3 access
- Backend services configured with CORS headers

#### Step 1: Build Static Files

```bash
npm run build
```

This generates an `out/` directory containing all static HTML, CSS, and JavaScript files.

#### Step 2: Create and Configure S3 Bucket

```bash
# Create S3 bucket
aws s3 mb s3://your-app-bucket-name

# Enable static website hosting
aws s3 website s3://your-app-bucket-name \
  --index-document index.html \
  --error-document 404.html
```

#### Step 3: Set Bucket Policy for Public Access

Update `bucket-policy.json` with your bucket name, then apply:

```bash
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

#### Step 4: Deploy to S3

```bash
# Using npm script (update bucket name in package.json first)
npm run deploy:s3

# Or manually
aws s3 sync out/ s3://your-app-bucket-name --delete
```

#### Step 5: Access Your Application

Your application will be available at:
```
http://your-app-bucket-name.s3-website-us-east-1.amazonaws.com
```

(Replace `us-east-1` with your bucket's region)

### CloudFront CDN Setup (Optional but Recommended)

For HTTPS, custom domains, and better performance:

#### Create CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name your-app-bucket-name.s3-website-us-east-1.amazonaws.com \
  --default-root-object index.html
```

#### Configure Custom Error Pages

In CloudFront console, add custom error responses:
- **Error Code:** 403 → **Response Page:** `/index.html` → **Response Code:** 200
- **Error Code:** 404 → **Response Page:** `/index.html` → **Response Code:** 200

This enables client-side routing to work properly.

#### Benefits of CloudFront:
- ✅ HTTPS support with free SSL certificate (AWS Certificate Manager)
- ✅ Custom domain names
- ✅ Global CDN with edge caching
- ✅ Better performance and lower latency
- ✅ DDoS protection

### Alternative Deployment Options

#### AWS Amplify (Zero Code Changes)

AWS Amplify supports Next.js dynamic features without refactoring:

```bash
npm install -g @aws-amplify/cli
amplify init
amplify add hosting
amplify publish
```

Or use the AWS Amplify Console to connect your Git repository.

#### Vercel or Netlify

Deploy to platforms with native Next.js support:

```bash
# Vercel
npm install -g vercel
vercel

# Netlify
npm install -g netlify-cli
netlify deploy
```

## 🔗 API Integration

The frontend makes direct API calls to backend EC2 services:

- **Apps Service**: Configured via `NEXT_PUBLIC_API_URL`
- **Requestor Service**: Configured via `NEXT_PUBLIC_REQUESTOR_URL`

**Key Endpoints:**
  - `GET /applications` - List applications
  - `POST /applications` - Create application
  - `PUT /applications/:id` - Update application
  - `DELETE /applications/:id` - Delete application
  - `POST /applications/:id/api-keys` - Create API key
  - `GET /applications/:id/api-keys` - List API keys

**Important:** Backend services must have CORS enabled to accept requests from the S3/CloudFront origin.

## 🎯 Features Overview

### Dashboard
- Application overview cards
- Quick actions and statistics
- Responsive grid layout

### Application Management
- Create new applications with form validation
- View detailed application information
- Edit and delete existing applications

### Notification Tracking
- Real-time notification history
- Status indicators (sent, pending, failed)
- Detailed notification information

### AWS Resource Management
- Automatic SES domain verification
- SNS topic creation and configuration
- Resource ARN display and management

## ⚙️ Backend CORS Configuration

**Critical Requirement:** Your backend EC2 services must be configured to accept CORS requests from your S3/CloudFront origin.

### Required CORS Headers

```
Access-Control-Allow-Origin: https://your-cloudfront-domain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

### Example: Express.js

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'https://your-cloudfront-domain.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.listen(80);
```

### Example: FastAPI (Python)

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-cloudfront-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Testing CORS

```bash
curl -H "Origin: https://your-cloudfront-domain.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://your-backend-url:80/applications
```

## 🔒 Security

- Client-side authentication with JWT tokens stored in localStorage
- Protected routes with authentication guards
- Direct HTTPS communication with backend APIs (via CloudFront)
- Input validation and sanitization
- Environment variables for configuration
- Public read-only access to S3 static files (no sensitive data)

**Security Notes:**
- Never commit `.env.local` to version control
- API keys and secrets should be managed by backend services
- Authentication tokens are stored client-side (consider security implications)

## 🌟 Performance & Architecture Benefits

### Static Export Advantages
- **Cost Reduction:** 90-95% lower hosting costs compared to container deployment
- **Infinite Scalability:** S3 automatically handles any traffic volume
- **High Availability:** 99.99% SLA from AWS S3
- **Global Performance:** CloudFront CDN edge caching worldwide
- **Zero Server Maintenance:** No patching, updates, or server management

### Build Output
- Pre-rendered static HTML pages
- Optimized JavaScript bundles with code splitting
- Lazy loading for improved initial page load
- Tailwind CSS purged for minimal CSS bundle size
- All assets cached at CDN edge locations

## 🏛️ Architecture Migration

This application has been migrated from a **server-based Docker container deployment** to **AWS S3 static hosting**.

### Key Changes

#### Configuration (`next.config.ts`)
- Changed `output: "standalone"` → `output: "export"`
- Added `images: { unoptimized: true }`
- Added `trailingSlash: true` for better S3 compatibility
- Removed `rewrites()` function (not supported in static export)

#### Routing
- **Before:** Dynamic routes `/application/[id]`
- **After:** Query parameters `/application?id=123`
- All pages use `useSearchParams()` wrapped in `<Suspense>` boundaries

#### API Communication
- **Before:** Proxied through Next.js API routes (`/api/proxy/*`)
- **After:** Direct calls to backend EC2 instances
- Requires CORS configuration on backend services

#### Removed Features
- Server-side API routes (`/app/api/proxy/`, `/app/api/health/`)
- Next.js Image Optimization API
- Server-side rendering (SSR)
- Dynamic route segments

### Migration Benefits

| Aspect | Before (Docker) | After (S3) | Improvement |
|--------|----------------|------------|-------------|
| **Monthly Cost** | ~$55 (ECS + ALB) | ~$1-2 (S3 + CloudFront) | **95% reduction** |
| **Scalability** | Manual (auto-scaling groups) | Automatic (infinite) | **Unlimited** |
| **Availability** | 99.9% (EC2/ECS) | 99.99% (S3) | **Higher SLA** |
| **Maintenance** | Server patching required | Zero maintenance | **Simplified** |
| **Deployment** | Container build + push | Static file sync | **Faster** |

## 🔧 Configuration Details

### Environment Variables

All environment variables must use the `NEXT_PUBLIC_` prefix to be accessible in the browser:

```env
# .env.local
NEXT_PUBLIC_API_URL=http://your-backend-api:80
NEXT_PUBLIC_REQUESTOR_URL=http://your-requestor-api:80
```

**Important Notes:**
- Values are embedded at **build time**, not runtime
- Must rebuild application when changing environment variables
- Never commit `.env.local` to version control
- Use different `.env` files for different environments

### Next.js Configuration

The application uses static export configuration:

```typescript
const nextConfig: NextConfig = {
  output: "export",  // Static export for S3
  images: { unoptimized: true },  // Disable Image Optimization API
  trailingSlash: true,  // Better S3 compatibility
};
```

## 🐛 Troubleshooting

### Build Errors

**Error:** `useSearchParams() should be wrapped in a suspense boundary`

**Solution:** Wrap components using `useSearchParams()` in `<Suspense>`:

```typescript
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function MyComponent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
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

### CORS Errors

**Error:** `Access to fetch at 'http://...' has been blocked by CORS policy`

**Solution:** Configure CORS headers on your backend EC2 services (see Backend CORS Configuration section)

### 404 on Page Refresh

**Problem:** Refreshing `/application?id=123` returns 404

**Solution:** Configure CloudFront custom error pages to redirect 403/404 to `/index.html` with 200 status code

### Environment Variables Not Working

**Problem:** `process.env.NEXT_PUBLIC_API_URL` is undefined

**Solutions:**
1. Ensure variable name starts with `NEXT_PUBLIC_`
2. Restart dev server after adding `.env.local`
3. Rebuild application (`npm run build`)
4. Verify `.env.local` is in project root directory

## 📚 Additional Documentation

For more detailed information about the S3 migration:

- **[S3_DEPLOYMENT_GUIDE.md](S3_DEPLOYMENT_GUIDE.md)** - Complete deployment guide with troubleshooting
- **[ARCHITECTURE_MIGRATION_PRESENTATION.md](ARCHITECTURE_MIGRATION_PRESENTATION.md)** - Detailed architectural changes
- **[MIGRATION_QUICK_REFERENCE.md](MIGRATION_QUICK_REFERENCE.md)** - Quick reference for common tasks

## 📄 License

This project is licensed under the MIT License.