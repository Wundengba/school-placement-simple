#!/usr/bin/env node
/**
 * Direct SQL migration script using pg client
 * Executes raw SQL to create tables if they don't exist
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateDirect() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('[MIGRATE_DIRECT] Connecting to database...');
    await client.connect();
    console.log('[MIGRATE_DIRECT] ✅ Connected');

    // Check if Student table exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Student'
      ) AS exists
    `);

    if (checkResult.rows[0].exists) {
      console.log('[MIGRATE_DIRECT] ℹ️  Tables already exist, skipping...');
      await client.end();
      process.exit(0);
    }

    console.log('[MIGRATE_DIRECT] Tables not found, executing migration...');

    // Read migration SQL
    const migrationPath = path.join(__dirname, '../prisma/migrations/20260210_add-user-activitylog/migration.sql');
    const fullSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split statements by semicolon, filter out comments
    const statements = fullSQL
      .split(';')
      .map(s =>  s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`[MIGRATE_DIRECT] Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;

      try {
        await client.query(stmt);
        console.log(`[MIGRATE_DIRECT] ✅ Statement ${i + 1}/${statements.length}`);
      } catch (err) {
        console.error(`[MIGRATE_DIRECT] ❌ Statement ${i + 1} failed: ${err.message}`);
        console.error(`[MIGRATE_DIRECT] SQL: ${stmt.substring(0, 100)}...`);
        // Continue with next statement
      }
    }

    console.log('[MIGRATE_DIRECT] ✅ Migration completed');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('[MIGRATE_DIRECT] ❌ Fatal error:', error.message);
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
}

migrateDirect();
