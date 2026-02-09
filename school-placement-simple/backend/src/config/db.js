import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    // Clean MongoDB URI (remove newlines/whitespace from env var)
    const mongoUri = (process.env.MONGO_URI || '').trim()
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set')
    }
    const conn = await mongoose.connect(mongoUri)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
    return conn
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`)
    // Don't exit - serverless should keep running
    console.error('Database connection warning - some features may not work')
  }
}

export default connectDB
