import { restoreDatabase } from './restoreDatabase.js'

// Simple CLI runner for restoreDatabase
// Usage: node scripts/restoreCli.js <backup-file>
async function main() {
  try {
    await restoreDatabase()
  } catch (err) {
    console.error('Restore failed:', err.message)
    process.exit(1)
  }
}

main()
