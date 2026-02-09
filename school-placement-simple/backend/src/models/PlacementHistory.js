import mongoose from 'mongoose'

const placementHistorySchema = new mongoose.Schema(
  {
    placementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Placement',
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true
    },
    event: {
      type: String,
      required: true,
      enum: ['CREATED', 'ACCEPTANCE_SENT', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'COMPLETED']
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn', 'completed'],
      required: true
    },
    notes: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    previousStatus: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
)

placementHistorySchema.index({ placementId: 1, createdAt: -1 })
placementHistorySchema.index({ studentId: 1, createdAt: -1 })
placementHistorySchema.index({ schoolId: 1, createdAt: -1 })

export default mongoose.model('PlacementHistory', placementHistorySchema)
