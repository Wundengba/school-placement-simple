import mongoose from 'mongoose'

const preferenceSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    index: true
  },
  indexNumber: {
    type: String,
    required: true,
    index: true
  },
  catA: {
    type: String,
    default: ''
  },
  catB: [{
    type: String,
    default: ''
  }],
  catC: [{
    type: String,
    default: ''
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model('Preference', preferenceSchema)
