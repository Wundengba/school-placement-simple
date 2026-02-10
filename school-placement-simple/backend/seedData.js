import dotenv from 'dotenv'
dotenv.config()
import pkg from '@prisma/client'
const { PrismaClient } = pkg

const prisma = new PrismaClient()

async function seedDatabase() {
  try {
    console.log('🌱 Seeding test data...\n')

    // Clear existing data
    console.log('Clearing existing data...')
    await prisma.placement.deleteMany({})
    await prisma.schoolPref.deleteMany({})
    await prisma.stream.deleteMany({})
    await prisma.student.deleteMany({})
    await prisma.school.deleteMany({})

    // Create test schools
    console.log('Creating schools...')
    const schools = await Promise.all([
      // Category A (Federal schools - 1 choice max)
      prisma.school.create({
        data: {
          name: 'Federal Science School Ibadan',
          type: 'Federal',
          category: 'A',
          location: 'Ibadan',
          capacity: 100,
          contactEmail: 'info@fss-ibadan.edu.ng',
          contactPhone: '+2348012345678'
        }
      }),
      prisma.school.create({
        data: {
          name: 'Federal Science School Lagos',
          type: 'Federal',
          category: 'A',
          location: 'Lagos',
          capacity: 120,
          contactEmail: 'info@fss-lagos.edu.ng',
          contactPhone: '+2348019876543'
        }
      }),
      // Category B (State schools - 2 choices max)
      prisma.school.create({
        data: {
          name: 'Lagos State Science School',
          type: 'State',
          category: 'B',
          location: 'Lagos',
          capacity: 80,
          contactEmail: 'info@lsss.edu.ng',
          contactPhone: '+2348123456789'
        }
      }),
      prisma.school.create({
        data: {
          name: 'Oyo State Science School',
          type: 'State',
          category: 'B',
          location: 'Ibadan',
          capacity: 60,
          contactEmail: 'info@osss.edu.ng',
          contactPhone: '+2348187654321'
        }
      }),
      // Category C (Private/Other - 4 choices max)
      prisma.school.create({
        data: {
          name: 'Grange Heritage School',
          type: 'Private',
          category: 'C',
          location: 'Lagos',
          capacity: 50,
          contactEmail: 'info@grange.edu.ng',
          contactPhone: '+2349012345678'
        }
      }),
      prisma.school.create({
        data: {
          name: 'Loyola Jesuit College',
          type: 'Private',
          category: 'C',
          location: 'Ibadan',
          capacity: 45,
          contactEmail: 'info@loyola.edu.ng',
          contactPhone: '+2349087654321'
        }
      }),
      prisma.school.create({
        data: {
          name: 'Abuja Metropolitan Academy',
          type: 'Private',
          category: 'C',
          location: 'Abuja',
          capacity: 55,
          contactEmail: 'info@ama.edu.ng',
          contactPhone: '+2349011223344'
        }
      }),
      prisma.school.create({
        data: {
          name: 'Christ High School',
          type: 'Private',
          category: 'C',
          location: 'Lagos',
          capacity: 40,
          contactEmail: 'info@chrish.edu.ng',
          contactPhone: '+2349055667788'
        }
      })
    ])

    console.log(`✅ Created ${schools.length} schools\n`)

    // Create test students
    console.log('Creating test students...')
    const testStudents = [
      {
        indexNumber: '000000000001',
        fullName: 'Chisom Okafor',
        email: 'chisom@email.com',
        maths: 85,
        english: 78,
        science: 82,
        guardianName: 'John Okafor',
        guardianPhone: '+2348012345678'
      },
      {
        indexNumber: '000000000002',
        fullName: 'Ngozi Adeyemi',
        email: 'ngozi@email.com',
        maths: 92,
        english: 88,
        science: 90,
        guardianName: 'Mrs Adeyemi',
        guardianPhone: '+2348019876543'
      },
      {
        indexNumber: '000000000003',
        fullName: 'Tunde Ibrahim',
        email: 'tunde@email.com',
        maths: 76,
        english: 80,
        science: 79,
        guardianName: 'Ibrahim Bello',
        guardianPhone: '+2348123456789'
      },
      {
        indexNumber: '000000000004',
        fullName: 'Ayo Oluwaseun',
        email: 'ayo@email.com',
        maths: 88,
        english: 85,
        science: 86,
        guardianName: 'Ester Oluwaseun',
        guardianPhone: '+2348187654321'
      },
      {
        indexNumber: '000000000005',
        fullName: 'Mary Emeka',
        email: 'mary@email.com',
        maths: 79,
        english: 82,
        science: 81,
        guardianName: 'Emeka Gold',
        guardianPhone: '+2349012345678'
      }
    ]

    const createdStudents = await Promise.all(
      testStudents.map(student =>
        prisma.student.create({
          data: {
            ...student,
            status: 'pending'
          }
        })
      )
    )

    console.log(`✅ Created ${createdStudents.length} test students\n`)

    // Create some sample school preferences
    console.log('Creating sample preferences...')
    await prisma.schoolPref.create({
      data: {
        studentId: createdStudents[0].id,
        schoolId: schools[0].id, // Category A
        choice: 1
      }
    })
    await prisma.schoolPref.create({
      data: {
        studentId: createdStudents[0].id,
        schoolId: schools[2].id, // Category B
        choice: 2
      }
    })

    console.log('✅ Created sample preferences\n')

    // Verify data
    const studentCount = await prisma.student.count()
    const schoolCount = await prisma.school.count()
    const prefCount = await prisma.schoolPref.count()

    console.log('📊 Database Summary:')
    console.log(`  Students: ${studentCount}`)
    console.log(`  Schools: ${schoolCount}`)
    console.log(`  Preferences: ${prefCount}\n`)

    console.log('✅ Seed data created successfully!')
    console.log('\n📝 Test students (login with these index numbers):')
    createdStudents.forEach(student => {
      console.log(`  - ${student.indexNumber} (${student.fullName})`)
    })

  } catch (error) {
    console.error('❌ Error seeding data:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedDatabase()
