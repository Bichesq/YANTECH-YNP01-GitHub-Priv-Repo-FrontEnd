# Session Persistence Testing Guide

## 🎯 Purpose

This guide provides step-by-step instructions to test session persistence in both development and production (static build) environments.

## ✅ Test 1: Development Server

### Steps

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Open browser to** `http://localhost:3000`

3. **Open DevTools** (F12) and go to Console tab

4. **Login:**
   - Username: `admin`
   - Password: `admin123`

5. **Verify console output:**
   ```
   ✅ Login successful, session created
   ```

6. **Check localStorage:**
   - DevTools → Application → Local Storage → `http://localhost:3000`
   - Should see `auth_session` key with JSON value

7. **Navigate to Dashboard** - Should work without redirect

8. **Navigate to API Management** - Should work without redirect

9. **Refresh page** - Should stay authenticated

10. **Close and reopen browser** - Should stay authenticated (until 24h expiration)

### Expected Results

✅ Session persists in localStorage  
✅ Navigation works without redirects  
✅ Page refresh maintains authentication  
✅ Browser restart maintains authentication  

---

## ✅ Test 2: Static Build (Production Simulation)

### Steps

1. **Build static export:**
   ```bash
   npm run build
   ```

2. **Serve static files:**
   ```bash
   npx serve out -p 3000
   ```

3. **Open browser to** `http://localhost:3000`

4. **Open DevTools** (F12) and go to Console tab

5. **Login:**
   - Username: `admin`
   - Password: `admin123`

6. **Verify console output:**
   ```
   ✅ Login successful, session created
   ```

7. **Check localStorage:**
   - DevTools → Application → Local Storage → `http://localhost:3000`
   - Should see `auth_session` key with JSON value

8. **Navigate to Dashboard** - Should work without redirect

9. **Navigate to API Management** - Should work without redirect

10. **Refresh page** - Should stay authenticated

11. **Close and reopen browser** - Should stay authenticated

### Expected Results

✅ Session persists in localStorage  
✅ Navigation works without redirects  
✅ Page refresh maintains authentication  
✅ Browser restart maintains authentication  
✅ **Same behavior as development server**  

---

## ✅ Test 3: AWS S3 Production

### Prerequisites

- Application deployed to S3
- S3 bucket configured for static website hosting
- Backend CORS configured for S3 domain

### Steps

1. **Open S3 URL** (e.g., `https://your-bucket.s3.amazonaws.com/index.html`)

2. **Open DevTools** (F12) and go to Console tab

3. **Login:**
   - Username: `admin`
   - Password: `admin123`

4. **Verify console output:**
   ```
   ✅ Login successful, session created
   ```

5. **Check localStorage:**
   - DevTools → Application → Local Storage → `https://your-bucket.s3.amazonaws.com`
   - Should see `auth_session` key with JSON value

6. **Navigate to Dashboard** - Should work without redirect

7. **Navigate to API Management** - Should work without redirect

8. **Refresh page** - Should stay authenticated

9. **Close and reopen browser** - Should stay authenticated

### Expected Results

✅ Session persists in localStorage  
✅ Navigation works without redirects  
✅ Page refresh maintains authentication  
✅ Browser restart maintains authentication  
✅ **Identical behavior to local testing**  

---

## 🐛 Troubleshooting

### Issue: Session not saving

**Check:**
1. Console for errors
2. Browser privacy mode (disable)
3. Browser extensions (disable)
4. localStorage quota (clear old data)

**Expected console output on login:**
```
✅ Login successful, session created
```

**If you see:**
```
❌ Failed to save session to localStorage
[Storage] Storage not available - SSR context or disabled
```

**Solution:**
- Disable privacy/incognito mode
- Check browser settings allow localStorage
- Try different browser

### Issue: Redirect to login after navigation

**Check:**
1. localStorage has `auth_session` key
2. Session is not expired
3. Console for errors

**Expected console output on page load:**
```
✅ Session restored from storage
```

**If you see:**
```
⚠️ Session expired, clearing authentication
```

**Solution:**
- Session expired (24h limit)
- Login again

**If you see:**
```
ℹ️ No valid session found
```

**Solution:**
- Session was not saved or was cleared
- Check localStorage in DevTools
- Login again

### Issue: Works in dev but not in static build

**This should NOT happen** - both should work identically.

**If it does:**
1. Clear browser cache
2. Clear localStorage
3. Rebuild: `npm run build`
4. Serve fresh: `npx serve out -p 3000`
5. Test again

**If still failing:**
- Check console for errors
- Share console output for debugging

---

## 📊 Success Criteria

All three test scenarios should produce **identical results**:

| Test | Dev Server | Static Build | S3 Production |
|------|-----------|--------------|---------------|
| Login saves session | ✅ | ✅ | ✅ |
| localStorage has key | ✅ | ✅ | ✅ |
| Navigation works | ✅ | ✅ | ✅ |
| Refresh persists | ✅ | ✅ | ✅ |
| Browser restart persists | ✅ | ✅ | ✅ |

---

## 🎓 What This Proves

If all tests pass, it confirms:

1. ✅ **Session management is compatible with static export**
2. ✅ **localStorage works correctly in all environments**
3. ✅ **No SSR issues in production**
4. ✅ **Hydration happens correctly**
5. ✅ **Ready for AWS S3 deployment**

---

## 📝 Test Report Template

Use this template to document your test results:

```
# Session Persistence Test Report

Date: ___________
Tester: ___________

## Test 1: Development Server
- [ ] Session saves to localStorage
- [ ] Navigation works
- [ ] Refresh persists session
- [ ] Browser restart persists session
Notes: ___________

## Test 2: Static Build
- [ ] Session saves to localStorage
- [ ] Navigation works
- [ ] Refresh persists session
- [ ] Browser restart persists session
Notes: ___________

## Test 3: S3 Production
- [ ] Session saves to localStorage
- [ ] Navigation works
- [ ] Refresh persists session
- [ ] Browser restart persists session
Notes: ___________

## Overall Result
- [ ] All tests passed
- [ ] Some tests failed (see notes)

## Issues Found
___________

## Conclusion
___________
```

