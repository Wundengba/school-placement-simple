import nodemailer from 'nodemailer'

let transporter = null

/**
 * Initialize email transporter
 */
const initializeTransporter = () => {
  if (transporter) return transporter

  // Support both Mailgun and generic SMTP
  if (process.env.MAILGUN_DOMAIN && process.env.MAILGUN_API_KEY) {
    transporter = nodemailer.createTransport({
      host: `smtp.mailgun.org`,
      port: 587,
      secure: false,
      auth: {
        user: `postmaster@${process.env.MAILGUN_DOMAIN}`,
        pass: process.env.MAILGUN_API_KEY
      }
    })
  } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  } else {
    console.warn('[EMAIL] No email configuration found. Email notifications will be disabled.')
    transporter = null
  }

  return transporter
}

/**
 * Send email helper
 */
export const sendEmail = async (to, subject, htmlContent) => {
  const mail = initializeTransporter()
  if (!mail) {
    console.warn(`[EMAIL] Email service not configured. Would send to ${to}: ${subject}`)
    return false
  }

  try {
    await mail.sendMail({
      from: process.env.EMAIL_FROM || 'no-reply@tankpeschool.com',
      to,
      subject,
      html: htmlContent
    })
    console.log(`[EMAIL] Email sent to ${to}: ${subject}`)
    return true
  } catch (err) {
    console.error('[EMAIL] Error sending email:', err.message)
    return false
  }
}

/**
 * Send placement acceptance notification to student
 */
export const sendPlacementAcceptanceEmail = async (studentEmail, studentName, schoolName) => {
  const html = `
    <h2>Placement Confirmation</h2>
    <p>Hi ${studentName},</p>
    <p>Great news! You have been accepted and placed at <strong>${schoolName}</strong>.</p>
    <p>Please log in to your account to view the details and next steps.</p>
    <p>Congratulations on your placement!</p>
  `
  return sendEmail(studentEmail, `Placement Confirmation at ${schoolName}`, html)
}

/**
 * Send placement rejection notification to student
 */
export const sendPlacementRejectionEmail = async (studentEmail, studentName, schoolName) => {
  const html = `
    <h2>Placement Update</h2>
    <p>Hi ${studentName},</p>
    <p>Thank you for your interest in <strong>${schoolName}</strong>. Unfortunately, your placement request was not accepted at this time.</p>
    <p>Please continue exploring other options. You can view all available schools in your account.</p>
    <p>Best of luck!</p>
  `
  return sendEmail(studentEmail, `Placement Update from ${schoolName}`, html)
}

/**
 * Send placement offer to school
 */
export const sendPlacementOfferEmail = async (schoolEmail, studentName, schoolName) => {
  const html = `
    <h2>New Placement Request</h2>
    <p>Hello,</p>
    <p><strong>${studentName}</strong> has requested placement at <strong>${schoolName}</strong>.</p>
    <p>Please log in to your admin account to review and respond to this request.</p>
  `
  return sendEmail(schoolEmail, `New Placement Request - ${studentName}`, html)
}

/**
 * Send registration confirmation
 */
export const sendRegistrationEmail = async (email, name, role) => {
  const html = `
    <h2>Welcome to Tankpe School Placement System</h2>
    <p>Hi ${name},</p>
    <p>Your account has been successfully created as a <strong>${role}</strong>.</p>
    <p>You can now log in to access the system.</p>
    <p>If you have any questions, please contact support.</p>
  `
  return sendEmail(email, 'Welcome to Tankpe School Placement System', html)
}

export default {
  sendEmail,
  sendPlacementAcceptanceEmail,
  sendPlacementRejectionEmail,
  sendPlacementOfferEmail,
  sendRegistrationEmail
}
