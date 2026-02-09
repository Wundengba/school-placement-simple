import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    // Clean MongoDB URI (remove newlines/whitespace from env var)
    let mongoUri = (process.env.MONGO_URI || '')
      .trim()
      .split('\n')[0]  // Take only the first line if multiple lines exist
      .replace(/[^\x20-\x7E]/g, '')  // Remove all non-printable ASCII characters
      .replace(/\s+/g, '')  // Remove all whitespace
      .replace(/%0A/gi, '')  // Remove URL-encoded newlines
      .replace(/%0D/gi, '')  // Remove URL-encoded carriage returns
      .replace(/%09/gi, '')  // Remove URL-encoded tabs
    
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set')
    }
    
    console.log(`Attempting MongoDB connection to: ${mongoUri.substring(0, 50)}...`)
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    })
    console.log(`MongoDB Connected: ${conn.connection.host}`)
    return conn
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`)
    // Don't exit - serverless should keep running
    console.error('Database connection warning - some features may not work')
  }
}

export default connectDB
