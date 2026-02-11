import { execSync } from 'child_process'

export function runMigrationsSync() {
  console.log('[MIGRATIONS-SYNC] Starting synchronous Prisma schema sync...')
  console.log('[MIGRATIONS-SYNC] DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set')
  
  try {
    // Use db push with skip-validate for serverless compatibility
    console.log('[MIGRATIONS-SYNC] Running: prisma db push --skip-validate...')
    const output = execSync('npx prisma db push --skip-validate --skip-generate', {
      timeout: 120000,
      maxBuffer: 5 * 1024 * 1024,
      encoding: 'utf-8'
    })
    console.log('[MIGRATIONS-SYNC] Output:', output)
    console.log('[MIGRATIONS-SYNC] ✅ Schema synced successfully!')
    return true
  } catch (error) {
    console.error('[MIGRATIONS-SYNC] ❌ Schema sync failed')
    console.error('[MIGRATIONS-SYNC] Error:', error.message)
    if (error.stdout) console.error('[MIGRATIONS-SYNC] stdout:', error.stdout)
    if (error.stderr) console.error('[MIGRATIONS-SYNC] stderr:', error.stderr)
    
    // Log but continue - tables might already exist
    console.log('[MIGRATIONS-SYNC] ⚠️  Continuing anyway (tables may already exist)')
    return false
  }
}

// Async version for non-blocking call
export async function runMigrations() {
  return new Promise((resolve) => {
    try {
      runMigrationsSync()
      resolve()
    } catch (error) {
      console.error('[MIGRATIONS] Async wrapper error:', error.message)
      resolve() // Always resolve to not block
    }
  })
}
