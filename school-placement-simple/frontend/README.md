# Frontend: React Placement System UI

React 19 + Vite application for the School Placement System. Provides comprehensive UI for student registration, placement management, analytics, and admin operations.

## Features

- **Student Registration** — Welcome screen with form validation
- **Test Scores** — Multi-subject score entry (core + electives)
- **School Selection** — Browse 956 schools with search/filter
- **Placement Dashboard** — View algorithms results and metrics
- **Analytics** — Real-time placement statistics and charts
- **Bulk Operations** — Run simulations without affecting data
- **Audit & Rollback** — Snapshot and restore placements
- **Notifications** — Email/SMS student results
- **Responsive Design** — Desktop and mobile optimized
- **localStorage Persistence** — All data saved locally

## Prerequisites

- Node.js v20+
- npm

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Starts Vite dev server at http://localhost:5173

## Build for Production

```bash
npm run build
```

Creates optimized `dist/` folder (91.89 KB gzipped JS)

## Preview Production Build

```bash
npm run preview
```

Serves production build locally for testing

## Environment Variables

Create `.env.development`:
```env
VITE_API_BASE=http://localhost:5000
```

Create `.env.production`:
```env
VITE_API_BASE=https://api.yourdomain.com
```

## Directory Structure

```
frontend/src/
├── components/
│   ├── AdminPanel.jsx       # Admin operations
│   ├── Analytics.jsx        # Statistics & charts
│   ├── Dashboard.jsx        # Main student view
│   ├── Registration.jsx     # Student sign-up
│   ├── StudentDashboard.jsx # Student profile view
│   ├── Students.jsx         # All students list
│   ├── TestScores.jsx       # Score entry form
│   ├── Placement.jsx        # Placement modal (NEW)
│   ├── Simulation.jsx       # Bulk simulation (NEW)
│   ├── Audit.jsx            # Snapshot management (NEW)
│   ├── Notifications.jsx    # Email/SMS sending (NEW)
│   ├── Schools.jsx          # School browser (NEW)
│   └── SchoolSelection.jsx  # Preference picker (NEW)
├── data/
│   └── schools.js           # 956-school dataset
├── styles/
│   ├── *.css                # Component styles
│   └── index.css            # Global styles
├── App.jsx                  # Main app component
├── main.jsx                 # Vite entry point
└── index.css                # Root styles
```

## Key Components

### Dashboard
Main screen showing placement overview, student stats, and navigation.

**Data Sources:**
- `registeredStudents` (localStorage)
- `schoolSelections_*` (localStorage)
- `schools.js` (imported array)

### Analytics
Real-time metrics computed from data:
- Total students & schools
- Placement rate %
- Average aggregate score
- Grade distribution
- Top placed schools

**Calculations:**
```javascript
// Placement rate = (placed / total) * 100
// Average = sum(test scores) / count
// Grade distribution = histogram of grades 1-9
```

### TestScores
Multi-subject score entry:
- Core subjects: English, Maths, Science, Social Studies
- Electives: Any 2 subjects
- Auto-compute aggregate (4 core + 2 best)

**Aggregate Formula:**
```
Sum of:
- 4 core grades (mapped 1-9, lower is better)
- 2 best (lowest) elective grades
Result: 6-30 range
```

### Schools
Browse all 956 schools with real-time filter:
- Search by name (fuzzy match)
- Filter by category (A/B/C)
- Filter by region
- View capacity

### SchoolSelection
Student preference picker:
- Pick primary school from Category A
- Pick backup from Category B
- Pick tertiary from Category C
- Validates selections

### Placement
Modal showing:
- Formatted test scores
- Selected preferences
- Placed school (if assigned)
- Placement date & status

### Simulation
Bulk operations:
- Run placement algorithm (non-destructive)
- Preview results
- Export CSV
- Commit if satisfied

### Audit
Snapshot management:
- List all snapshots (with timestamps)
- Preview snapshot data
- Restore previous placement
- Delete unused snapshots

## Data Structure

### localStorage Keys

