const API_BASE = ((import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '/api')
  .trim()  // Remove any leading/trailing whitespace or newlines
  .replace(/[\r\n]+/g, '')  // Remove any remaining newline characters

async function download() {
  try {
    const url = `${API_BASE}/sync/download`.trim()  // Ensure URL is clean
    console.log('Downloading from:', url)
    const res = await fetch(url)
    console.log('Download response status:', res.status)
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Download failed: HTTP ${res.status} - ${errorText}`)
    }
    const data = await res.json()
    console.log('Download successful, received:', data)
    return data
  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
}

async function upload(payload) {
  try {
    const url = `${API_BASE}/sync/upload`.trim()  // Ensure URL is clean
    console.log('Uploading to:', url)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    console.log('Upload response status:', res.status)
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Upload failed: HTTP ${res.status} - ${errorText}`)
    }
    const data = await res.json()
    console.log('Upload successful:', data)
    return data
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

function getLocalData() {
  const students = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
  const scores = JSON.parse(localStorage.getItem('testScores') || '[]')
  const preferences = JSON.parse(localStorage.getItem('schoolSelections') || '[]')
  return { students, scores, preferences }
}

function saveLocalData({ students, scores }) {
  if (Array.isArray(students)) localStorage.setItem('registeredStudents', JSON.stringify(students))
  if (Array.isArray(scores)) localStorage.setItem('testScores', JSON.stringify(scores))
}

// Simple merge: server wins on conflicts (by indexNumber)
function mergeServerIntoLocal(server) {
  const local = getLocalData()
  const studentMap = {}
  local.students.forEach(s => { if (s.indexNumber) studentMap[s.indexNumber] = s })
  ;(server.students || []).forEach(s => { if (s.indexNumber) studentMap[s.indexNumber] = s })
  const mergedStudents = Object.values(studentMap)

  const scoreMap = {}
  local.scores.forEach(s => { if (s.indexNumber) scoreMap[s.indexNumber] = s })
  ;(server.scores || []).forEach(s => { if (s.indexNumber) scoreMap[s.indexNumber] = s })
  const mergedScores = Object.values(scoreMap)

  saveLocalData({ students: mergedStudents, scores: mergedScores })
  return { students: mergedStudents, scores: mergedScores }
}

let _intervalId = null

async function syncNow() {
  try {
    console.log('Starting sync...')
    // download server snapshot
    const server = await download()
    console.log('Downloaded server data:', server)
    
    if (server && server.success && server.data) {
      console.log('Merging server data into local...')
      mergeServerIntoLocal(server.data)
    }
    
    // then upload local changes (best-effort)
    console.log('Uploading local changes...')
    const payload = getLocalData()
    const uploadResult = await upload(payload)
    console.log('Upload result:', uploadResult)
    
    return { ok: true, message: 'Sync completed successfully' }
  } catch (error) {
    console.error('Sync error:', error)
    throw error
  }
}

function startAutoSync(intervalMs = 60000) {
  if (_intervalId) return
  console.log('Starting auto-sync with interval:', intervalMs)
  _intervalId = setInterval(() => {
    syncNow().catch((err) => {
      console.error('Auto-sync failed:', err)
    })
  }, intervalMs)
}

function stopAutoSync() {
  if (!_intervalId) return
  clearInterval(_intervalId)
  _intervalId = null
}

export default { download, upload, syncNow, startAutoSync, stopAutoSync }
