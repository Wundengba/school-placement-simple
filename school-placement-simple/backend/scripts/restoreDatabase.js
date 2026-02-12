import fs from 'fs'
import path from 'path'
import prisma from '../src/config/prisma.js'

/**
 * Database Restore Script
 * Restores data from a JSON backup file into the Neon PostgreSQL database
 * 
 * Usage: npm run restore -- [backup-file]
 * Example: npm run restore -- backups/backup_2026-02-11.json
 */

async function restoreDatabase() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('❌ Error: No backup file specified')
    console.log('\nUsage: npm run restore -- <backup-file>')
    console.log('Example: npm run restore -- backups/backup_2026-02-11.json')
    console.log('\nTo list available backups, run: npm run list-backups')
    process.exit(1)
  }
  
  const backupFile = args[0]
  const backupPath = path.resolve(backupFile)
  
  // Validate file exists
  if (!fs.existsSync(backupPath)) {
    console.log(`❌ Error: Backup file not found: ${backupPath}`)
    process.exit(1)
  }
  
  console.log(`\n🔄 Reading backup file: ${backupFile}`)
  
  try {
    // Read and parse backup
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'))
    
    const { students, schools, placements, metadata, timestamp } = backupData
    
    console.log(`\n📋 Backup Information:`)
    console.log(`   Created: ${timestamp}`)
    console.log(`   Students: ${metadata?.studentCount || students?.length || 0}`)
    console.log(`   Schools: ${metadata?.schoolCount || schools?.length || 0}`)
    console.log(`   Placements: ${placements?.length || 0}`)
    
    // Ask for confirmation
    console.log(`\n⚠️  WARNING: This will restore data from the backup.`)
    console.log(`   Existing data will be OVERWRITTEN or MERGED.`)
    
    const confirmRestore = process.env.SKIP_CONFIRM === 'true' ? 'yes' : 
      await promptUser('\nContinue restore? (yes/no): ')
    
    if (confirmRestore.toLowerCase() !== 'yes' && confirmRestore.toLowerCase() !== 'y') {
      console.log('❌ Restore cancelled')
      process.exit(0)
    }
    
    console.log(`\n🔄 Starting restore process...`)
    
    // Restore schools
    if (schools && Array.isArray(schools) && schools.length > 0) {
      console.log(`\n📍 Restoring ${schools.length} schools...`)
      let restored = 0
      for (const school of schools) {
        try {
          await prisma.school.upsert({
            where: { id: school.id },
            update: {
              name: school.name,
              category: school.category,
              streams: school.streams ? { set: school.streams } : undefined,
              updatedAt: new Date()
            },
            create: {
              id: school.id,
              name: school.name,
              category: school.category,
              streams: school.streams || []
            }
          })
          restored++
        } catch (err) {
          console.warn(`   ⚠️  Failed to restore school ${school.id}: ${err.message}`)
        }
      }
      console.log(`   ✅ Restored ${restored}/${schools.length} schools`)
    }
    
    // Restore students
    if (students && Array.isArray(students) && students.length > 0) {
      console.log(`\n👤 Restoring ${students.length} students...`)
      let restored = 0
      for (const student of students) {
        try {
          const { schoolPreferences, ...studentData } = student
          
          await prisma.student.upsert({
            where: { id: student.id },
            update: {
              ...studentData,
              updatedAt: new Date()
            },
            create: {
              ...studentData,
              createdAt: student.createdAt ? new Date(student.createdAt) : new Date(),
              updatedAt: student.updatedAt ? new Date(student.updatedAt) : new Date()
            }
          })
          restored++
        } catch (err) {
          console.warn(`   ⚠️  Failed to restore student ${student.indexNumber}: ${err.message}`)
        }
      }
      console.log(`   ✅ Restored ${restored}/${students.length} students`)
    }
    
    // Restore placements
    if (placements && Array.isArray(placements) && placements.length > 0) {
      console.log(`\n🎓 Restoring ${placements.length} placements...`)
      let restored = 0
      for (const placement of placements) {
        try {
          const { student, school, ...placementData } = placement
          
          await prisma.placement.upsert({
            where: { id: placement.id },
            update: {
              ...placementData,
              updatedAt: new Date()
            },
            create: {
              ...placementData,
              createdAt: placement.createdAt ? new Date(placement.createdAt) : new Date(),
              updatedAt: placement.updatedAt ? new Date(placement.updatedAt) : new Date()
            }
          })
          restored++
        } catch (err) {
          console.warn(`   ⚠️  Failed to restore placement ${placement.id}: ${err.message}`)
        }
      }
      console.log(`   ✅ Restored ${restored}/${placements.length} placements`)
    }
    
    console.log(`\n✅ RESTORE COMPLETED SUCCESSFULLY`)
    console.log(`\n📊 Summary:`)
    console.log(`   - Schools: ${schools?.length || 0}`)
    console.log(`   - Students: ${students?.length || 0}`)
    console.log(`   - Placements: ${placements?.length || 0}`)
    console.log(`   - Total records: ${(schools?.length || 0) + (students?.length || 0) + (placements?.length || 0)}`)
    
  } catch (err) {
    console.error(`\n❌ Restore failed:`, err.message)
    if (err instanceof SyntaxError) {
      console.error(`   The backup file appears to be corrupted or invalid JSON`)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Prompt for user input (for terminal confirmation)
 */
function promptUser(question) {
  return new Promise((resolve) => {
    process.stdout.write(question)
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim())
    })
  })
}

// Run restore
restoreDatabase()
