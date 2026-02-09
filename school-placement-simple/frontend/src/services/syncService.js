// Use hardcoded production URL as fallback for deployment
const PRODUCTION_API_BASE = 'https://backend-seven-ashen-18.vercel.app/api'

// Determine API base immediately
let API_BASE = '/api'  // Default fallback

// Try environment variable first
if (import.meta.env && import.meta.env.VITE_API_BASE) {
  const envBase = String(import.meta.env.VITE_API_BASE).trim()
  if (envBase && envBase.length > 10) {
    // Ensure /api is included if not already
    const baseUrl = envBase.endsWith('/api') ? envBase : `${envBase}/api`
    API_BASE = baseUrl
    console.log('[SYNC] Using env var VITE_API_BASE:', API_BASE)
  }
}

// Check if running in production (on vercel.app domain)
if (!API_BASE.startsWith('http') && typeof window !== 'undefined') {
  if (window.location.hostname.includes('vercel.app')) {
    API_BASE = PRODUCTION_API_BASE
    console.log('[SYNC] Auto-detected production, using PRODUCTION_API_BASE:', API_BASE)
  } else if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Production-like but not vercel (e.g., custom domain)
    API_BASE = PRODUCTION_API_BASE
    console.log('[SYNC] Non-localhost detected, using PRODUCTION_API_BASE:', API_BASE)
  }
}

console.log('[SYNC] Final API_BASE:', API_BASE)

async function download() {
  try {
    const url = `${API_BASE}/sync/download`
    console.log('[SYNC] download() called')
    console.log('[SYNC] API_BASE value:', API_BASE)
    console.log('[SYNC] Full URL:', url)
    console.log('[SYNC] URL is HTTPS?', url.startsWith('https'))
    console.log('[SYNC] URL length:', url.length)
    
    const fetchOptions = {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }
    console.log('[SYNC] Fetch options:', fetchOptions)
    console.log('[SYNC] About to call fetch() with URL:', url)
    
    const res = await fetch(url, fetchOptions)
    console.log('[SYNC] Fetch completed, status:', res.status, res.statusText)
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error('[SYNC] Response not OK. Status:', res.status, 'Body:', errorText)
      throw new Error(`Download failed: HTTP ${res.status} - ${errorText}`)
    }
    
    const data = await res.json()
    console.log('[SYNC] Parsed JSON data:', data)
    return data
  } catch (error) {
    console.error('[SYNC] download() error:', error)
    console.error('[SYNC] Error stack:', error.stack)
    throw error
  }
}

async function upload(payload) {
  try {
    const url = `${API_BASE}/sync/upload`
    console.log('[SYNC] upload() called')
    console.log('[SYNC] API_BASE value:', API_BASE)
    console.log('[SYNC] Full URL:', url)
    console.log('[SYNC] Payload size:', JSON.stringify(payload).length, 'bytes')
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    console.log('[SYNC] Upload fetch completed, status:', res.status, res.statusText)
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error('[SYNC] Upload response not OK. Status:', res.status, 'Body:', errorText)
      throw new Error(`Upload failed: HTTP ${res.status} - ${errorText}`)
    }
    const data = await res.json()
    console.log('[SYNC] Upload successful:', data)
    return data
  } catch (error) {
    console.error('[SYNC] upload() error:', error)
    console.error('[SYNC] Error stack:', error.stack)
    throw error
  }
}

function getLocalData() {
  const students = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
  const scores = JSON.parse(localStorage.getItem('testScores') || '[]')
  const preferences = JSON.parse(localStorage.getItem('schoolSelections') || '[]')
  console.log('[SYNC] getLocalData() retrieved:', {
    studentsCount: students?.length || 0,
    scoresCount: scores?.length || 0,
    preferencesCount: preferences?.length || 0
  })
  console.log('[SYNC] Sample student:', students?.[0])
  console.log('[SYNC] Sample score:', scores?.[0])
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
    console.log('[SYNC] === syncNow() started ===')
    console.log('[SYNC] Calling download()...')
    // download server snapshot
    const server = await download()
    console.log('[SYNC] download() returned:', server)
    
    if (server && server.success && server.data) {
      console.log('[SYNC] Merging server data into local...')
      mergeServerIntoLocal(server.data)
    }
    
    // then upload local changes (best-effort)
    console.log('[SYNC] Calling upload()...')
    const payload = getLocalData()
    console.log('[SYNC] Payload to upload:', {
      schools: payload.schools?.length || 0,
      students: payload.students?.length || 0,
      scores: payload.scores?.length || 0,
      preferences: payload.preferences?.length || 0
    })
    console.log('[SYNC] Full payload:', payload)
    const uploadResult = await upload(payload)
    console.log('[SYNC] upload() returned:', uploadResult)
    
    console.log('[SYNC] === syncNow() completed successfully ===')
    return { ok: true, message: 'Sync completed successfully' }
  } catch (error) {
    console.error('[SYNC] === syncNow() failed ===')
    console.error('[SYNC] Error:', error)
    console.error('[SYNC] Error message:', error.message)
    throw error
  }
}

function startAutoSync(intervalMs = 30000) {
  if (_intervalId) {
    console.log('[SYNC] Auto-sync already running, skipping restart')
    return
  }
  console.log('[SYNC] === Starting auto-sync with interval:', intervalMs, 'ms ===')
  _intervalId = setInterval(() => {
    const now = new Date().toLocaleTimeString()
    console.log(`[SYNC] [${now}] Auto-sync tick - executing syncNow()...`)
    syncNow().then(() => {
      const newTime = new Date().toISOString()
      console.log(`[SYNC] [${new Date().toLocaleTimeString()}] ✅ Auto-sync completed`)
      // Dispatch event so UI can update
      window.dispatchEvent(new CustomEvent('syncCompleted', { detail: { timestamp: newTime } }))
    }).catch((err) => {
      console.error(`[SYNC] [${new Date().toLocaleTimeString()}] ❌ Auto-sync failed:`, err.message)
    })
  }, intervalMs)
}

function stopAutoSync() {
  if (!_intervalId) return
  clearInterval(_intervalId)
  _intervalId = null
}

export default { download, upload, syncNow, startAutoSync, stopAutoSync }
