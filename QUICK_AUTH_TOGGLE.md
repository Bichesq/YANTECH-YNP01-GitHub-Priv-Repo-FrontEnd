# Quick Auth Toggle Reference

## 🔓 Disable Authentication (Development Only)

### 1. Edit `.env.local`
```bash
NEXT_PUBLIC_DISABLE_AUTH=true
```

### 2. Restart Server
```bash
npm run dev
```

### 3. Verify
- Console shows: `🚨 AUTHENTICATION IS DISABLED - Development mode only!`
- Can access all pages without login

---

## 🔒 Re-Enable Authentication

### 1. Edit `.env.local`
```bash
NEXT_PUBLIC_DISABLE_AUTH=false
```

### 2. Restart Server
```bash
npm run dev
```

### 3. Verify
- Redirected to `/login` when accessing protected pages
- Must login to access dashboard

---

## ⚠️ PRODUCTION DEPLOYMENT CHECKLIST

**Before deploying to S3:**

- [ ] Open `.env.local`
- [ ] Ensure `NEXT_PUBLIC_DISABLE_AUTH=false` (or line is removed)
- [ ] Run `npm run build`
- [ ] Test: `npx serve out -p 3000`
- [ ] Verify login is required
- [ ] Deploy: `npm run deploy:s3`

---

## 📁 Modified Files

All changes are marked with `⚠️ AUTH BYPASS` comments:

1. `.env.local` - Environment variable
2. `contexts/AuthContext.tsx` - Auto-authenticate
3. `app/page.tsx` - Skip login redirect
4. `app/dashboard/page.tsx` - Skip auth check
5. `app/api_key_management/page.tsx` - Skip auth check
6. `app/application/page.tsx` - Skip auth check
7. `app/application/edit/page.tsx` - Skip auth check
8. `services/api.ts` - Skip 401 redirect

---

## 🚨 SECURITY WARNING

**NEVER deploy to production with `NEXT_PUBLIC_DISABLE_AUTH=true`!**

This will make your entire application accessible without authentication!

---

## 📚 Full Documentation

See `AUTH_BYPASS_GUIDE.md` for complete details.

