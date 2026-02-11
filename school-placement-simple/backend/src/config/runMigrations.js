import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export async function runMigrations() {
  return new Promise((resolve, reject) => {
    console.log('[MIGRATIONS] Starting Prisma migrations...')
    
    const prismaPath = join(__dirname, '../../node_modules/.bin/prisma')
    const migrationProcess = spawn('node', [prismaPath, 'migrate', 'deploy'], {
      cwd: join(__dirname, '../..'),
      stdio: 'inherit'
    })
    
    migrationProcess.on('close', (code) => {
      if (code === 0) {
        console.log('[MIGRATIONS] ✅ Migrations completed successfully')
        resolve()
      } else {
        console.error('[MIGRATIONS] ❌ Migration failed with code:', code)
        reject(new Error(`Migrations failed with code ${code}`))
      }
    })
    
    migrationProcess.on('error', (err) => {
      console.error('[MIGRATIONS] Error running migrations:', err.message)
      reject(err)
    })
  })
}
