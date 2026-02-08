# Production Deployment Guide

This guide covers deploying the School Placement System to production.

## Pre-Deployment Checklist

- [ ] Environment variables configured for both frontend and backend
- [ ] MongoDB Atlas instance set up (or managed MongoDB service)
- [ ] Frontend built and optimized (`npm run build`)
- [ ] Backend dependencies installed (`npm install`)
- [ ] CORS origins configured for production domain
- [ ] Email/SMS providers configured (Nodemailer SMTP, Twilio)
- [ ] Error logging and monitoring set up
- [ ] Database backups configured
- [ ] Security headers enabled (HTTPS enforced)

## Backend Deployment

### Environment Variables (.env)

Required for production:

```
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/school-placement?retryWrites=true&w=majority

# Server
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://yourdomain.com

# Email (Nodemailer/SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM="School Placement <noreply@yourdomain.com>"

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM=+1234567890

# JWT (optional, for future auth)
JWT_SECRET=your-secure-random-secret
```

### Backend Deployment Steps

**Using a Cloud Service (Heroku/Render/Railway):**

1. Add Procfile to root:
```
web: npm start
```

2. Ensure package.json has `"start": "node src/index.js"`

3. Push to git and deploy:
```bash
# Heroku example
heroku create school-placement-api
heroku config:set MONGO_URI=mongodb+srv://...
git push heroku main
```

**Using Docker:**

1. Create `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY src ./src
ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm", "start"]
```

2. Build and push:
```bash
docker build -t school-placement-api:1.0.0 .
docker tag school-placement-api:1.0.0 your-registry/school-placement-api:1.0.0
docker push your-registry/school-placement-api:1.0.0
```

### Backend Best Practices

- Use environment variables for all secrets (no hardcoded keys).
- Enable HTTPS for all API requests.
- Set `NODE_ENV=production` to optimize performance.
- Implement request logging (Morgan middleware).
- Set up monitoring (Datadog, New Relic, or Sentry).
- Configure MongoDB backups (Atlas automatic backups or snapshots).
- Rate limit endpoints to prevent abuse.
- Use GZIP compression for responses.

## Frontend Deployment

### Production Build

```bash
npm run build
# Output: dist/ folder ready for static hosting
```

### Deployment Options

**Option 1: Static Hosting (Vercel, Netlify, AWS S3)**

1. Upload `dist/` folder.
2. Configure `VITE_API_BASE` environment variable:
```
VITE_API_BASE=https://api.yourdomain.com
```
3. Enable redirects/rewrites for SPA routing (single-page app fallback to index.html).

**Option 2: Docker + Reverse Proxy (Nginx)**

1. Create `Dockerfile`:
```dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Create `nginx.conf`:
```nginx
events { worker_connections 1024; }
http {
  server {
    listen 80;
    location / {
      root /usr/share/nginx/html;
      try_files $uri $uri/ /index.html;
    }
    location /api {
      proxy_pass http://api-backend:5000;
      proxy_set_header X-Forwarded-For $remote_addr;
    }
  }
}
```

**Option 3: CDN + API Gateway (Cloudflare, AWS CloudFront)**

1. Deploy `dist/` to CDN.
2. Configure API gateway to proxy `/api/*` to backend.
3. Enable caching for static assets (CSS, JS, images).

### Frontend Environment Setup

Create `.env.production`:
```
VITE_API_BASE=https://api.yourdomain.com
```

Build with env:
```bash
npm run build  # Will use .env.production automatically
```

## Database Setup

### MongoDB Atlas (Recommended)

1. Create a free or paid cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas).
2. Create a database user with strong password.
3. Whitelist your deployment IP addresses.
4. Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/dbname`
5. Set `MONGO_URI` in backend `.env`.

### Local MongoDB (Development Only)

```bash
# macOS (Homebrew)
brew install mongodb-community
brew services start mongodb-community

# Linux (Ubuntu)
sudo apt-get install mongodb
sudo systemctl start mongodb

# Windows (Installer)
# Download and install from https://www.mongodb.com/try/download/community
```

## Security Checklist

- [ ] All endpoints use HTTPS (SSL/TLS certificate).
- [ ] CORS configured to allow only your domain(s).
- [ ] API rate limiting enabled (e.g., 100 requests per minute per IP).
- [ ] Input validation on all endpoints.
- [ ] Sensitive data (passwords, API keys) not logged.
- [ ] Database backups scheduled and tested.
- [ ] Monitoring and alerts configured for errors and downtime.
- [ ] Security headers set (X-Frame-Options, Content-Security-Policy, etc.).
- [ ] API keys and secrets rotated regularly.
- [ ] Debug mode disabled in production (`NODE_ENV=production`).

## Monitoring & Logging

### Server Logs

Monitor backend logs for errors:
```bash
# Heroku
heroku logs --tail

# Docker
docker logs -f <container-id>

# Server SSH
tail -f /var/log/app.log
```

### Application Monitoring

Set up error tracking:
- **Sentry**: Free tier for error tracking
- **Datadog**: APM and infrastructure monitoring
- **New Relic**: Full-stack monitoring
- **LogRocket**: Frontend error tracking

### Endpoints to Monitor

- `GET /api/health` — Server status
- `POST /api/sync/upload` — Data sync operations
- `GET /api/sync/download` — Database snapshot requests
- `POST /api/notifications/send` — Notification delivery

## Performance Optimization

- **Frontend**: Lazy load components, tree-shake unused code (Vite does this).
- **Backend**: Use pagination for large datasets, cache frequently accessed data.
- **Database**: Index commonly queried fields (indexNumber, externalId, placement).
- **CDN**: Cache static assets (HTML, CSS, JS) with long TTLs.
- **Compression**: Enable gzip compression on all responses.

## Rollback Plan

1. Keep previous version docker images/builds tagged.
2. Maintain database backups before each deployment.
3. Use feature flags for risky changes (optional).
4. Test critical paths in staging before production.
5. Have a quick rollback script ready:
```bash
# Docker rollback example
docker service update --image school-placement-api:previous-version school-placement
```

## Post-Deployment

1. Run smoke tests against production endpoints.
2. Verify analytics and reports are calculating correctly.
3. Check that notifications are sending successfully.
4. Monitor logs for errors over first 24 hours.
5. Document any deviations from this guide.

## Troubleshooting

**Frontend blank page:**
- Check browser console for errors.
- Verify `VITE_API_BASE` is set correctly.
- Ensure `index.html` is being served for all SPA routes.

**API connection errors:**
- Verify backend is running and accessible.
- Check CORS configuration matches frontend domain.
- Check firewall/security group rules allow traffic.

**Database connection errors:**
- Verify `MONGO_URI` is correct and MongoDB is running.
- Check IP whitelist in MongoDB Atlas.
- Ensure database user has correct permissions.

**Email/SMS not sending:**
- Verify SMTP/Twilio credentials are correct.
- Check email limits and account status.
- Review backend logs for errors.

## Support

For deployment issues:
- Check backend logs: `npm run dev` or `docker logs`
- Verify environment variables are set.
- Test endpoints manually: `curl http://api.localhost:5000/api/health`
- Review this guide for missed steps.
