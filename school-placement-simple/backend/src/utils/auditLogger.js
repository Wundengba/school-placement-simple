import prisma from '../config/prisma.js'

/**
 * Log user activity to the database (Prisma)
 */
export const logActivity = async (logData) => {
  try {
    const log = await prisma.activityLog.create({
      data: {
        userId: logData.userId || null,
        username: logData.username || null,
        action: logData.action,
        entityType: logData.entityType || null,
        entityId: logData.entityId || null,
        entityName: logData.entityName || null,
        changes: logData.changes || null,
        ipAddress: logData.ipAddress || null,
        userAgent: logData.userAgent || null,
        description: logData.description || null,
        status: logData.status || 'SUCCESS',
        errorMessage: logData.errorMessage || null,
      },
    })
    return log
  } catch (err) {
    console.error('[AUDIT] Error logging activity (prisma):', err.message)
  }
}

/**
 * Get activity logs with filtering (Prisma)
 */
export const getActivityLogs = async (filters = {}, limit = 50, page = 1) => {
  const skip = (page - 1) * limit

  // Build Prisma where clause from filters (simple mapping)
  const where = {}
  if (filters.userId) where.userId = filters.userId
  if (filters.username) where.username = { contains: filters.username }
  if (filters.action) where.action = filters.action
  if (filters.entityType) where.entityType = filters.entityType
  if (filters.entityId) where.entityId = filters.entityId

  try {
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ])

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    }
  } catch (err) {
    console.error('[AUDIT] Error retrieving activity logs (prisma):', err.message)
    return { logs: [], pagination: {} }
  }
}

export default { logActivity, getActivityLogs }
