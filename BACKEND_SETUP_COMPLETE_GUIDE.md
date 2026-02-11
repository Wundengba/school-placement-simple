# TROUBLESHOOTING: Backend "Sync Failed" Error - Root Cause & Solution

## Summary
The backend crashes on Vercel because **DATABASE_URL environment variable is not set in Vercel's production environment**. The `.env` file in your code repository is NOT deployed by Vercel for security reasons.

## Root Cause Analysis
1. ✅ Code is correct - all components are properly configured
2. ✅ Frontend deployment works - https://school-placement-fresh-202602092227.vercel.app loads
3. ❌ Backend crashes - DATABASE_URL is missing in Vercel's production environment
4. Backend tries to initialize Prisma → Prisma needs DATABASE_URL → Crashes → Connection reset errors

## Solution: Set Environment Variables in Vercel Dashboard

### Step 1: Access Vercel Settings
1. Go to https://vercel.com/login
2. Click on your **backend** project in the sidebar
3. Click the **Settings** tab

### Step 2: Add Environment Variables
In Settings, look for **Environment Variables** on the left panel:

#### Variable 1: DATABASE_URL
- **Name:** `DATABASE_URL`
- **Value:** `postgresql://neondb_owner:npg_BloZTI9q5EJd@ep-shy-star-ailugefe-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- **Environment:** Select `Production` (or `All` to include preview)
- Click **Add**

#### Variable 2: JWT_SECRET
- **Name:** `JWT_SECRET`
- **Value:** `your_jwt_secret_key_here_change_in_production`
- **Environment:** `Production`
- Click **Add**

#### Variable 3: NODE_ENV
- **Name:** `NODE_ENV`
- **Value:** `production`
- **Environment:** `Production`
- Click **Add**

### Step 3: Redeploy Backend
Go back to your terminal:
```bash
cd school-placement-simple/backend
vercel --prod --yes
```

Wait for deployment to complete (should see "✅ Production: ..." message).

### Step 4: Verify Success
After deployment, test the backend:
```bash
# Test 1: Health check
curl https://backend-seven-ashen-18.vercel.app/api/health

# Expected response:
# {
#   "status": "Server is running",
#   "database": "PostgreSQL (Neon)",
#   "migrationsRunning": false,
#   "migrationError": null,
#   "timestamp": "2025-02-11T..."
# }

# Test 2: Sync download
curl https://backend-seven-ashen-18.vercel.app/api/sync/download

# Should return student/school data (or empty arrays if no data yet)
```

## Why This Works

**Vercel Security Model:**
- Vercel does NOT deploy `.env` files to production
- This is intentional - keeps secrets out of version control
- Environment variables must be set through Vercel's secure dashboard
- Only variables set in Vercel dashboard are available at runtime

**Your Setup:**
- `.env` file is in your GitHub repo (this is fine, but not deployed)
- `.env.production` file exists similarly
- Must manually set variables in Vercel for each environment

## After Environment Variables Are Set

Once DATABASE_URL is configured:
1. Backend will successfully initialize
2. Prisma will connect to PostgreSQL
3. Migrations will run automatically
4. Sync endpoints will work
5. Frontend will stop getting "Sync failed: Failed to fetch" errors
6. Students will see their complete profile information (photo, gender, DOB)

## Verification Checklist

- [ ] Logged into https://vercel.com
- [ ] Opened backend project settings
- [ ] Added DATABASE_URL environment variable
- [ ] Added JWT_SECRET environment variable  
- [ ] Added NODE_ENV environment variable
- [ ] All variables set to Production environment
- [ ] Ran `vercel --prod --yes` to redeploy
- [ ] Tested `/api/health` endpoint
- [ ] Tested `/api/sync/download` endpoint
- [ ] Frontend no longer shows sync errors
- [ ] Student details (photo, gender, DOB) appear in portals

## If You Still Get Errors

1. **Check Vercel Logs:**
   - Go to Vercel dashboard → backend project → Deployments
   - Click the latest deployment
   - Click "Runtime Logs" to see actual errors

2. **Common Issues:**
   - DATABASE_URL not set to Production environment → Change environment in dashboard
   - DATABASE_URL has typo → Copy/paste exactly from `.env.production` file
   - Haven't redeployed yet → Run `vercel --prod --yes` again
   - NODE_ENV set to "development" instead of "production" → Change it

3. **Get Help:**
   - Check actual error in Vercel Runtime Logs
   - Verify DATABASE_URL is the Neon pooler endpoint (contains "-pooler")
   - Ensure all 3 variables are set (DATABASE_URL, JWT_SECRET, NODE_ENV)

## Files Included for Reference

- `SET_DATABASE_URL_IN_VERCEL.md` - Detailed DATABASE_URL setup guide
- `FIX_DATABASE_TIMEOUT.md` - Technical explanation of connection pooling
- `set-vercel-env.ps1` - PowerShell script with the exact environment variable values

## Next Steps After This Fix

Once the backend is working:
1. Test sync by refreshing the frontend (localStorage should sync with backend)
2. Verify student details appear correctly in both student and admin portals
3. Test registration to ensure new student data saves to backend
4. Confirm no more "Sync failed" errors in browser console
