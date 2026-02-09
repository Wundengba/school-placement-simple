import mongoose from 'mongoose'

const placementSchema = new mongoose.Schema({
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
  choice: {
    type: Number,
    required: true
  },
  score: Number,
  status: {
    type: String,
    enum: ['placed', 'rejected', 'pending'],
    default: 'pending'
  },
  placementDate: {
    type: Date,
    default: Date.now
  },
  algorithm: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})
