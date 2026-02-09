import mongoose from 'mongoose'

let cachedConnection = null

const connectDB = async () => {
  // Return cached connection if it exists and is connected
  if (cachedConnection && cachedConnection.connection.readyState === 1) {
    console.log('[DB] Using cached MongoDB connection')
    return cachedConnection
  }

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
    
    // Fallback to hardcoded URI if env var is not set or invalid
    if (!mongoUri || mongoUri.length < 20) {
      console.log('[DB] MONGO_URI env var invalid, using fallback')
      mongoUri = 'mongodb+srv://Tankpe:Mr.Wund3f@cluster0.apk1lfg.mongodb.net/?appName=Cluster0'
    }
    
    console.log(`[DB] Attempting MongoDB connection to: ${mongoUri.substring(0, 50)}...`)
    
    const conn = await mongoose.connect(mongoUri, {
      // Very long timeouts for serverless with IP whitelist delays
      serverSelectionTimeoutMS: 60000,
      connectTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      // Simplified pooling for serverless
      maxPoolSize: 1,
      minPoolSize: 0,
      // Avoid reconnect buffering in serverless
      retryWrites: true,
      family: 4, // Use IPv4
      // Connection string options
      retryAttempts: 10,
      waitQueueTimeoutMS: 60000
    })
    
    // Cache connection for serverless
    cachedConnection = conn
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`)
    return conn
  } catch (error) {
    console.error(`[DB] Error connecting to MongoDB: ${error.message}`)
    console.error('[DB] IMPORTANT: Ensure MongoDB Atlas IP whitelist includes 0.0.0.0/0')
    // Don't exit - serverless should keep running
    console.error('[DB] Database connection warning - some features may not work')
    throw error
  }
}

export default connectDB
