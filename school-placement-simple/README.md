# School Placement System

A production-ready full-stack application for managing school placements with automated placement algorithms, real-time analytics, and bulk operations. Built with React, Node.js, and MongoDB.

## ✨ Features

- **Student Management** — Register students, manage profiles, track history
- **Test Scores** — Enter and aggregate scores (core + best 2 electives)
- **School Selection** — Students select preferences (Categories A, B, C)
- **Automated Placement** — Performance-based placement algorithm
- **Bulk Operations** — Run non-destructive placement simulations
- **Audit & Rollback** — Snapshot placements and restore previous states
- **Analytics Dashboard** — Real-time charts and statistics
- **CSV Data Sync** — Upload/download via REST API or UI
- **Notifications** — Automated email/SMS to students
- **Responsive UI** — Works on desktop and mobile
- **Production Ready** — Docker, Nginx, security best practices

## 📦 Project Structure

```
school-placement-simple/
├── frontend/              # React Vite application
│   ├── src/
│   │   ├── components/    # React components (Dashboard, Analytics, etc.)
│   │   ├── data/          # 956-school dataset
│   │   ├── styles/        # Component styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── dist/              # Production build
│   ├── nginx.conf         # Nginx configuration for deployment
│   ├── Dockerfile         # Multi-stage Docker build
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
├── backend/               # Express.js API server
│   ├── src/
│   │   ├── config/        # MongoDB configuration
│   │   ├── controllers/   # API controllers (placement, sync, notifications)
│   │   ├── models/        # MongoDB schemas (Student, School, TestScore, Placement)
│   │   ├── routes/        # API routes
│   │   └── index.js       # Server entry point
│   ├── Dockerfile         # Lean Node.js image
│   ├── package.json
│   └── .env
├── docker-compose.yml     # Multi-container orchestration
├── PRODUCTION_DEPLOYMENT.md  # Complete deployment guide
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js v20+
- Docker & Docker Compose (recommended)
- MongoDB (local, Atlas, or via Docker)

### Option 1: Docker Compose (Recommended)

```bash
docker-compose up --build
```

Then open:
- Frontend: http://localhost
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### Option 2: Local Development

1. **Install dependencies:**
```bash
cd frontend && npm install
cd ../backend && npm install
```

2. **Create `backend/.env`:**
```env
MONGO_URI=mongodb://localhost:27017/school-placement
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

3. **Start MongoDB:**
```bash
mongod  # or use Docker: docker run -d -p 27017:27017 mongo
```

4. **Start backend and frontend:**
```bash
cd backend && npm run dev  # Terminal 1
cd frontend && npm run dev # Terminal 2
```

Access app at http://localhost:5173

## 📊 Core Algorithms

### Score Aggregation (Core + Best 2)
1. Calculate average across all subjects
2. Map to grades 1-9 (best to worst): 90-100→1, ..., 50-54→8, <50→9
3. Sum: 4 core grades (English, Math, Science, Social Studies) + 2 best (lowest) electives
4. Placement category: A (6-9), B (10-15), C (16-30), Not Qualified (>30)

### Placement (Performance-First)
1. Sort students by aggregate (best first)
2. Try to place in preference category (A, B, or C)
3. If school capacity available, assign; else try next preference
4. Return placed/pending/unplaced status

## 📚 API Endpoints

### Students
- `GET /api/students` — List all students
- `POST /api/students` — Create student
- `GET /api/students/:id` — Get by ID
- `PUT /api/students/:id` — Update student
- `DELETE /api/students/:id` — Delete student

### Schools
- `GET /api/schools` — List all schools
- `POST /api/schools` — Create school
- `PUT /api/schools/:id` — Update school

### Placements
- `GET /api/placements` — List placements
- `POST /api/placements` — Create placement

### Sync (Frontend ↔ Backend)
- `POST /api/sync/upload` — Upload data to database
- `GET /api/sync/download` — Download database snapshot

### Notifications
- `POST /api/notifications/send` — Send email/SMS

### Health
- `GET /api/health` — Server status

## 📦 Production Build

Build frontend for deployment:
```bash
cd frontend
npm run build
# Output: dist/ (ready for any static host)
```

## 🐳 Docker Deployment

Build individual images:
```bash
# Backend
cd backend
docker build -t school-placement-api:1.0.0 .

# Frontend
cd frontend
docker build -t school-placement-web:1.0.0 .
```

See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for cloud deployment (Heroku, Render, AWS, Vercel).

## 🔧 Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/school-placement
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://yourdomain.com

# Optional: Email/SMS
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-api-key
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_FROM=+1234567890
```

### Frontend (.env.production)
```
VITE_API_BASE=https://api.yourdomain.com
```

## 🐛 Troubleshooting

**Blank frontend page?**
- Check browser console (F12)
- Verify VITE_API_BASE is set

**Backend connection error?**
- Ensure MongoDB is running
- Check MONGO_URI and IP whitelist (Atlas)

**Port already in use?**
- `lsof -ti:5000 | xargs kill -9` (macOS/Linux)
- `netstat -ano | findstr ":5000"` (Windows)

## 📄 License

ISC — Educational project

## 📚 Documentation

- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) — Full deployment guide
- Backend README: [backend/README.md](./backend/README.md)
- Frontend README: [frontend/README.md](./frontend/README.md)
