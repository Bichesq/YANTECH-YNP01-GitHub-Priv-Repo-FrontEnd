# AWS S3 Static Deployment Guide

## ⚠️ CRITICAL ISSUE: Dynamic Routes Not Compatible with Static Export

### Problem Summary

Your Next.js application uses **dynamic routes** (`/application/[id]` and `/application/[id]/edit`) which are **NOT compatible** with Next.js static export (`output: "export"`).

Next.js static export requires all dynamic routes to have `generateStaticParams()` that pre-generates all possible paths at build time. Since your app:
- Fetches application data dynamically from a backend API
- Has an unknown number of applications
- Creates new applications at runtime

...it's **impossible to pre-generate all possible routes** at build time.

### Build Error

```
Error: Page "/application/[id]" is missing "generateStaticParams()" 
so it cannot be used with "output: export" config.
```

---

## ✅ SOLUTIONS

You have **3 options** to deploy this application:

### **Option 1: Use AWS Amplify (RECOMMENDED)**

AWS Amplify supports Next.js dynamic routes out of the box without code changes.

**Pros:**
- ✅ Zero code changes required
- ✅ All features work (API routes, dynamic routes, SSR)
- ✅ Automatic deployments from Git
- ✅ Built-in CDN and HTTPS
- ✅ Environment variable management
- ✅ Free tier available

**Setup:**
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize and deploy
amplify init
amplify add hosting
amplify publish
```

Or use the **AWS Amplify Console** (web UI) - just connect your Git repository!

---

### **Option 2: Refactor to Remove Dynamic Routes**

Change the routing structure to use query parameters instead of dynamic segments.

**Changes Required:**

1. **Change route structure:**
   - From: `/application/[id]` → To: `/application?id=123`
   - From: `/application/[id]/edit` → To: `/application/edit?id=123`

2. **Update navigation code:**
   ```typescript
   // OLD
   router.push(`/application/${app.Application}`)
   
   // NEW
   router.push(`/application?id=${app.Application}`)
   ```

3. **Update page components:**
   ```typescript
   // OLD
   const params = useParams()
   const id = params.id
   
   // NEW
   const searchParams = useSearchParams()
   const id = searchParams.get('id')
   ```

**Pros:**
- ✅ Works with pure S3 static hosting
- ✅ Simple deployment

**Cons:**
- ❌ Requires code refactoring
- ❌ Less clean URLs
- ❌ Still need to configure S3 for SPA routing

---

### **Option 3: Use Vercel or Netlify**

Deploy to a platform that natively supports Next.js.

**Vercel (creators of Next.js):**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy
```

**Pros:**
- ✅ Zero code changes
- ✅ All Next.js features supported
- ✅ Automatic deployments
- ✅ Free tier available

**Cons:**
- ❌ Not AWS (if you need to stay in AWS ecosystem)

---

## 📋 Changes Already Made

I've successfully completed the following refactoring for S3 deployment:

### ✅ 1. Updated `next.config.ts`
```typescript
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};
```

### ✅ 2. Removed API Routes
Deleted server-side API directories:
- `app/api/proxy/[...path]/`
- `app/api/health/`

### ✅ 3. Updated `services/api.ts`
Changed API base URLs to call backend directly:
```typescript
const APPS_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://100.26.23.64:80";
const REQUESTOR_BASE_URL = process.env.NEXT_PUBLIC_REQUESTOR_URL || "http://54.196.198.21:80";
```

### ✅ 4. Updated `package.json`
Added deployment scripts:
```json
{
  "scripts": {
    "build:static": "next build",
    "deploy:s3": "aws s3 sync out/ s3://your-bucket-name --delete"
  }
}
```

### ✅ 5. Fixed Build Errors
- Fixed React Hooks error in `ApiKeyManagement.tsx`
- All ESLint warnings are non-blocking

---

## 🚧 Remaining Issue

**Dynamic routes** (`/application/[id]` and `/application/[id]/edit`) prevent static export.

**You must choose one of the 3 options above to proceed.**

---

## 🔧 If You Choose Option 2 (Refactor Routes)

I can help you refactor the code to use query parameters. Here's what needs to be changed:

### Files to Update:
1. **Move pages:**
   - `app/application/[id]/page.tsx` → `app/application/page.tsx`
   - `app/application/[id]/edit/page.tsx` → `app/application/edit/page.tsx`

2. **Update components that navigate:**
   - `app/dashboard/page.tsx` - Update application links
   - `app/application/page.tsx` - Update edit button
   - Any other components with `router.push()` calls

3. **Update page components:**
   - Change from `useParams()` to `useSearchParams()`
   - Update all references to `params.id`

Would you like me to make these changes?

---

## 📦 AWS S3 Deployment Steps (After Fixing Routes)

Once you've resolved the dynamic routes issue, here's how to deploy:

### 1. Build the Application
```bash
cd YANTECH-YNP01-GitHub-Priv-Repo-FrontEnd
npm run build
```

This creates an `out/` directory with static files.

### 2. Create S3 Bucket
```bash
aws s3 mb s3://your-app-name
```

### 3. Configure Bucket for Static Website Hosting
```bash
aws s3 website s3://your-app-name \
  --index-document index.html \
  --error-document 404.html
```

### 4. Set Bucket Policy (Public Read)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-app-name/*"
    }
  ]
}
```

Apply policy:
```bash
aws s3api put-bucket-policy \
  --bucket your-app-name \
  --policy file://bucket-policy.json
```

### 5. Upload Files
```bash
npm run deploy:s3
# or manually:
aws s3 sync out/ s3://ynp01-s3-frontend2 --delete
```

### 6. Access Your Site
```
http://your-app-name.s3-website-us-east-1.amazonaws.com
```

---

## 🌐 Optional: CloudFront CDN Setup

For HTTPS, custom domain, and better performance:

### 1. Create CloudFront Distribution
```bash
aws cloudfront create-distribution \
  --origin-domain-name your-app-name.s3.amazonaws.com \
  --default-root-object index.html
```

### 2. Configure Custom Error Pages
Set 404 errors to redirect to `index.html` for SPA routing:
- Error Code: 404
- Response Page Path: `/index.html`
- Response Code: 200

### 3. Add Custom Domain (Optional)
- Request SSL certificate in AWS Certificate Manager
- Add CNAME record in Route 53
- Update CloudFront distribution with custom domain

---

## ⚙️ Backend CORS Configuration

Your EC2 backend services **MUST** enable CORS to accept requests from S3/CloudFront:

```python
# Example for FastAPI
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://your-app-name.s3-website-us-east-1.amazonaws.com",
        "https://your-cloudfront-domain.cloudfront.net",
        "https://your-custom-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🎯 Recommendation

**I strongly recommend Option 1 (AWS Amplify)** because:
1. No code changes needed
2. Stays in AWS ecosystem
3. Professional deployment with all features
4. Easy to set up and maintain
5. Automatic HTTPS and CDN

Would you like me to:
- **A)** Help you set up AWS Amplify deployment?
- **B)** Refactor the code to remove dynamic routes (Option 2)?
- **C)** Provide more details on another option?

Let me know how you'd like to proceed!

