import bcryptjs from 'bcryptjs'
import prisma from './backend/src/config/prisma.js'

async function seedAdmins() {
  try {
    console.log('🌱 Seeding admin accounts...')

    // Create test admin accounts
    const adminData = [
      {
        username: 'admin',
        password: 'admin123',
        email: 'admin@school-placement.com',
        fullName: 'System Administrator',
        role: 'admin'
      },
      {
        username: 'moderator',
        password: 'moderator123',
        email: 'moderator@school-placement.com',
        fullName: 'Placement Moderator',
        role: 'moderator'
      }
    ]

    for (const data of adminData) {
      const existingAdmin = await prisma.admin.findUnique({
        where: { username: data.username }
      })

      if (existingAdmin) {
        console.log(`  ⏭️  Admin "${data.username}" already exists, skipping...`)
        continue
      }

      const hashedPassword = await bcryptjs.hash(data.password, 10)

      const admin = await prisma.admin.create({
        data: {
          ...data,
          password: hashedPassword
        }
      })

      console.log(`  ✅ Created admin account: ${admin.username} (${admin.role})`)
    }

    console.log('✅ Admin seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding admins:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedAdmins()
