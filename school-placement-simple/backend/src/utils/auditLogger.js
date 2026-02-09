import ActivityLog from '../models/ActivityLog.js'

/**
 * Log user activity to the database
 */
export const logActivity = async (logData) => {
  try {
    const log = new ActivityLog({
      userId: logData.userId,
      username: logData.username,
      action: logData.action,
      entityType: logData.entityType,
      entityId: logData.entityId,
      entityName: logData.entityName,
      changes: logData.changes,
      ipAddress: logData.ipAddress,
      userAgent: logData.userAgent,
      description: logData.description,
      status: logData.status || 'SUCCESS',
      errorMessage: logData.errorMessage
    })
    await log.save()
    return log
  } catch (err) {
    console.error('[AUDIT] Error logging activity:', err.message)
  }
}

/**
 * Get activity logs with filtering
 */
export const getActivityLogs = async (filters = {}, limit = 50, page = 1) => {
  const skip = (page - 1) * limit
  try {
    const logs = await ActivityLog.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('userId', 'username email')
    
    const total = await ActivityLog.countDocuments(filters)
    
    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (err) {
    console.error('[AUDIT] Error retrieving activity logs:', err.message)
    return { logs: [], pagination: {} }
  }
}

export default { logActivity, getActivityLogs }
