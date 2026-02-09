import mongoose from 'mongoose'

const testScoreSchema = new mongoose.Schema({
  indexNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullName: {
    type: String,
    trim: true
  },
  english: {
    type: Number,
    min: 0,
    max: 100
  },
  mathematics: {
    type: Number,
    min: 0,
    max: 100
  },
  science: {
    type: Number,
    min: 0,
    max: 100
  },
  socialStudies: {
    type: Number,
    min: 0,
    max: 100
  },
  computing: {
    type: Number,
    min: 0,
    max: 100
  },
  religious: {
    type: Number,
    min: 0,
    max: 100
  },
  careerTech: {
    type: Number,
    min: 0,
    max: 100
  },
  creativeArts: {
    type: Number,
    min: 0,
    max: 100
  },
  ghanaianLanguage: {
    type: Number,
    min: 0,
    max: 100
  },
  french: {
    type: Number,
    min: 0,
    max: 100
  },
  aggregate: {
    type: Number
  },
  placement: {
    type: String,
    enum: ['Not Qualified', 'A', 'B', 'C'],
    default: 'Not Qualified'
  },
  average: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

export default mongoose.model('TestScore', testScoreSchema)
