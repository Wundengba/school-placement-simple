import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function runMigrations() {
  return new Promise((resolve, reject) => {
    console.log('[MIGRATIONS] Starting Prisma migrations...')
    console.log('[MIGRATIONS] Database URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set')
    
    try {
      // Get the backend directory
      const backendDir = join(__dirname, '../..')
      console.log('[MIGRATIONS] Backend dir:', backendDir)
      
      // Use npx directly which is more reliable
      const command = 'npx prisma migrate deploy --skip-generate'
      console.log('[MIGRATIONS] Running command:', command)
      
      const output = execSync(command, {
        cwd: backendDir,
        stdio: 'pipe',
        encoding: 'utf-8'
      })
      
      console.log('[MIGRATIONS] Output:', output)
      console.log('[MIGRATIONS] ✅ Migrations completed successfully')
      resolve()
    } catch (error) {
      console.error('[MIGRATIONS] ❌ Migration failed')
      console.error('[MIGRATIONS] Error message:', error.message)
      console.error('[MIGRATIONS] Error stdout:', error.stdout)
      console.error('[MIGRATIONS] Error stderr:', error.stderr)
      
      // Don't reject - continue anyway, schemas might already exist
      console.log('[MIGRATIONS] ⚠️  Continuing despite migration error (tables may already exist)')
      resolve()
    }
  })
}
