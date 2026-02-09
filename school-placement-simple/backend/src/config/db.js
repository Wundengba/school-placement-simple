import mongoose from 'mongoose'

let cached = global._mongoConnection || null

const cleanUri = (raw = '') => raw
  .toString()
  .trim()
  .split('\n')[0]
  .replace(/[^\x20-\x7E]/g, '')
  .replace(/%0A/gi, '')
  .replace(/%0D/gi, '')
  .replace(/%09/gi, '')

const connectDB = async () => {
  if (cached && mongoose.connection && mongoose.connection.readyState === 1) {
    return cached
  }

  const mongoUri = cleanUri(process.env.MONGO_URI || '')
  
  // Debug logging
  console.log('[DB] MONGO_URI env var present:', !!process.env.MONGO_URI)
  console.log('[DB] MONGO_URI length after clean:', mongoUri.length)
  console.log('[DB] MONGO_URI masked:', mongoUri ? mongoUri.substring(0, 30) + '...' + mongoUri.substring(mongoUri.length - 20) : 'EMPTY')

  if (!mongoUri || mongoUri.length < 20) {
    console.error('MONGO_URI is missing or invalid. Set MONGO_URI in environment and redeploy.')
    return null
  }

  try {
    console.log('[DB] Connecting to MongoDB...')
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 60000,
      connectTimeoutMS: 60000,
      socketTimeoutMS: 120000,
      maxPoolSize: 10,
      bufferCommands: true
    })

    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`)
    cached = conn
    global._mongoConnection = cached
    return conn
  } catch (error) {
    console.error('[DB] Error connecting to MongoDB:', error && error.message)
    console.error('[DB] Ensure MONGO_URI is correct and Atlas network access allows this deployment')
    return null
  }
}

export default connectDB
