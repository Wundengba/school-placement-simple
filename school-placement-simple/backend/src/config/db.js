// MongoDB support removed — this module is kept for compatibility but returns null.

const connectDB = async () => {
  console.warn('[DB] MongoDB support has been removed. connectDB() returns null.')
  return null
}

export default connectDB