**Main Collections:**
- `registeredStudents` — JSON array of student objects
- `allTestScores` — JSON array of score entries
- `schoolSelections_<studentId>` — Preferences per student

**Snapshots:**
- `placement_snapshot_<timestamp>` — Placement state
- `snapshots_metadata` — List of snapshots

### Data Objects

**Student:**
```javascript
{
  id: "stu001",
  indexNumber: "STU001",
  fullName: "John Doe",
  email: "john@example.com",
  category: "A", // Category chosen
  createdAt: timestamp
}
```

**TestScore:**
```javascript
{
  indexNumber: "STU001",
  english: 85,
  maths: 90,
  science: 80,
  socialStudies: 75,
  crs: 88,
  electives1: 85,
  electives2: 90,
  average: 85.7,
  aggregate: 10 // 4 core + 2 best electives
}
```

**SchoolSelection:**
```javascript
{
  studentId: "stu001",
  categoryA: 1,    // School ID for Category A choice
  categoryB: 5,
  categoryC: 10,
  createdAt: timestamp
}
```

## Algorithms

### Score Aggregation
```javascript
// Grade mapping (BECE scale)
90-100 → 1 (best)
80-89 → 2
70-79 → 3
60-69 → 4
55-59 → 5
50-54 → 6
< 50 → 9 (worst)

// Aggregate = sum of:
// 1. 4 core grades (English, Maths, Science, Social Studies)
// 2. 2 best (lowest values) electives
// Result: 6-30 range
```

### Placement Algorithm
```javascript
// 1. Sort students by aggregate (ascending, best first)
// 2. For each student:
//    a. Try Category A choice
//    b. If school full, try Category B
//    c. If no B, try Category C
//    d. If still no placement, mark as unplaced
// 3. Respect school capacity (default 100)
```

## Styling

All components use scoped CSS modules in `styles/`:
- Dark theme with accent colors
- Responsive grid layouts
- Mobile-first media queries
- Accessibility-ready (semantic HTML)

## API Integration

Frontend calls backend via environment-based `VITE_API_BASE`:

```javascript
// Development
https://localhost:5000/api/students

// Production
https://api.yourdomain.com/api/students
```

### Key Endpoints Used

**Sync Operations:**
- `POST /api/sync/upload` — Upload data to backend
- `GET /api/sync/download` — Get database snapshot

**Notifications:**
- `POST /api/notifications/send` — Email/SMS

**Data Fetch:**
- `GET /api/schools` — Get all schools
- `GET /api/students` — Get all students

## Deployment

### Static Build
```bash
npm run build
# dist/ folder ready for:
# - Vercel, Netlify
# - AWS S3 + CloudFront
# - GitHub Pages
# - Any static host
```

### Docker
```bash
# Multi-stage build creates optimized Nginx image
docker build -t school-placement-web:1.0.0 .
docker run -d -p 80:80 school-placement-web:1.0.0
```

### Environment Setup

For production, set `VITE_API_BASE` to your backend URL:

**Via build-time env file (.env.production):**
```
VITE_API_BASE=https://api.yourdomain.com
```

**Via runtime config (in docker-entrypoint):**
- Set process.env.VITE_API_BASE before build
- Or inject at runtime via nginx config

## Performance

- Vite: Fast HMR dev experience
- Production build: 91.89 KB gzipped JS
- CSS: 6.72 KB gzipped
- No unnecessary re-renders (React 19 optimization)
- localStorage for offline support

## Browser Support

- Chrome > 90
- Firefox > 88
- Safari > 14
- Edge > 90

## Troubleshooting

**Blank page?**
- Check browser console (F12)
- Verify API base URL in .env
- Check network calls (Network tab)

**API errors?**
- Ensure backend is running (http://localhost:5000/api/health)
- Check CORS settings
- Verify VITE_API_BASE is set

**Build issues?**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear dist: `rm -rf dist`
- Check Node version: `node --version` (should be v20+)

## Development Tips

- Use React DevTools extension for debugging
- Check localStorage in DevTools → Application tab
- Network tab shows API calls
- Hot Module Replacement (HMR) for instant updates

## License

ISC
