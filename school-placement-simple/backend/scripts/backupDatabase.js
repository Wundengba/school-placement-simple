import fs from 'fs'
import path from 'path'
import prisma from '../src/config/prisma.js'

/**
 * Database Backup Script
 * Exports all database data to a JSON file for backup/migration purposes
 * 
 * Usage: npm run backup
 * Output: backups/backup_YYYY-MM-DD.json
 */

export async function backupDatabase() {
  const backupsDir = path.resolve('./backups')
  
  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true })
    console.log(`📁 Created backups directory: ${backupsDir}`)
  }
  
  try {
    console.log(`\n📦 Starting database backup...`)
    
    // Fetch all data in parallel
    const [students, schools, placements] = await Promise.all([
      prisma.student.findMany({ include: { schoolPreferences: { include: { school: true } } } }),
      prisma.school.findMany({ include: { streams: true } }),
      prisma.placement.findMany({ include: { student: true, school: true } })
    ])
    
    // Create backup object
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      database: 'neon-postgresql',
      metadata: {
        studentCount: students.length,
        schoolCount: schools.length,
        placementCount: placements.length,
        totalRecords: students.length + schools.length + placements.length
      },
      students,
      schools,
      placements
    }
    
    // Generate filename with date
    const dateStr = new Date().toISOString().split('T')[0]
    const timeStr = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-')
    const filename = `backup_${dateStr}_${timeStr}.json`
    const filepath = path.join(backupsDir, filename)
    
    // Write backup file
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2))
    
    const fileSize = (fs.statSync(filepath).size / 1024).toFixed(2)
    
    console.log(`\n✅ BACKUP CREATED SUCCESSFULLY`)
    console.log(`\n📋 Backup Information:`)
    console.log(`   File: ${filename}`)
    console.log(`   Path: ${filepath}`)
    console.log(`   Size: ${fileSize} KB`)
    console.log(`\n📊 Data Summary:`)
    console.log(`   - Students: ${students.length}`)
    console.log(`   - Schools: ${schools.length}`)
    console.log(`   - Placements: ${placements.length}`)
    console.log(`   - Total: ${backup.metadata.totalRecords} records`)
    console.log(`\n🔄 To restore from this backup, run:`)
    console.log(`   npm run restore -- backups/${filename}`)
    
  } catch (err) {
    console.error(`\n❌ Backup failed:`, err.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Note: this module exports `backupDatabase` for programmatic use.
// To run directly use the runner `backupDatabaseRunner.js` or call this function.
