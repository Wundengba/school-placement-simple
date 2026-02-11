import prisma from '../src/config/prisma.js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

async function run() {
  try {
    const username = 'demo_admin'
    const password = 'admin123'
    const email = 'demo_admin@example.com'
    const fullName = 'Demo Admin'

    // Check if admin exists
    const existing = await prisma.admin.findUnique({ where: { username } })
    if (existing) {
      console.log('Admin already exists:', existing.username)
      process.exit(0)
    }

    const hashed = await bcrypt.hash(password, 10)
    const newAdmin = await prisma.admin.create({ data: {
      id: uuidv4(),
      username,
      password: hashed,
      email,
      fullName,
      role: 'admin'
    }})

    console.log('Created admin:', { id: newAdmin.id, username: newAdmin.username, email: newAdmin.email })
    process.exit(0)
  } catch (e) {
    console.error('Error seeding admin:', e)
    process.exit(1)
  }
}

run()
