import mongoose from 'mongoose'

let cachedConnection = null
let connectionAttemptInProgress = false

const connectDB = async () => {
  // Return cached connection if it exists and is connected
  if (cachedConnection && cachedConnection.connection && cachedConnection.connection.readyState === 1) {
    console.log('[DB] Using cached MongoDB connection')
    return cachedConnection
  }
  
  // Prevent multiple simultaneous connection attempts
  if (connectionAttemptInProgress) {
    console.log('[DB] Connection attempt already in progress, waiting...')
    // Wait a bit and retry
    await new Promise(resolve => setTimeout(resolve, 1000))
    return connectDB()
  }

  try {
    connectionAttemptInProgress = true
    console.log('[DB] Starting MongoDB connection attempt...')
    // Clean MongoDB URI (remove newlines/whitespace from env var)
    let mongoUri = (process.env.MONGO_URI || '')
      .trim()
      .split('\n')[0]  // Take only the first line if multiple lines exist
      .replace(/[^\x20-\x7E]/g, '')  // Remove all non-printable ASCII characters
      .replace(/\s+/g, '')  // Remove all whitespace
      .replace(/%0A/gi, '')  // Remove URL-encoded newlines
      .replace(/%0D/gi, '')  // Remove URL-encoded carriage returns
      .replace(/%09/gi, '')  // Remove URL-encoded tabs
    
    // Fallback to hardcoded URI if env var is not set or invalid
    if (!mongoUri || mongoUri.length < 20) {
      console.log('[DB] MONGO_URI env var invalid, using fallback')
      mongoUri = 'mongodb+srv://Tankpe:Mr.Wund3f@cluster0.apk1lfg.mongodb.net/?appName=Cluster0'
    }
    
    // Add connection string parameters for serverless
    // Append serverSelectionTimeoutMS to connection string if not already there
    if (!mongoUri.includes('serverSelectionTimeoutMS')) {
      mongoUri += mongoUri.includes('?') ? '&' : '?'
      mongoUri += 'serverSelectionTimeoutMS=120000&connectTimeoutMS=120000'
    }
    
    console.log(`[DB] Final connection URI: ${mongoUri.substring(0, 80)}...`)
    console.log(`[DB] Connection options:`, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 120000,
      connectTimeoutMS: 120000,
      socketTimeoutMS: 120000,
      maxPoolSize: 1
    })
    
    const conn = await mongoose.connect(mongoUri, {
      // Disable buffering completely to fail fast instead of queuing
      bufferCommands: false,
      // Very aggressive timeouts
      serverSelectionTimeoutMS: 120000,
      connectTimeoutMS: 120000,
      socketTimeoutMS: 120000,
      // Simplified pooling
      maxPoolSize: 1,
      minPoolSize: 0,
      // Connection options
      retryWrites: true,
      family: 4,
      retryAttempts: 15,
      waitQueueTimeoutMS: 120000,
      // New connection strategy
      maxIdleTimeMS: 60000
    })
    
    // Cache connection for serverless
    cachedConnection = conn
    connectionAttemptInProgress = false
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`)
    return conn
  } catch (error) {
    connectionAttemptInProgress = false
    console.error(`[DB] Error connecting to MongoDB: ${error.message}`)
    console.error('[DB] IMPORTANT: Ensure MongoDB Atlas IP whitelist includes 0.0.0.0/0')
    // Don't exit - serverless should keep running
    console.error('[DB] Database connection warning - some features may not work')
    throw error
  }
}

export default connectDB
