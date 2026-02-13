import express from 'express'
import prisma from '../config/prisma.js'

const router = express.Router()

// Diagnostic endpoint to check Prisma & env
router.get('/diagnose-db', async (req, res) => {
  try {
    const dbUrlSet = !!process.env.DATABASE_URL
    // Quick raw test
    const ping = await prisma.$queryRaw`SELECT 1 as result`
    // postgres version if available
    let version = null
    try {
      const v = await prisma.$queryRaw`SELECT version() as v`
      version = v
    } catch (e) {
      // ignore
    }

    res.json({ success: true, dbUrlSet, ping, version, timestamp: new Date() })
  } catch (error) {
    console.error('[DIAG] DB diagnostic error:', error && error.message)
    res.status(500).json({ success: false, error: error && error.message, dbUrlSet: !!process.env.DATABASE_URL })
  }
})

export default router
