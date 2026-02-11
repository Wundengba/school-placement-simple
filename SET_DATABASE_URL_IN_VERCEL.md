# CRITICAL: Set DATABASE_URL in Vercel Environment Variables

## Problem
The backend is crashing because `DATABASE_URL` environment variable is not set in Vercel's production environment. This causes Prisma to fail at initialization.

## Solution: Add DATABASE_URL to Vercel

### Step 1: Get Your Neon Connection String
1. Go to https://console.neon.tech
2. Click your project
3. Click your database
4. Click "Connection String" 
5. Copy the **Pooler Connection String** (NOT the regular one!)
   
   Example: 
   ```
   postgresql://neon_user:password@ep-xyz-pooler.us-east-1.aws.neon.tech/dbname?sslmode=require
   ```

### Step 2: Add to Vercel (IMPORTANT - Do Not Skip!)
1. Go to https://vercel.com/login
2. Select your "backend" project
3. Click **Settings** tab
4. On the left, click **Environment Variables**
5. Click **Add New**
6. Set:
   - **Name:** `DATABASE_URL`
   - **Value:** Paste your Neon pooler connection string from Step 1
   - **Select environment:** Production (or All)
7. Click **Add**

### Step 3: Redeploy
Run in the backend folder:
```bash
vercel --prod --yes
```

### Step 4: Verify
After redeploy, run:
```bash
curl https://backend-seven-ashen-18.vercel.app/api/health
```

Should return:
```json
{
  "status": "Server is running",
  "database": "PostgreSQL (Neon)",
  "migrationsRunning": false,
  "migrationError": null,
  "timestamp": "2025-02-11T..."
}
```

## Why Pooler Connection String?
- Regular Neon connection strings have limited available connections
- Pooler connection strings use PgBouncer for connection pooling
- Vercel serverless needs connection pooling to work properly

## If Still Getting Errors
Check Vercel dashboard → Deployments → Latest → Logs for actual error message
