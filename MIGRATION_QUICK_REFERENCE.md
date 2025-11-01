# Migration Quick Reference Guide

## 🎯 Quick Summary

**What Changed:** Next.js application migrated from Docker container deployment to AWS S3 static hosting

**Why:** Reduce costs by 90-95%, simplify deployment, improve scalability

**Key Trade-off:** Backend services now require CORS configuration

---

## 📋 Changes Checklist

### Configuration Changes

- [x] `next.config.ts`: Changed `output: "standalone"` → `output: "export"`
- [x] `next.config.ts`: Added `images: { unoptimized: true }`
- [x] `next.config.ts`: Removed `rewrites()` function
- [x] `next.config.ts`: Added `trailingSlash: true`

### Code Changes

- [x] Deleted `app/api/proxy/[...path]/route.ts`
- [x] Deleted `app/api/health/route.ts`
- [x] Updated `services/api.ts` to use direct EC2 URLs
- [x] Moved `app/application/[id]/page.tsx` → `app/application/page.tsx`
- [x] Moved `app/application/[id]/edit/page.tsx` → `app/application/edit/page.tsx`
- [x] Updated all pages to use `useSearchParams()` instead of `useParams()`
- [x] Wrapped `useSearchParams()` in `<Suspense>` boundaries
- [x] Updated navigation calls to use query parameters

### Infrastructure Changes

- [ ] Configure CORS on EC2 backend (100.26.23.64:80)
- [ ] Configure CORS on EC2 backend (54.196.198.21:80)
- [ ] Create S3 bucket for static hosting
- [ ] Configure S3 bucket policy for public read
- [ ] (Optional) Create CloudFront distribution
- [ ] (Optional) Configure custom domain with Route 53

---

## 🔧 Code Pattern Changes

### Pattern 1: API Base URLs

**Before:**
```typescript
const APPS_BASE_URL = "/api/proxy";
const REQUESTOR_BASE_URL = "/api/requestor";
```

**After:**
```typescript
const APPS_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://100.26.23.64:80";
const REQUESTOR_BASE_URL = process.env.NEXT_PUBLIC_REQUESTOR_URL || "http://54.196.198.21:80";
```

---

### Pattern 2: Dynamic Routes

**Before:**
```typescript
// File: app/application/[id]/page.tsx
import { useParams } from 'next/navigation'

export default function Page() {
  const params = useParams()
  const id = params.id
  // ...
}
```

**After:**
```typescript
// File: app/application/page.tsx
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function PageContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  // ...
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PageContent />
    </Suspense>
  )
}
```

---

### Pattern 3: Navigation

**Before:**
```typescript
router.push(`/application/${app.Application}`)
router.push(`/application/${app.Application}/edit`)
```

**After:**
```typescript
router.push(`/application?id=${app.Application}`)
router.push(`/application/edit?id=${app.Application}`)
```

---

## 🚀 Build & Deploy Commands

### Local Development
```bash
npm run dev
```

### Build Static Export
```bash
npm run build
# Generates out/ directory
```

### Deploy to S3
```bash
# Option 1: Using npm script
npm run deploy:s3

# Option 2: Using AWS CLI directly
aws s3 sync out/ s3://your-bucket-name --delete
```

### Verify Build Output
```bash
ls -la out/
# Should see: _next/, application/, dashboard/, login/, index.html, etc.
```

---

## 🔐 Environment Variables

### Required Variables

Create `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://100.26.23.64:80
NEXT_PUBLIC_REQUESTOR_URL=http://54.196.198.21:80
```

### Important Notes

⚠️ **Must use `NEXT_PUBLIC_` prefix** for browser access

⚠️ **Values are embedded at build time** - must rebuild when changing

⚠️ **Never commit `.env.local`** to version control

---

## 🌐 Backend CORS Configuration

### Required CORS Headers

Your EC2 backend services must return these headers:

```
Access-Control-Allow-Origin: https://your-cloudfront-domain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

### Express.js Example

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// CORS configuration
app.use(cors({
  origin: 'https://your-cloudfront-domain.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Your routes...
app.get('/applications', (req, res) => {
  // ...
});

app.listen(80);
```

### Testing CORS

```bash
# Test OPTIONS preflight request
curl -H "Origin: https://your-cloudfront-domain.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://100.26.23.64:80/applications

# Should return CORS headers in response
```

---

## 📦 S3 Bucket Configuration

### Create Bucket

```bash
aws s3 mb s3://your-app-bucket-name
```

### Enable Static Website Hosting

```bash
aws s3 website s3://your-app-bucket-name \
  --index-document index.html \
  --error-document 404.html
```

### Set Bucket Policy

Create `bucket-policy.json`:

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

