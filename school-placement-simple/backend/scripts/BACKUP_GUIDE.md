# Database Backup & Restore Guide

## Overview

The backend includes automated backup and restore scripts for the Neon PostgreSQL database. You can easily create backups, list them, and restore data when needed.

---

## Quick Start

### Create a Backup
```bash
npm run backup
```
Creates a JSON file in `backend/backups/` with all database data (students, schools, placements).

### List Available Backups
```bash
npm run list-backups
```
Shows all backup files with details (size, creation date, record counts).

### Restore from Backup
```bash
npm run restore -- backups/backup_2026-02-11_15-30-45.json
```
Prompts for confirmation, then restores data from the backup file.

---

## What Gets Backed Up

Each backup includes:
- ✅ All students (profiles, contact info, status)
- ✅ All schools (categories, streams)
- ✅ All placements (assignments, status)
- ✅ School preferences/selections
- ✅ Timestamps and metadata

**NOT Included:**
- ❌ User passwords (secure hash only in DB)
- ❌ Admin tokens (session-based)

---

## Backup Features

### Automatic Metadata
```json
{
  "timestamp": "2026-02-11T15:30:45.123Z",
  "version": "1.0",
  "database": "neon-postgresql",
  "metadata": {
    "studentCount": 150,
    "schoolCount": 25,
    "placementCount": 120,
    "totalRecords": 295
  }
}
```

### File Naming
Backups are named: `backup_YYYY-MM-DD_HH-mm-ss.json`
Example: `backup_2026-02-11_15-30-45.json`

### File Size
Typical backup sizes:
- 150 students + 25 schools = ~100-200 KB
- Can be stored in Git, OneDrive, or cloud storage

---

## Restore Features

### Safe Restoration
1. **Validation** - Checks if backup file exists and is valid JSON
2. **Preview** - Shows backup info before restoring
3. **Confirmation** - Asks for `yes/no` confirmation
4. **Progress** - Shows restore progress per table
5. **Error Handling** - Continues on individual record failures

### Restore with Conditions
```bash
# Auto-confirm without prompting (for scripts)
SKIP_CONFIRM=true npm run restore -- backups/backup_2026-02-11_15-30-45.json

# Skip confirmation and pipe response
echo "yes" | npm run restore -- backups/backup_2026-02-11_15-30-45.json
```

### What Happens During Restore
- **Upsert operation**: Creates new or updates existing records
- **Preserved timestamps**: Original `createdAt` timestamps maintained
- **Partial success**: If 1 record fails, others still restore
- **No deletion**: Old data not removed unless explicitly overwritten

---

## Use Cases

### 1. **Regular Backups** (Weekly)
```bash
npm run backup
# Run weekly script to backup to cloud storage
```

### 2. **Data Migration**
```bash
# Export from production
npm run backup

# Transfer backup file to new server
npm run restore -- backups/backup_production.json
```

### 3. **Testing**
```bash
# Create backup of current state
npm run backup

# Make changes to database
# ... test features ...

# Restore to previous state
npm run restore -- backups/backup_before_test.json
```

### 4. **Disaster Recovery**
```bash
# In case of data loss, restore from latest backup
npm run restore -- backups/backup_2026-02-11_15-30-45.json
```

---

## Backup Storage Recommendations

### Local Storage
```
backend/
├── backups/
│   ├── backup_2026-02-11_15-30-45.json
│   ├── backup_2026-02-10_09-15-22.json
│   └── backup_2026-02-09_14-20-33.json
└── ...
```

### Cloud Storage (Recommended)
- **Neon Dashboard** - Automatic backups (7 days retention)
- **Google Drive** - Manual upload of JSON backups
- **GitHub** - Commit backups to private repo
- **AWS S3** - Automated backup upload (premium)

### Neon Native Backups
Check your Neon Console for automatic backups:
1. Go to https://console.neon.tech
2. Select your project
3. Click **Backups** tab
4. View automatic daily backups with restore options

---

## Backup Strategy (Recommended)

### Development
```bash
# Before major changes
npm run backup
# ... make changes ...
npm run restore -- backups/backup_before_refactor.json  # if needed
```

### Staging
```bash
# Weekly backup
0 0 * * 0 cd ~/app && npm run backup  # Runs Sunday at midnight
```

### Production
Upload to Neon automatic backups + Manual weekly exports:
```bash
npm run backup && \
cp backend/backups/backup_*.json /backups/cloud/ && \
# Sync to cloud storage
```

---

## Troubleshooting

### "Backup file not found"
```bash
# Check if file exists
npm run list-backups

# Create new backup
npm run backup
```

### Backup file is corrupted
```bash
# Try restoring from previous backup
npm run list-backups
npm run restore -- backups/backup_previous_date.json
```

### Restore hangs/freezes
```bash
# Timeout after 30 seconds
timeout 30 npm run restore -- backups/backup_file.json

# Or use manual SQL restore (see below)
```

### Large dataset restores slowly
```bash
# Restore in smaller batches (requires editing script)
# Or use Neon's COPY command for mass insert
```

---

## Advanced: Manual SQL Restore

If JSON restore fails, use PostgreSQL's native tools:

```bash
# Export as SQL
pg_dump postgresql://user:pass@host/dbname > backup.sql

# Restore from SQL
psql postgresql://user:pass@host/dbname < backup.sql
```

---

## Script Reference

| Command | Purpose |
|---------|---------|
| `npm run backup` | Create backup JSON file |
| `npm run restore -- <file>` | Restore from backup |
| `npm run list-backups` | List all available backups |
| `npm run backup && npm run list-backups` | Backup and verify |

---

## Security Notes

⚠️ **Important:**
- Backups contain **all** database data including student information
- Store in **secure, private** locations (not public repos)
- Use **encrypted** storage for sensitive data
- Regularly test restores to ensure backups work
- Keep Neon automatic backups as primary recovery method

---

## Need Help?

- **Backup file too large?** - Use SQL export instead
- **Restore not working?** - Check file path and file validity
- **Want daily automated backups?** - Use GitHub Actions or cron jobs
- **Database lost?** - Use Neon's automatic backups (7-day retention)

For more info: https://neon.tech/docs/manage/backups
