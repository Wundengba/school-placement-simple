import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function runMigrations() {
  console.log('[MIGRATIONS] Starting Prisma schema sync...')
  console.log('[MIGRATIONS] DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set')
  
  try {
    // Try migrate deploy first (production-safe)
    console.log('[MIGRATIONS] Attempting: prisma migrate deploy...')
    try {
      const { stdout: migrateOutput, stderr: migrateStderr } = await execAsync('npx prisma migrate deploy --skip-generate', {
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024
      })
      console.log('[MIGRATIONS] Migrate output:', migrateOutput)
      if (migrateStderr) console.log('[MIGRATIONS] Migrate stderr:', migrateStderr)
      console.log('[MIGRATIONS] ✅ Migrations applied successfully via migrate deploy')
      return
    } catch (migrateErr) {
      console.warn('[MIGRATIONS] migrate deploy failed, trying db push as fallback...')
      console.warn('[MIGRATIONS] Error:', migrateErr.message)
    }

    // Fallback to db push (creates tables if they don't exist)
    console.log('[MIGRATIONS] Attempting: prisma db push...')
    const { stdout: pushOutput, stderr: pushStderr } = await execAsync('npx prisma db push --skip-generate --skip-validate', {
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024
    })
    console.log('[MIGRATIONS] Push output:', pushOutput)
    if (pushStderr) console.log('[MIGRATIONS] Push stderr:', pushStderr)
    console.log('[MIGRATIONS] ✅ Schema synced successfully via db push')
  } catch (error) {
    console.error('[MIGRATIONS] ❌ Both migrate deploy and db push failed')
    console.error('[MIGRATIONS] Error message:', error.message)
    if (error.stdout) console.error('[MIGRATIONS] stdout:', error.stdout)
    if (error.stderr) console.error('[MIGRATIONS] stderr:', error.stderr)
    
    // Don't reject - continue anyway, might work anyway
    console.log('[MIGRATIONS] ⚠️  Continuing despite sync error (tables may already exist or will be created)')
  }
}
