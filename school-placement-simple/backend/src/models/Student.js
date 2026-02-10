import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema({
  indexNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
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
  schoolPreferences: [{
    choice: { type: Number, required: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }
  }],
  placedSchoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School'
  },
  guardianName: {
    type: String,
    trim: true
  },
  guardianPhone: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'placed', 'rejected'],
    default: 'pending'
  },
  deleted: {
    type: Boolean,
    default: false,
    index: true
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

export default mongoose.model('Student', studentSchema)
