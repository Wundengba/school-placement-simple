# Deploying School Placement System to Vercel

Complete guide for deploying frontend and backend to Vercel.

## Prerequisites

1. **GitHub Account** — Push code to GitHub (Vercel integrates with GitHub)
2. **Vercel Account** — Sign up at https://vercel.com
3. **MongoDB Atlas Account** — Free cloud MongoDB at https://www.mongodb.com/cloud/atlas

## Step 1: Set Up MongoDB Atlas

### 1.1 Create MongoDB Free Tier Database

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create a new project
4. Create a cluster (free M0 tier, ~3.5GB storage)
5. Create a database user:
   - Username: `admin`
   - Password: (generate secure password, save it)
6. Whitelist IP: Allow access from anywhere (0.0.0.0/0)
7. Get connection string:
   - Click "Connect" → "Connect your application"
   - Copy MongoDB URI like: `mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/school-placement?retryWrites=true&w=majority`
   - Replace `PASSWORD` with your database password

---

## Step 2: Push Code to GitHub

```bash
# Initialize git (if not already done)
cd c:\Users\Daniel Wundengba\Desktop\DeyU\school-placement-simple
git init
git add .
git commit -m "Initial commit: School Placement System"

# Create repo on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/school-placement-simple.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy Backend to Vercel

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Deploy Backend

```bash
cd backend
vercel
```

**During deployment:**
- Select "Other" for project type
- Enter: `backend`
- Root directory: `.` (current directory)
- Build command: Leave empty (Vercel detects package.json)
- Output directory: Leave empty

### 3.3 Set Environment Variables

**In Vercel Dashboard:**
1. Go to your backend project → Settings → Environment Variables
2. Add these variables:
   ```
   MONGO_URI = mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/school-placement?retryWrites=true&w=majority
   NODE_ENV = production
   PORT = 3000 (or leave empty)
   CORS_ORIGIN = https://your-frontend-domain.vercel.app
   ```

3. **Optional - Email/SMS:**
   ```
   SMTP_HOST = smtp.sendgrid.net
   SMTP_PORT = 587
   SMTP_USER = apikey
   SMTP_PASS = your-sendgrid-api-key
   TWILIO_ACCOUNT_SID = your-sid
   TWILIO_AUTH_TOKEN = your-token
   TWILIO_FROM = +1234567890
   ```

### 3.4 Redeploy to Apply Environment Variables

```bash
vercel --prod
```

**Save the backend URL** — something like: `https://backend-xxx.vercel.app`

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Create Vercel Config for Frontend

Create `frontend/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_BASE": "@api_base_url"
  }
}
```

### 4.2 Deploy Frontend

```bash
cd frontend
vercel
```

**During deployment:**
- Framework: Select "Vite"
- Root directory: `.`
- Build: `npm run build`
- Output: `dist`

### 4.3 Set Frontend Environment Variables

**In Vercel Dashboard → Frontend Project → Settings → Environment Variables:**

```
VITE_API_BASE = https://backend-xxx.vercel.app
```

### 4.4 Redeploy Frontend

```bash
vercel --prod
```

**Save the frontend URL** — something like: `https://school-placement-web.vercel.app`

---

## Step 5: Update Configurations

### 5.1 Update Backend CORS

Go back to backend project in Vercel and update:
```
CORS_ORIGIN = https://your-frontend-url.vercel.app
```

Then redeploy backend:
```bash
cd backend
vercel --prod
```

---

## Step 6: Test the Deployment

```bash
# Test backend health
curl https://backend-xxx.vercel.app/api/health

# Test sync endpoint
curl https://backend-xxx.vercel.app/api/sync/download
```

Then open frontend in browser: **https://your-frontend-url.vercel.app**

---

## Accessing Your Live App

- **Frontend:** https://your-frontend-domain.vercel.app
- **Backend API:** https://your-backend-domain.vercel.app/api
- **Data Sync:** https://your-backend-domain.vercel.app/api/sync/download

---

## Continuous Deployment

Every time you push to GitHub, Vercel automatically redeploys:

```bash
# Make changes locally
git add .
git commit -m "New feature"
git push origin main

# Vercel automatically deploys within 1-2 minutes!
```

---

## Troubleshooting

### "Cannot connect to MongoDB"
- ✓ Verify MongoDB Atlas connection string
- ✓ Check IP whitelist (must include Vercel IPs or 0.0.0.0/0)
- ✓ Confirm username/password in MONGO_URI

### "CORS error from frontend"
- ✓ Update backend `CORS_ORIGIN` env var to frontend URL
- ✓ Redeploy backend with `vercel --prod`

### "Frontend shows blank page"
- ✓ Check browser console (F12)
- ✓ Verify `VITE_API_BASE` is set correctly
- ✓ Check Network tab for API errors

### "Build fails"
- ✓ Run `npm run build` locally first
- ✓ Check build logs in Vercel dashboard
- ✓ Ensure all dependencies are in `package.json`

### "API calls timeout"
- ✓ MongoDB Atlas free tier can be slow
- ✓ Upgrade to paid cluster for production
- ✓ Add connection pooling to backend

---

## Production Best Practices

✅ **Do:**
- Use MongoDB Atlas paid tier for production
- Set strong database password
- Enable HTTPS (automatic with Vercel)
- Add rate limiting to API endpoints
- Monitor logs in Vercel dashboard
- Back up database regularly

❌ **Don't:**
- Commit `.env` files to GitHub (use Vercel dashboard)
- Whitelist 0.0.0.0/0 for production (add specific IPs)
- Use development database for production
- Share API URLs publicly

---

## Scaling & Monitoring

**Vercel provides:**
- Automatic scaling (pay-as-you-go)
- Real-time logs
- Analytics
- Performance metrics

**Monitor at:** https://vercel.com/dashboard

---

## Support

For issues:
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- GitHub Actions for CI/CD: https://github.com/features/actions
