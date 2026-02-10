import dotenv from 'dotenv'
dotenv.config()
import pg from 'pg'
const { Client } = pg

async function setupDatabase() {
  const client = new Client(process.env.DATABASE_URL)
  try {
    await client.connect()
    console.log('✅ Connected to Neon\n')
    
    console.log('Creating tables...')
    
    // Create Student table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Student" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
        deleted BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('  ✓ Student')
    
    // Create School table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "School" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('  ✓ School')
    
    // Create SchoolPref table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "SchoolPref" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "studentId" TEXT NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
        "schoolId" TEXT NOT NULL REFERENCES "School"(id) ON DELETE CASCADE,
        choice INTEGER NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("studentId", "schoolId")
      )
    `)
    console.log('  ✓ SchoolPref')
    
    // Create Placement table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Placement" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "studentId" TEXT NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
        "schoolId" TEXT NOT NULL REFERENCES "School"(id) ON DELETE CASCADE,
        choice INTEGER NOT NULL,
        score FLOAT,
        status TEXT DEFAULT 'pending',
        "placementDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        algorithm TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("studentId", "schoolId")
      )
    `)
    console.log('  ✓ Placement')
    
    // Create Stream table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Stream" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "schoolId" TEXT NOT NULL REFERENCES "School"(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        capacity INTEGER NOT NULL
      )
    `)
    console.log('  ✓ Stream')
    
    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS "Student_indexNumber_idx" ON "Student"("indexNumber")`)
    await client.query(`CREATE INDEX IF NOT EXISTS "Student_status_idx" ON "Student"(status)`)
    await client.query(`CREATE INDEX IF NOT EXISTS "Student_deleted_idx" ON "Student"(deleted)`)
    await client.query(`CREATE INDEX IF NOT EXISTS "School_externalId_idx" ON "School"("externalId")`)
    await client.query(`CREATE INDEX IF NOT EXISTS "School_category_idx" ON "School"(category)`)
    await client.query(`CREATE INDEX IF NOT EXISTS "SchoolPref_studentId_idx" ON "SchoolPref"("studentId")`)
    await client.query(`CREATE INDEX IF NOT EXISTS "SchoolPref_schoolId_idx" ON "SchoolPref"("schoolId")`)
    await client.query(`CREATE INDEX IF NOT EXISTS "Placement_studentId_idx" ON "Placement"("studentId")`)
    await client.query(`CREATE INDEX IF NOT EXISTS "Placement_schoolId_idx" ON "Placement"("schoolId")`)
    await client.query(`CREATE INDEX IF NOT EXISTS "Placement_status_idx" ON "Placement"(status)`)
    await client.query(`CREATE INDEX IF NOT EXISTS "Stream_schoolId_idx" ON "Stream"("schoolId")`)
    console.log('  ✓ Indexes')
    
    console.log('\n✅ Database schema created successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

setupDatabase()
