#!/usr/bin/env pwsh
# This script sets environment variables in Vercel for the backend project
# Run: pwsh .\set-vercel-env.ps1

$ProjectName = "backend"
$DatabaseUrl = "postgresql://neondb_owner:npg_BloZTI9q5EJd@ep-shy-star-ailugefe-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$JwtSecret = "your_jwt_secret_key_here_change_in_production"

Write-Host "Setting environment variables for Vercel... " -ForegroundColor Cyan

# Note: Vercel CLI doesn't support non-interactive env var setting
# You must manually go to Vercel dashboard and set:
# https://vercel.com/daniel-wundengbas-projects/backend/settings/environment-variables
#
# Variables to add:
# - Name: DATABASE_URL
#   Value: $DatabaseUrl
#   Environments: Production
#
# - Name: JWT_SECRET  
#   Value: $JwtSecret
#   Environments: Production
#
# - Name: NODE_ENV
#   Value: production
#   Environments: Production

Write-Host "
❌ Vercel CLI does not support non-interactive env var setup via command line.

✅ MANUAL SETUP REQUIRED:

1. Go to: https://vercel.com/login
2. Select project: daniel-wundengbas-projects/backend
3. Click: Settings > Environment Variables
4. Click: Add New (for each variable below)

Variable 1 - DATABASE_URL:
  Name: DATABASE_URL
  Value: $DatabaseUrl
  Environment: Production

Variable 2 - JWT_SECRET:
  Name: JWT_SECRET
  Value: $JwtSecret
  Environment: Production

5. After adding all variables, redeploy:
   vercel --prod --yes

This is a Vercel security limitation - environment variables cannot be set via CLI.
" -ForegroundColor Yellow
