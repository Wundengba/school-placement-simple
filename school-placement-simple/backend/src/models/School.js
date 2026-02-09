import mongoose from 'mongoose'

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Federal', 'State', 'Private'],
    required: true
  },
  location: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  enrolledCount: {
    type: Number,
    default: 0
  },
  streams: [{
    name: String,
    capacity: Number
  }],
  contact: {
    phone: String,
    email: String,
    website: String
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

export default mongoose.model('School', schoolSchema)
