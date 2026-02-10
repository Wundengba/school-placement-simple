import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
import pg from 'pg'
const { Client } = pg

// Import MongoDB models
import StudentModel from './src/models/Student.js'
import SchoolModel from './src/models/School.js'
import PlacementModel from './src/models/Placement.js'

async function migrateData() {
  const pgClient = new Client(process.env.DATABASE_URL)
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...')
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/school-placement'
    console.log('  URI:', mongoUri.substring(0, 50) + '...')
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    })
    console.log('✅ Connected to MongoDB\n')
    
    // Connect to PostgreSQL
    console.log('Connecting to Neon...')
    await pgClient.connect()
    console.log('✅ Connected to Neon\n')
    
    // Migrate Schools
    console.log('Migrating Schools...')
    const schools = await SchoolModel.find({ deleted: { $ne: true } })
    for (const school of schools) {
      await pgClient.query(
        `INSERT INTO "School" (id, name, "externalId", type, location, category, capacity, "enrolledCount", "contactPhone", "contactEmail", website, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING`,
        [
          school._id.toString(),
          school.name,
          school.externalId,
          school.type,
          school.location,
          school.category || null,
          school.capacity,
          school.enrolledCount || 0,
          school.contact?.phone || null,
          school.contact?.email || null,
          school.contact?.website || null,
          school.createdAt,
          school.updatedAt
        ]
      )
    }
    console.log(`  ✓ Migrated ${schools.length} schools\n`)
    
    // Migrate Students
    console.log('Migrating Students...')
    const students = await StudentModel.find({ deleted: { $ne: true } })
    for (const student of students) {
      await pgClient.query(
        `INSERT INTO "Student" (id, "indexNumber", "fullName", email, maths, english, science, "placedSchoolId", "guardianName", "guardianPhone", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT ("indexNumber") DO UPDATE SET "fullName" = EXCLUDED."fullName", email = EXCLUDED.email`,
        [
          student._id.toString(),
          student.indexNumber,
          student.fullName,
          student.email || null,
          student.maths || null,
          student.english || null,
          student.science || null,
          student.placedSchoolId ? student.placedSchoolId.toString() : null,
          student.guardianName || null,
          student.guardianPhone || null,
          student.status || 'pending',
          student.createdAt,
          student.updatedAt
        ]
      )
      
      // Migrate school preferences for this student
      if (student.schoolPreferences && student.schoolPreferences.length > 0) {
        for (const pref of student.schoolPreferences) {
          await pgClient.query(
            `INSERT INTO "SchoolPref" ("studentId", "schoolId", choice)
             VALUES ($1, $2, $3)
             ON CONFLICT ("studentId", "schoolId") DO NOTHING`,
            [
              student._id.toString(),
              pref.schoolId ? pref.schoolId.toString() : null,
              pref.choice
            ]
          ).catch(err => console.warn('  (Skipped duplicate preference)'))
        }
      }
    }
    console.log(`  ✓ Migrated ${students.length} students\n`)
    
    // Migrate Placements
    console.log('Migrating Placements...')
    const placements = await PlacementModel.find()
    for (const placement of placements) {
      await pgClient.query(
        `INSERT INTO "Placement" (id, "studentId", "schoolId", choice, score, status, "placementDate", algorithm, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT ("studentId", "schoolId") DO NOTHING`,
        [
          placement._id.toString(),
          placement.studentId.toString(),
          placement.schoolId.toString(),
          placement.choice,
          placement.score || null,
          placement.status || 'pending',
          placement.placementDate,
          placement.algorithm || null,
          placement.createdAt,
          placement.updatedAt
        ]
      ).catch(err => console.warn('  (Skipped duplicate placement)'))
    }
    console.log(`  ✓ Migrated ${placements.length} placements\n`)
    
    console.log('✅ Data migration complete!')
    console.log('\nNext steps:')
    console.log('1. Update backend code to use Prisma')
    console.log('2. Run: npm run build && vercel deploy --prod')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    await pgClient.end()
  }
}

migrateData()
