import { execSync } from 'child_process'

export function runMigrationsSync() {
  console.log('[MIGRATIONS-SYNC] Starting synchronous Prisma migrations...')
  console.log('[MIGRATIONS-SYNC] DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set')
  
  try {
    // First try: prisma migrate deploy to apply pending migrations
    console.log('[MIGRATIONS-SYNC] Running: prisma migrate deploy...')
    const output = execSync('npx prisma migrate deploy --skip-generate', {
      timeout: 120000,
      maxBuffer: 5 * 1024 * 1024,
      encoding: 'utf-8'
    })
    console.log('[MIGRATIONS-SYNC] Output:', output)
    console.log('[MIGRATIONS-SYNC] ✅ Migrations applied successfully!')
    return true
  } catch (error) {
    console.error('[MIGRATIONS-SYNC] ❌ Migrate deploy failed, trying db push...')
    console.error('[MIGRATIONS-SYNC] Error:', error.message)
    
    // Fallback: try db push for serverless environments
    try {
      console.log('[MIGRATIONS-SYNC] Running fallback: prisma db push --skip-validate...')
      const pushOutput = execSync('npx prisma db push --skip-validate --skip-generate', {
        timeout: 120000,
        maxBuffer: 5 * 1024 * 1024,
        encoding: 'utf-8'
      })
      console.log('[MIGRATIONS-SYNC] Fallback output:', pushOutput)
      console.log('[MIGRATIONS-SYNC] ✅ Schema synced with db push!')
      return true
    } catch (fallbackError) {
      console.error('[MIGRATIONS-SYNC] ❌ Both migrate deploy and db push failed')
      console.error('[MIGRATIONS-SYNC] Fallback error:', fallbackError.message)
      
      // Log but continue - tables might already exist
      console.log('[MIGRATIONS-SYNC] ⚠️  Continuing anyway (tables may already exist)')
      return false
    }
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
