#!/usr/bin/env node
/**
 * Direct SQL migration script using Prisma
 * Executes raw SQL to create tables if they don't exist
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function migrateDirect() {
  const prisma = new PrismaClient({
    log: [{ emit: 'event', level: 'query' }]
  });

  try {
    console.log('[MIGRATE_DIRECT] Starting direct SQL migration...');

    // Check if Student table exists
    try {
      await prisma.$executeRaw`SELECT 1 FROM "Student" LIMIT 1`;
      console.log('[MIGRATE_DIRECT] ℹ️  Tables already exist, skipping migration');
      await prisma.$disconnect();
      process.exit(0);
    } catch (err) {
      console.log('[MIGRATE_DIRECT] Tables not found, will create them...');
    }

    // Read migration SQL file
    const migrationPath = path.join(__dirname, '../prisma/migrations/20260210_add-user-activitylog/migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute the entire migration
    console.log('[MIGRATE_DIRECT] Executing migration SQL...');
    await prisma.$executeRawUnsafe(migrationSQL);

    console.log('[MIGRATE_DIRECT] ✅ Migration completed successfully');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[MIGRATE_DIRECT] ❌ Migration failed:', error.message);
    console.error('[MIGRATE_DIRECT] Details:', error);
    try {
      await prisma.$disconnect();
    } catch (e) {}
    process.exit(1);
  }
}

migrateDirect();
