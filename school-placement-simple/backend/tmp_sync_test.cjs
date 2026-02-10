const https = require('https')

const payload = JSON.stringify({
  schools: [{ externalId: 'test-ext-1', name: 'Test School X', type: 'State', capacity: 100 }],
  students: [{ indexNumber: 'TEST123', fullName: 'Test Student', email: 'test@example.com' }],
  scores: [],
  placementResults: []
})

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}

const req = https.request('https://backend-seven-ashen-18.vercel.app/api/sync/upload', options, (res) => {
  let data = ''
  res.on('data', (chunk) => { data += chunk })
  res.on('end', () => {
    console.log('STATUS', res.statusCode)
    console.log(data)
  })
})

req.on('error', (e) => {
  console.error('REQUEST ERROR', e)
})

req.write(payload)
req.end()
