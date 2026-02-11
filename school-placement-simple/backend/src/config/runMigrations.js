import { execSync } from 'child_process'

export function runMigrationsSync() {
  console.log('[MIGRATIONS-SYNC] Starting synchronous Prisma migrations...')
  console.log('[MIGRATIONS-SYNC] DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set')
  
  try {
    // Use migrate deploy to actually apply pending migrations
    console.log('[MIGRATIONS-SYNC] Running: prisma migrate deploy...')
    const output = execSync('npx prisma migrate deploy --skip-generate', {
      timeout: 120000,
      maxBuffer: 5 * 1024 * 1024,
      encoding: 'utf-8'
    })
    console.log('[MIGRATIONS-SYNC] ✅ Migrations deployed successfully!')
    console.log('[MIGRATIONS-SYNC] Output:', output)
    return true
  } catch (error) {
    console.error('[MIGRATIONS-SYNC] ❌ Migration deploy failed')
    console.error('[MIGRATIONS-SYNC] Error:', error.message)
    if (error.stdout) console.error('[MIGRATIONS-SYNC] stdout:', error.stdout)
    if (error.stderr) console.error('[MIGRATIONS-SYNC] stderr:', error.stderr)
    
    // Log but continue - migrations might have already been applied during build
    console.log('[MIGRATIONS-SYNC] ⚠️  Continuing anyway (migrations may have been applied during build)')
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
