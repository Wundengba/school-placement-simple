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
      bufferCommands: true,
      serverSelectionTimeoutMS: 120000,
      connectTimeoutMS: 120000,
      socketTimeoutMS: 120000,
      maxPoolSize: 1
    })
    
    const conn = await mongoose.connect(mongoUri, {
      // Keep bufferCommands true to queue operations during connection
      bufferCommands: true,
      // Increase operation buffer timeout to match connection timeout
      bufferCmdsMaxMsUnsupported: 120000,
      // Very aggressive timeouts
      serverSelectionTimeoutMS: 120000,
      connectTimeoutMS: 120000,
      socketTimeoutMS: 120000,
      // Allow operations to wait for connection
      maxPoolSize: 1,
      minPoolSize: 0,
      // Connection options
      retryWrites: true,
      family: 4,
      retryAttempts: 15,
      waitQueueTimeoutMS: 120000,
      maxIdleTimeMS: 60000
    })
    // Cache connection for serverless
    cachedConnection = conn
    connectionAttemptInProgress = false
    console.log(`[DB] ✅ MongoDB Connected: ${conn.connection.host}`)
    console.log(`[DB] Connection state: ${conn.connection.readyState} (1 = connected)`)
    return conn
  } catch (error) {
    connectionAttemptInProgress = false
    console.error(`[DB] ❌ FAILED to connect to MongoDB`)
    console.error(`[DB] Error message: ${error.message}`)
    console.error('[DB] IMPORTANT: Verify MongoDB Atlas:')
    console.error('[DB] 1. IP Whitelist includes 0.0.0.0/0 (Network Access)')
    console.error('[DB] 2. MONGO_URI environment variable is set correctly')
    console.error('[DB] 3. Database user credentials are correct')
    console.error('[DB] 4. Check Atlas cluster is running')
    // Don't exit - serverless should keep running
    console.error('[DB] Database connection warning - some features may not work')
    throw error
  }
}

export default connectDB
