import mongoose from 'mongoose'

const MONGO_URI = 'mongodb+srv://mrwundengba:Z5wi49MBJ3qEcfVk@projects.nbs4iqw.mongodb.net/school-placement?retryWrites=true&w=majority&appName=Projects'

console.log('Testing MongoDB connection...')
console.log('URI length:', MONGO_URI.length)
console.log('URI scheme:', MONGO_URI.substring(0, 20) + '...')

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 5000,
  retryWrites: true
})
  .then(() => {
    console.log('✅ MongoDB connected successfully')
    console.log('Connection readyState:', mongoose.connection.readyState)
    
    // Try a simple find to test the connection
    const testSchema = new mongoose.Schema({ test: String })
    const TestModel = mongoose.model('_test', testSchema)
    return TestModel.findOne().lean()
  })
  .then((result) => {
    console.log('✅ Test query executed')
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Connection failed:', err.message)
    console.error('Error code:', err.code)
    process.exit(1)
  })

// Timeout after 15 seconds
setTimeout(() => {
  console.error('❌ Timeout - connection did not complete')
  process.exit(1)
}, 15000)
