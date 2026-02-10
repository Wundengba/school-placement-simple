import mongoose from 'mongoose'

const tombstoneSchema = new mongoose.Schema({
  type: { type: String, required: true }, // 'student' | 'score' | 'school'
  key: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

tombstoneSchema.index({ type: 1, key: 1 }, { unique: true })

export default mongoose.model('Tombstone', tombstoneSchema)
