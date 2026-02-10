import dotenv from 'dotenv'
dotenv.config()

import pg from 'pg'
const { Client } = pg

console.log('Testing Neon connection...')
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET (' + process.env.DATABASE_URL.substring(0, 40) + '...)' : 'NOT SET')

async function testConnection() {
  const client = new Client(process.env.DATABASE_URL)
  try {
    console.log('Connecting...')
    await client.connect()
    console.log('✅ Connected to Neon')
    
    const res = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema='public'
    `)
    console.log('📊 Tables created:')
    res.rows.forEach(row => console.log('  -', row.table_name))
    
    if (res.rows.length === 0) {
      console.log('  (No tables yet - schema not pushed)')
    }
  } catch (error) {
    console.error('❌ Error connecting or querying:')
    console.error('  Code:', error.code)
    console.error('  Message:', error.message)
  } finally {
    await client.end()
  }
}

testConnection()
