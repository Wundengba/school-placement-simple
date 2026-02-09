import mongoose from 'mongoose'

const testScoreSchema = new mongoose.Schema({
  indexNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  maths: {
    type: Number,
    min: 0,
    max: 100
  },
  english: {
    type: Number,
    min: 0,
    max: 100
  },
  science: {
    type: Number,
    min: 0,
    max: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model('TestScore', testScoreSchema)
