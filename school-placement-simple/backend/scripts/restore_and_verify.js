import { restoreDatabase } from './restoreDatabase.js'
import prisma from '../src/config/prisma.js'
import path from 'path'

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('Usage: node scripts/restore_and_verify.js <backup-file>')
    process.exit(1)
  }
  const backupFile = args[0]
  const backupPath = path.resolve(backupFile)
  if (!backupPath) {
    console.error('Backup file required')
    process.exit(1)
  }

  // Run restore (will prompt for confirmation unless SKIP_CONFIRM=true)
  await restoreDatabase()

  // After restore, verify counts
  try {
    const studentCount = await prisma.student.count()
    const schoolCount = await prisma.school.count()
    const placementCount = await prisma.placement.count()

    console.log('\n🔎 Verification:')
    console.log(`   Students: ${studentCount}`)
    console.log(`   Schools: ${schoolCount}`)
    console.log(`   Placements: ${placementCount}`)
  } catch (err) {
    console.error('Verification failed:', err.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(err => { console.error(err); process.exit(1) })
