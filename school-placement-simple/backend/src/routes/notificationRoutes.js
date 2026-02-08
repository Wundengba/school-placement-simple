import express from 'express'

const router = express.Router()

// Mock email/SMS sending
router.post('/send', async (req, res) => {
  try {
    const { to, subject, message, type = 'email' } = req.body

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, message'
      })
    }

    // Log notification (in production, integrate Nodemailer/Twilio)
    console.log(`[${type.toUpperCase()}] Sending to: ${to}`)
    console.log(`Subject: ${subject || 'N/A'}`)
    console.log(`Message: ${message}`)

    res.json({
      success: true,
      message: `${type} notification queued successfully`,
      sent_to: to,
      type
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