### Get Website URL

```bash
# Format: http://bucket-name.s3-website-region.amazonaws.com
http://your-app-bucket-name.s3-website-us-east-1.amazonaws.com
```

---

## ☁️ CloudFront Configuration (Optional)

### Why Use CloudFront?

- ✅ HTTPS support with free SSL certificate (ACM)
- ✅ Custom domain names
- ✅ Global CDN with edge caching
- ✅ Better performance and lower latency
- ✅ DDoS protection

### Create Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name your-app-bucket-name.s3-website-us-east-1.amazonaws.com \
  --default-root-object index.html
```

### Configure Custom Error Pages

In CloudFront console:
- Error Code: 403 → Response Page: /index.html → Response Code: 200
- Error Code: 404 → Response Page: /404.html → Response Code: 404

This enables client-side routing to work properly.

---

## 🐛 Troubleshooting

### Build Fails: "useSearchParams() should be wrapped in a suspense boundary"

**Solution:** Wrap component using `useSearchParams()` in `<Suspense>`:

```typescript
import { Suspense } from 'react'

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

---

### CORS Error in Browser Console

**Error:** `Access to fetch at 'http://100.26.23.64:80/applications' from origin 'https://...' has been blocked by CORS policy`

**Solution:** Configure CORS headers on backend EC2 service (see CORS section above)

---

### 404 Error on Page Refresh

**Problem:** Refreshing `/application?id=123` returns 404

**Solution:** Configure CloudFront custom error pages:
- 403 → /index.html (200)
- 404 → /index.html (200)

Or for S3 only, set error document to `index.html` in bucket settings.

---

### Environment Variables Not Working

**Problem:** `process.env.NEXT_PUBLIC_API_URL` is undefined

**Solutions:**
1. Ensure variable name starts with `NEXT_PUBLIC_`
2. Restart dev server after adding `.env.local`
3. Rebuild application (`npm run build`)
4. Check `.env.local` is in project root directory

---

### Images Not Loading

**Problem:** Next.js Image component not working

**Solution:** Use standard `<img>` tag instead of `<Image>`:

```typescript
// Before
import Image from 'next/image'
<Image src="/logo.png" width={100} height={100} />

// After
<img src="/logo.png" width={100} height={100} alt="Logo" />
```

Or use external image CDN with `next/image` loader configuration.

---

## 💰 Cost Comparison

### Before: Docker Container on ECS

| Service | Monthly Cost |
|---------|--------------|
| ECS Fargate (1 task, 0.5 vCPU, 1GB RAM) | ~$30 |
| Application Load Balancer | ~$20 |
| Data Transfer | ~$5 |
| **Total** | **~$55/month** |

### After: S3 + CloudFront

| Service | Monthly Cost |
|---------|--------------|
| S3 Storage (1GB) | ~$0.02 |
| S3 Requests (100k requests) | ~$0.04 |
| CloudFront Data Transfer (10GB) | ~$0.85 |
| CloudFront Requests (100k) | ~$0.10 |
| **Total** | **~$1-2/month** |

**Savings: ~95% reduction** 🎉

---

## 📚 Additional Resources

- **Full Presentation:** `ARCHITECTURE_MIGRATION_PRESENTATION.md`
- **S3 Deployment Guide:** `S3_DEPLOYMENT_GUIDE.md`
- **Next.js Static Export Docs:** https://nextjs.org/docs/app/building-your-application/deploying/static-exports
- **AWS S3 Static Hosting:** https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html
- **CloudFront Documentation:** https://docs.aws.amazon.com/cloudfront/

---

## 🎯 Next Steps

1. **Test locally:** Run `npm run build` and verify no errors
2. **Configure CORS:** Update backend EC2 services with CORS headers
3. **Create S3 bucket:** Follow S3 configuration steps above
4. **Deploy:** Run `npm run deploy:s3`
5. **Test deployment:** Visit S3 website URL and test all functionality
6. **Set up CloudFront:** (Optional) Create CloudFront distribution for HTTPS
7. **Configure domain:** (Optional) Point custom domain to CloudFront

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Homepage loads correctly
- [ ] Login functionality works
- [ ] Dashboard displays applications
- [ ] Can view application details (`/application?id=123`)
- [ ] Can edit applications (`/application/edit?id=123`)
- [ ] API calls to backend succeed (check browser console)
- [ ] No CORS errors in browser console
- [ ] Images load correctly
- [ ] Navigation between pages works
- [ ] Page refresh doesn't cause 404 errors
- [ ] Authentication persists (localStorage)

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review full presentation document
3. Consult Next.js and AWS documentation
4. Contact your team lead or DevOps engineer

---

*Last Updated: 2025-11-01*

