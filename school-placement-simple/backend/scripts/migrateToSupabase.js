import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { runBackupDatabase } from './backupDatabaseRunner.js'
import { restoreDatabaseRunner } from './restoreDatabaseRunner.js'

/**
 * migrateToSupabase.js
 *
 * Automates migration from current DATABASE_URL (Neon) to a Supabase Postgres database.
 * Steps performed (local machine):
 *  1. Creates a JSON backup of current database (calls backupDatabase)
 *  2. Writes new DATABASE_URL to backend/.env (backups original .env)
 *  3. Pushes Prisma schema to the Supabase database (npx prisma db push)
 *  4. Restores the JSON backup into Supabase (calls restoreDatabase)
 *
 * Usage:
 *   node scripts/migrateToSupabase.js
 *
 * Or set SUPABASE_DATABASE_URL env and run:
 *   SUPABASE_DATABASE_URL="postgresql://..." node scripts/migrateToSupabase.js
 *
 * IMPORTANT: This script runs commands on your local machine and expects `npx` and
 * `prisma` to be available. It also will overwrite backend/.env (it makes a backup).
 */

async function prompt(question) {
  return new Promise(resolve => {
    process.stdout.write(question)
    process.stdin.once('data', data => resolve(data.toString().trim()))
  })
}

async function run() {
  try {
    console.log('\n🔁 Starting Neon → Supabase migration helper')

    // Step 0: Determine SUPABASE_DATABASE_URL
    let supabaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.SUPABASE_URL
    if (!supabaseUrl) {
      supabaseUrl = await prompt('Enter SUPABASE DATABASE_URL (Postgres connection string): ')
    }
    if (!supabaseUrl) {
      console.error('\n❌ No Supabase DATABASE_URL provided. Aborting.')
      process.exit(1)
    }

    // Step 1: Backup current DB using backupDatabase runner
    console.log('\n1) Creating backup of current database (using backupDatabase)...')
    const backupFile = await runBackupDatabase()
    console.log(`   ✅ Backup saved: ${backupFile}`)

    // Step 2: Write new DATABASE_URL to backend/.env (backup original)
    const envPath = path.resolve('./.env')
    const envBackup = path.resolve(`./.env.migrate_backup_${Date.now()}`)
    if (fs.existsSync(envPath)) {
      fs.copyFileSync(envPath, envBackup)
      console.log(`\n2) Existing .env backed up to: ${envBackup}`)
    }

    const newEnv = []
    // Preserve existing keys except DATABASE_URL
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8')
      content.split(/\r?\n/).forEach(line => {
        if (!line.startsWith('DATABASE_URL=')) newEnv.push(line)
      })
    }
    newEnv.push(`DATABASE_URL="${supabaseUrl.replace(/"/g, '')}"`)
    fs.writeFileSync(envPath, newEnv.join('\n'))
    console.log('   ✅ Wrote new DATABASE_URL to backend/.env')

    // Step 3: Push Prisma schema to Supabase
    console.log('\n3) Pushing Prisma schema to Supabase (npx prisma db push)')
    const push = spawnSync('npx', ['prisma', 'db', 'push'], { stdio: 'inherit', shell: true })
    if (push.status !== 0) {
      console.error('\n❌ prisma db push failed. Please inspect the output above.')
      process.exit(1)
    }
    console.log('   ✅ Prisma schema pushed')

    // Step 4: Restore backup to Supabase
    console.log('\n4) Restoring backup into Supabase (this may take a while)')
    await restoreDatabaseRunner(backupFile)
    console.log('   ✅ Restore completed')

    console.log('\n🎉 Migration complete!')
    console.log('Next steps:')
    console.log('- Update deployment environment variables (Vercel/Railway/etc) to use the new Supabase DATABASE_URL')
    console.log('- Verify app functionality against Supabase')
    console.log('- Keep the backup file safe in backups/')

  } catch (err) {
    console.error('\n❌ Migration helper failed:', err.message)
    process.exit(1)
  }
}

run()
