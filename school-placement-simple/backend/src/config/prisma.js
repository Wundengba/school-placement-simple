import pkg from '@prisma/client'
const { PrismaClient } = pkg

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'], // Reduced logging to save connection pool
})

// Handle disconnection on process exit
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

// Disconnect on process termination (Vercel Lambda)
process.on('SIGTERM', async () => {
  await prisma.$disconnect()
})

export default prisma

