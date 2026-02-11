import prisma from '../src/config/prisma.js'

async function run() {
  try {
    console.log('[apply] Creating Student table...')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Student" (
        "id" TEXT NOT NULL,
        "indexNumber" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "email" TEXT,
        "maths" SMALLINT,
        "english" SMALLINT,
        "science" SMALLINT,
        "placedSchoolId" TEXT,
        "guardianName" TEXT,
        "guardianPhone" TEXT,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "deleted" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
      );
    `)

    console.log('[apply] Creating Admin table...')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Admin" (
        "id" TEXT NOT NULL,
        "username" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "email" TEXT,
        "fullName" TEXT,
        "role" TEXT NOT NULL DEFAULT 'admin',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
      );
    `)

    console.log('[apply] Creating unique indexes...')
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Student_indexNumber_key" ON "Student"("indexNumber");`)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Admin_username_key" ON "Admin"("username");`)

    console.log('[apply] Done.')
    process.exit(0)
  } catch (e) {
    console.error('[apply] Error:', e.message || e)
    process.exit(2)
  }
}

run()
