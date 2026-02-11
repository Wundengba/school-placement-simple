#!/usr/bin/env node
/**
 * Database migration script for Vercel deployment
 * Ensures Prisma schema is synced with database before server starts
 */

const { execSync } = require('child_process');
const path = require('path');

const TIMEOUT_MS = 120000;
const env = { ...process.env };

console.log('[MIGRATE_DB] Starting database migration...');
console.log('[MIGRATE_DB] DATABASE_URL:', env.DATABASE_URL ? '✅ Set' : '❌ Not set');
console.log('[MIGRATE_DB] Node version:', process.version);
console.log('[MIGRATE_DB] Working directory:', process.cwd());

function run(command, description) {
  console.log(`\n[MIGRATE_DB] ${description}`);
  console.log(`[MIGRATE_DB] Running: ${command}`);
  try {
    const output = execSync(command, {
      stdio: 'inherit',
      timeout: TIMEOUT_MS,
      encoding: 'utf-8',
      env,
      cwd: __dirname + '/..'
    });
    console.log(`[MIGRATE_DB] ✅ ${description} succeeded`);
    return true;
  } catch (error) {
    console.error(`[MIGRATE_DB] ❌ ${description} failed`);
    console.error('[MIGRATE_DB] Error:', error.message);
    return false;
  }
}

async function main() {
  try {
    // Step 1: Ensure Prisma client is generated
    run('npx prisma generate --skip-validation', 'Generating Prisma client');

    // Step 2: Push schema to database (ensures all tables exist)
    const pushSuccess = run('npx prisma db push --skip-generate --force-reset=false', 'Pushing schema to database');
    
    if (!pushSuccess) {
      // Fallback: Try migrate deploy
      const migrateSuccess = run('npx prisma migrate deploy --skip-generate', 'Deploying migrations');
      
      if (!migrateSuccess) {
        console.warn('[MIGRATE_DB] ⚠️  Both db push and migrate deploy failed');
        console.warn('[MIGRATE_DB] Database schema may not be fully synced');
        process.exit(1);
      }
    }

    console.log('[MIGRATE_DB] ✅ Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('[MIGRATE_DB] ❌ Unexpected error:', error);
    process.exit(1);
  }
}

main();
