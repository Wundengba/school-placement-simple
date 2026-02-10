(async ()=> {
  try {
    const idx = 'E2E' + new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14)
    const payload = {
      schools: [],
      students: [{ indexNumber: idx, fullName: 'E2E Test ' + idx, createdAt: new Date().toISOString() }],
      scores: [],
      placementResults: [],
      analytics: null,
      deletedStudents: [],
      deletedScores: [],
      deletedSchools: []
    }

    console.log('Using index:', idx)

    const uploadStart = Date.now()
    const upRes = await fetch('https://backend-seven-ashen-18.vercel.app/api/sync/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // keepAlive: true
    })
    const upJson = await upRes.json()
    const uploadTime = (Date.now() - uploadStart) / 1000
    console.log('UPLOAD_TIME:', uploadTime + 's', 'status:', upRes.status, 'success:', upJson.success)

    const downloadStart = Date.now()
    const dlRes = await fetch('https://backend-seven-ashen-18.vercel.app/api/sync/download')
    const dlJson = await dlRes.json()
    const downloadTime = (Date.now() - downloadStart) / 1000
    const found = (dlJson.data?.students || []).some(s => s.indexNumber === idx)
    console.log('DOWNLOAD_TIME:', downloadTime + 's', 'found:', found)
    console.log('STUDENTS_RETURNED:', (dlJson.data?.students || []).length)
  } catch (e) {
    console.error('E2E TEST ERROR:', e)
    process.exit(1)
  }
})()
