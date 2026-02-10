# MongoDB Atlas Network Access Verification for Vercel

## Problem
Uploads to backend succeed (HTTP 200) but data doesn't persist in MongoDB. This typically means:
- Connection initializes OK
- Write operations timeout or fail silently
- Vercel's dynamic IPs aren't whitelisted in Atlas

## Solution: Whitelist Vercel IPs in MongoDB Atlas

### Steps to Fix:

#### 1. **Log in to MongoDB Atlas Console**
   - Go to: https://cloud.mongodb.com/
   - Select your project: `Projects`
   - Select your cluster

#### 2. **Navigate to Network Access**
   - Click **"Network Access"** in the left sidebar (under "Security")

#### 3. **Current Issues to Fix**
   - **Remove or expand the old IP restriction** (if set to a specific IP)
   - **Add Vercel's IP ranges** (Vercel uses dynamic IPs; they recommend allowing broader access)

#### 4. **Add IP Whitelist Entry for Vercel**

   **Option A: Allow All IPs (⚠️ Less Secure, Faster)**
   - Click **"+ Add IP Address"**
   - Enter: `0.0.0.0/0` (allows any IP globally)
   - Click **"Confirm"**
   - ⚠️ Only use if authentication is strong

   **Option B: Add Specific Vercel Ranges (⚠️ May need updates)**
   - Vercel publishes IP ranges here: https://vercel.com/docs/concepts/edge-network/regions#edge-network-regions
   - As of Feb 2026, Vercel's typical CIDR ranges include regions like:
     - `35.184.0.0/13` (US-East, or check docs for current ranges)
   - Add each range via **"+ Add IP Address"**

   **Option C: Set to Your Current Testing IP (Temporary)**
   - Visit: https://checkip.amazonaws.com/
   - Copy your current public IP
   - Add it temporarily to test connectivity
   - Then expand to full Vercel range once confirmed

#### 5. **Verify Cluster User Credentials**
   - Go to **"Database Access"** (left sidebar, under "Security")
   - Confirm your user `mrwundengba` exists
   - Verify password is correct (matches `MONGO_URI` in Vercel)
   - If needed, reset password and update Vercel env var

#### 6. **Check Connection String Format**
   - Ensure your `MONGO_URI` in Vercel production includes:
     ```
     mongodb+srv://mrwundengba:Z5wi49MBJ3qEcfVk@projects.nbs4iqw.mongodb.net/school-placement?retryWrites=true&w=majority&appName=Projects
     ```
   - The `+srv` protocol automatically handles DNS and Atlas cluster lookup

#### 7. **Test the Fix**
   - After IP whitelisting is updated:
     1. Redeploy backend to Vercel (forces reconnect)
     2. Send a test upload: `node tmp_sync_test.cjs`
     3. Check if `/api/sync/download` returns data
     4. Verify `/api/db-status` shows `readyState: 1` (connected)

---

## Quick Checklist
- [ ] Logged into MongoDB Atlas as admin
- [ ] In Network Access, checked current IP allowlist
- [ ] Added `0.0.0.0/0` OR Vercel-specific ranges
- [ ] Verified user `mrwundengba` exists in Database Access
- [ ] Confirmed `MONGO_URI` matches user credentials
- [ ] Redeployed backend to Vercel
- [ ] Tested upload + download endpoints

---

## Expected Behavior After Fix
1. POST `/api/sync/upload` → returns 200 with `"success": true`
2. GET `/api/sync/download` → returns array of uploaded schools/students
3. GET `/api/db-status` → returns `{"readyState": 1, "state": "connected"}`
4. Vercel logs show upsert operations completing (not timing out)

---

## Troubleshooting
- **Still showing "disconnected"?** Check IP allowlist was saved (might need to click "Confirm" again)
- **Still empty downloads?** Check cluster name and database name in URI match Atlas
- **Auth errors?** Reset user password and update Vercel `MONGO_URI` env var

Visit Atlas docs: https://docs.atlas.mongodb.com/security/add-ip-address-to-list/
