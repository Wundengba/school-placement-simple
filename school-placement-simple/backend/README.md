# Backend API Server

Express.js REST API for the School Placement System with MongoDB integration.

## Features

- RESTful API endpoints for students, schools, and placements
- MongoDB persistence with Mongoose ODM
- Comprehensive data sync (upload/download)
- Email and SMS notifications
- Performance-based placement algorithm
- Health checks and error handling
- CORS support for frontend

## Prerequisites

- Node.js v20+
- MongoDB (local or Atlas)
- npm

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file:

```env
# Database
MONGO_URI=mongodb://localhost:27017/school-placement

# Server
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:5173

# Email (Optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com

# SMS (Optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM=+1234567890
```

## Development

```bash
npm run dev
```

Starts the server with nodemon auto-reload on http://localhost:5000

## Production

```bash
npm start
```

## API Endpoints

### Health
- **GET** `/api/health` — Server status

### Students
- **GET** `/api/students` — List all students
- **POST** `/api/students` — Create student
- **GET** `/api/students/:id` — Get by ID
- **PUT** `/api/students/:id` — Update student
- **DELETE** `/api/students/:id` — Delete student

**Sample Request:**
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "indexNumber": "STU001",
    "fullName": "John Doe",
    "email": "john@example.com"
  }'
```

### Schools
- **GET** `/api/schools` — List all schools
- **POST** `/api/schools` — Create school
- **PUT** `/api/schools/:id` — Update school

**Sample Request:**
```bash
curl http://localhost:5000/api/schools?category=A&region=Greater%20Accra
```

### Placements
- **GET** `/api/placements` — List placements
- **POST** `/api/placements` — Create placement

### Sync (Frontend ↔ Backend)
- **POST** `/api/sync/upload` — Upsert data from frontend
- **GET** `/api/sync/download` — Get full database snapshot

**Upload Format:**
```json
{
  "schools": [
    {
      "externalId": 1,
      "name": "Federal Government College",
      "category": "A",
      "region": "Greater Accra",
      "capacity": 100
    }
  ],
  "students": [
    {
      "indexNumber": "STU001",
      "fullName": "John Doe",
      "email": "john@example.com"
    }
  ],
  "scores": [
    {
      "indexNumber": "STU001",
      "subjects": {
        "english": 85,
        "maths": 90,
        "science": 80,
        "socialStudies": 75,
        "crs": 88,
        "electives1": 85,
        "electives2": 90
      },
      "aggregate": 10
    }
  ],
  "preferences": [
    {
      "indexNumber": "STU001",
      "categoryA": 1,
      "categoryB": 5,
      "categoryC": 10
    }
  ]
}
```

### Notifications
- **POST** `/api/notifications/send` — Send email/SMS

**Request Format:**
```json
{
  "to": "student@example.com",
  "subject": "Placement Result",
  "message": "You have been placed in Federal Government College",
  "type": "email"
}
```

## Database Models

### Student
- `indexNumber` (String, unique) — Student identifier
- `fullName` (String) — Student name
- `email` (String) — Contact email
- `schoolPreferences` (Array of refs) — School choices
- `placedSchoolId` (ObjectId) — Assigned school
- `status` (String) — pending/placed/unplaced
- `timestamps` — Created/updated at

### School
- `externalId` (Number) — Link to frontend dataset
- `name` (String, unique) — School name
- `category` (String) — A/B/C category
- `region` (String) — Geographic region
- `capacity` (Number) — Intake capacity
- `type` (String) — Federal/State/Private
- `location` (String) — Full address
- `enrolledCount` (Number) — Current enrollment
- `contact` (Object) — Phone/email

### TestScore
- `indexNumber` (String) — Student reference
- `fullName` (String)
- `subjects` (Object) — Score breakdown
- `average` (Number) — Computed average
- `aggregate` (Number) — Placement score
- `placement` (String) — Category assigned
- `timestamps` — Metadata

### Placement
- `studentId` (ObjectId) — Student reference
- `schoolId` (ObjectId) — School assignment
- `choice` (Number) — 1/2/3 choice
- `score` (Number) — Aggregate score
- `status` (String) — placed/rejected/pending
- `placementDate` (Date) — When assigned
- `algorithm` (String) — Algorithm version

## Deployment

### Docker

Build the image:
```bash
docker build -t school-placement-api:1.0.0 .
```

Run the container:
```bash
docker run -d \
  -p 5000:5000 \
  -e MONGO_URI=mongodb://mongo:27017/school-placement \
  -e CORS_ORIGIN=https://yourdomain.com \
  school-placement-api:1.0.0
```

### Heroku

1. Create a Procfile (included)
2. Set environment variables on Heroku dashboard
3. Deploy: `git push heroku main`

### Environment Setup

Ensure these are set in your deployment platform:
- `MONGO_URI` — MongoDB connection string
- `NODE_ENV` — Set to "production"
- `CORS_ORIGIN` — Frontend URL
- Optional: SMTP credentials for email
- Optional: Twilio credentials for SMS

## Error Handling

All endpoints return standard JSON responses:

**Success (2xx):**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error (4xx/5xx):**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Logging

- Development: Console logs with colors
- Production: Logs to file (configure in index.js)

## Performance

- Indexes on `indexNumber`, `externalId`, `category`
- Query optimization for placement algorithms
- Connection pooling via Mongoose

## License

ISC
