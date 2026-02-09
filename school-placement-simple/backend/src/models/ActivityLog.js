import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: String,
    action: {
      type: String,
      required: true,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PLACEMENT_ACCEPTED', 'PLACEMENT_REJECTED', 'PLACEMENT_CREATED']
    },
    entityType: {
      type: String,
      enum: ['User', 'Student', 'School', 'Placement', 'AUTH'],
      required: true
    },
    entityId: mongoose.Schema.Types.ObjectId,
    entityName: String,
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed
    },
    ipAddress: String,
    userAgent: String,
    description: String,
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE'],
      default: 'SUCCESS'
    },
    errorMessage: String
  },
  { timestamps: true }
)

export default mongoose.model('ActivityLog', activityLogSchema)
