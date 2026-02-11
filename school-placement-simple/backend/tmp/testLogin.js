(async () => {
  try {
    const endpoints = [
      { name: 'student', url: 'https://backend-seven-ashen-18.vercel.app/api/login', body: { indexNumber: 'INVALIDTEST123' } },
      { name: 'admin', url: 'https://backend-seven-ashen-18.vercel.app/api/admin/login', body: { username: 'admin', password: 'admin123' } }
    ]

    for (const ep of endpoints) {
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ep.body)
      })
      const text = await res.text()
      console.log('---', ep.name, ep.url)
      console.log('Status:', res.status)
      console.log('Response:', text)
      console.log('\n')
    }
  } catch (e) {
    console.error('Script error:', e)
    process.exit(1)
  }
})()
