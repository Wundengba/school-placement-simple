import pkg from '@prisma/client'
const { PrismaClient } = pkg

const prisma = new PrismaClient()

async function main() {
  console.log('Setting up Neon PostgreSQL database...')
  
  try {
    // Test connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Connected to Neon:', result)
    
    // Create tables (Prisma will do this automatically, but we can test)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Student" (
        id TEXT PRIMARY KEY,
        "indexNumber" TEXT UNIQUE NOT NULL,
        "fullName" TEXT NOT NULL,
        email TEXT,
        maths SMALLINT,
        english SMALLINT,
        science SMALLINT,
        "placedSchoolId" TEXT,
        "guardianName" TEXT,
        "guardianPhone" TEXT,
        status TEXT DEFAULT 'pending',
        deleted BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✅ Student table ready')
    
    // Create School table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "School" (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        "externalId" TEXT UNIQUE,
        type TEXT,
        location TEXT,
        category TEXT,
        capacity INTEGER NOT NULL,
        "enrolledCount" INTEGER DEFAULT 0,
        "contactPhone" TEXT,
        "contactEmail" TEXT,
        website TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('✅ School table ready')
    
    console.log('✅ Database setup complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
