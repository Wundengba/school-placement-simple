# Fix: Database Connection Timeout Issue

## Problem
Backend is running but getting `buffering timed out after 10000ms` errors on database operations.

## Root Cause
PostgreSQL/Neon connection pool is exhausted in Vercel's serverless environment. Multiple concurrent function instances need connection pooling.

## Solution

### Step 1: Get Your Neon Connection String
1. Go to https://console.neon.tech
2. Find your project and database
3. Copy the connection string

### Step 2: Update DATABASE_URL with Pooling
Your DATABASE_URL must use PgBouncer for serverless environments:

**Change FROM:**
```
postgresql://user:password@ep-xyz.us-east-1.aws.neon.tech/dbname?sslmode=require
```

**Change TO:**
```
postgresql://user:password@ep-xyz.us-east-1.aws.neon.tech/dbname?sslmode=require&pgbouncer=true
```

Or use the pooling endpoint:
```
postgresql://user:password@ep-xyz-pooler.us-east-1.aws.neon.tech/dbname?sslmode=require
```

### Step 3: Set in Vercel
1. Go to https://vercel.com → Your Project → Settings → Environment Variables
2. Update or create `DATABASE_URL` with the pooling connection string
3. Ensure it's set for **Production** deployment
4. **REDEPLOY** the backend

### Step 4: Alternatively, Configure Prisma for Edge

If you still get timeouts, also update your `.env` to limit Prisma connections:

Add to backend's `.env`:
```
DATABASE_URL="your-connection-string"
PRISMA_CLIENT_ENGINE_TYPE=library
```

## Testing
After redeploy, test the endpoint:
```bash
curl https://backend-seven-ashen-18.vercel.app/api/health
```

Should return:
```json
{
  "status": "Server is running",
  "database": "PostgreSQL (Neon)",
  "migrationsRunning": false,
  "migrationError": null
}
```

## If Still Timing Out
The sync endpoint does 958 parallel operations. Consider:
1. Reduce parallel operations to 10-20 at a time (batch processing)
2. Add retry logic with exponential backoff
3. Increase serverless function timeout in vercel.json (serverlessFunctionTimeout: 60)
