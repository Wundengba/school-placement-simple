# ⚡ QUICK FIX - 5 Minutes

## Problem
Backend throws "Sync failed: Failed to fetch" error

## Root Cause  
`DATABASE_URL` is missing from Vercel environment variables

## Solution

### Step 1: Go to Vercel Dashboard
👉 https://vercel.com/login

### Step 2: Navigate to Environment Variables
1. Click **backend** project
2. Click **Settings** tab
3. Look for **Environment Variables** in left menu
4. Click on it

### Step 3: Add Variables
**Click "Add New" for each:**

```
Name:        DATABASE_URL
Value:       postgresql://neondb_owner:npg_BloZTI9q5EJd@ep-shy-star-ailugefe-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
Environment: Production
[Click: Add]

---

Name:        JWT_SECRET
Value:       your_jwt_secret_key_here_change_in_production
Environment: Production
[Click: Add]

---

Name:        NODE_ENV
Value:       production
Environment: Production
[Click: Add]
```

### Step 4: Redeploy
```bash
cd school-placement-simple/backend
vercel --prod --yes
```

### Step 5: Test
```bash
curl https://backend-seven-ashen-18.vercel.app/api/health
```

✅ You should get JSON response with `"status": "Server is running"`

---

## That's It!
Everything else is already working. This fixes the sync error.

**Time needed:** 5 minutes
**Difficulty:** Easy (just copy/paste into Vercel dashboard)
