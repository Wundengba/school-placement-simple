import express from 'express'
import {
  sendEmail,
  sendPlacementAcceptanceEmail,
  sendPlacementRejectionEmail,
  sendPlacementOfferEmail,
  sendRegistrationEmail
} from '../utils/emailService.js'
import { logActivity } from '../utils/auditLogger.js'

const router = express.Router()

// Generic notification send endpoint
router.post('/send', async (req, res) => {
  try {
    const { to, subject, message, type = 'email', userId, username } = req.body

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, message'
      })
    }

    let result = false
    if (type === 'email') {
      result = await sendEmail(to, subject || 'Notification', message)
    } else {
      console.log(`[${type.toUpperCase()}] Sending to: ${to}`)
      console.log(`Message: ${message}`)
      result = true
    }

    // Log the action
    if (userId) {
      await logActivity({
        userId,
        username,
        action: 'NOTIFICATION_SENT',
        entityType: 'AUTH',
        description: `${type} sent to ${to}`,
        status: result ? 'SUCCESS' : 'FAILURE'
      })
    }

    res.json({
      success: result,
      message: result ? `${type} sent successfully` : `${type} service unavailable`,
      sent_to: to,
      type
    })
  } catch (error) {
    console.error('[NOTIFICATION] Error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Send placement acceptance notification
router.post('/placement-accepted', async (req, res) => {
  try {
    const { studentEmail, studentName, schoolName, userId, username } = req.body

    if (!studentEmail || !studentName || !schoolName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    const result = await sendPlacementAcceptanceEmail(studentEmail, studentName, schoolName)

    if (userId) {
      await logActivity({
        userId,
        username,
        action: 'PLACEMENT_ACCEPTED',
        entityType: 'Placement',
        entityName: `${studentName} at ${schoolName}`,
        description: `Acceptance notification sent to ${studentEmail}`,
        status: result ? 'SUCCESS' : 'FAILURE'
      })
    }

    res.json({ success: result, message: 'Acceptance notification sent' })
  } catch (error) {
    console.error('[NOTIFICATION] Acceptance error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Send placement rejection notification
router.post('/placement-rejected', async (req, res) => {
  try {
    const { studentEmail, studentName, schoolName, userId, username } = req.body

    if (!studentEmail || !studentName || !schoolName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    const result = await sendPlacementRejectionEmail(studentEmail, studentName, schoolName)

    if (userId) {
      await logActivity({
        userId,
        username,
        action: 'PLACEMENT_REJECTED',
        entityType: 'Placement',
        entityName: `${studentName} at ${schoolName}`,
        description: `Rejection notification sent to ${studentEmail}`,
        status: result ? 'SUCCESS' : 'FAILURE'
      })
    }

    res.json({ success: result, message: 'Rejection notification sent' })
  } catch (error) {
    console.error('[NOTIFICATION] Rejection error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Send placement offer notification to school
router.post('/placement-offer', async (req, res) => {
  try {
    const { schoolEmail, studentName, schoolName, userId, username } = req.body

    if (!schoolEmail || !studentName || !schoolName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    const result = await sendPlacementOfferEmail(schoolEmail, studentName, schoolName)

    if (userId) {
      await logActivity({
        userId,
        username,
        action: 'PLACEMENT_OFFER_SENT',
        entityType: 'Placement',
        entityName: `${studentName} to ${schoolName}`,
        description: `Offer notification sent to ${schoolEmail}`,
        status: result ? 'SUCCESS' : 'FAILURE'
      })
    }

    res.json({ success: result, message: 'Offer notification sent to school' })
  } catch (error) {
    console.error('[NOTIFICATION] Offer error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Send registration confirmation
router.post('/registration-confirmation', async (req, res) => {
  try {
    const { email, name, role, userId } = req.body

    if (!email || !name || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    const result = await sendRegistrationEmail(email, name, role)

    if (userId) {
      await logActivity({
        userId,
        username: name,
        action: 'REGISTRATION_CONFIRMATION',
        entityType: 'User',
        entityName: name,
        description: `Registration confirmation sent to ${email}`,
        status: result ? 'SUCCESS' : 'FAILURE'
      })
    }

    res.json({ success: result, message: 'Registration confirmation sent' })
  } catch (error) {
    console.error('[NOTIFICATION] Registration error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
