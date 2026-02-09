// Function to determine the correct API base
function getAPIBase() {
  // First, try environment variable
  let apiBase = (import.meta.env && import.meta.env.VITE_API_BASE) ? String(import.meta.env.VITE_API_BASE).trim() : null
  
  // If not set, determine based on environment
  if (!apiBase) {
    if (import.meta.env.PROD && typeof window !== 'undefined') {
      // In production (Vercel), use the hardcoded backend URL
      apiBase = 'https://backend-seven-ashen-18.vercel.app/api'
    } else {
      // In development, use relative path
      apiBase = '/api'
    }
  }
  
  // Ensure /api is included in the path
  if (apiBase) {
    if (!apiBase.includes('/api')) {
      apiBase = apiBase.replace(/\/$/, '') + '/api'
    }
  }
  
  return apiBase
}

// Determine API base immediately
let API_BASE = getAPIBase()

console.log('[SYNC] Final API_BASE:', API_BASE)
console.log('[SYNC] Environment:', import.meta.env.PROD ? 'production' : 'development')

// Track last successful sync time for cross-device sync
let _lastServerSyncTime = localStorage.getItem('_lastServerSyncTime') ? new Date(localStorage.getItem('_lastServerSyncTime')) : null

async function download() {
  try {
    // Build URL with lastSyncTime for incremental sync
    let url = `${API_BASE}/sync/download`
    if (_lastServerSyncTime) {
      url += `?lastSyncTime=${encodeURIComponent(_lastServerSyncTime.toISOString())}`
    }
    
    console.log('[SYNC] download() called, incremental:', !!_lastServerSyncTime)
    console.log('[SYNC] Full URL:', url)
    
    const fetchOptions = {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }
    
    const res = await fetch(url, fetchOptions)
    console.log('[SYNC] Fetch completed, status:', res.status, res.statusText)
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error('[SYNC] Response not OK. Status:', res.status, 'Body:', errorText)
      throw new Error(`Download failed: HTTP ${res.status} - ${errorText}`)
    }
    
    const data = await res.json()
    console.log('[SYNC] Parsed JSON data, incremental:', data.data?.incremental)
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
  // Get core data
  const students = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
  const scores = JSON.parse(localStorage.getItem('testScores') || '[]')
  const schools = JSON.parse(localStorage.getItem('schools') || '[]')
  
  // Get placement results
  const placementResults = JSON.parse(localStorage.getItem('placementResults') || '[]')
  
  // Get analytics data
  const analyticsData = JSON.parse(localStorage.getItem('analyticsSnapshot') || 'null')
  
  console.log('[SYNC] LOCAL DATA SNAPSHOT:', {
    studentsCount: students?.length || 0,
    scoresCount: scores?.length || 0,
    schoolsCount: schools?.length || 0,
    placementCount: placementResults?.length || 0,
    hasAnalytics: !!analyticsData,
    studentIndexNumbers: students.map(s => s.indexNumber).join(', ')
  })
  
  return { 
    students, 
    scores, 
    schools,
    placementResults,
    analytics: analyticsData
  }
}

function saveLocalData({ students, scores, schools, preferences, placementResults, analytics }) {
  if (Array.isArray(students)) localStorage.setItem('registeredStudents', JSON.stringify(students))
  if (Array.isArray(scores)) localStorage.setItem('testScores', JSON.stringify(scores))
  if (Array.isArray(schools)) localStorage.setItem('schools', JSON.stringify(schools))
  
  // Note: Preferences/schoolSelections are stored per-student in individual keys
  // They are not synced via backend yet - only stored locally
  
  if (Array.isArray(placementResults)) localStorage.setItem('placementResults', JSON.stringify(placementResults))
  if (analytics) localStorage.setItem('analyticsSnapshot', JSON.stringify(analytics))
}

// Simple merge: server wins on conflicts (by indexNumber for students/scores, by id for schools/placement)
function mergeServerIntoLocal(server) {
  const local = getLocalData()
  
  // Merge students (by indexNumber)
  const studentMap = {}
  local.students.forEach(s => { if (s.indexNumber) studentMap[s.indexNumber] = s })
  ;(server.students || []).forEach(s => { if (s.indexNumber) studentMap[s.indexNumber] = s })
  const mergedStudents = Object.values(studentMap)

  // Merge scores (by indexNumber)
  const scoreMap = {}
  local.scores.forEach(s => { if (s.indexNumber) scoreMap[s.indexNumber] = s })
  ;(server.scores || []).forEach(s => { if (s.indexNumber) scoreMap[s.indexNumber] = s })
  const mergedScores = Object.values(scoreMap)

  // Merge schools (by id, but prefer local if both exist to maintain user edits)
  const schoolMap = {}
  ;(server.schools || []).forEach(s => { if (s.id) schoolMap[s.id] = s })
  local.schools.forEach(s => { if (s.id) schoolMap[s.id] = s })  // Local overwrites server
  const mergedSchools = Object.values(schoolMap)

  // Merge placement results (prefer server as source of truth)
  const mergedPlacementResults = server.placementResults || local.placementResults || []

  // Merge analytics (prefer server, keep local if server doesn't have it)
  const mergedAnalytics = server.analytics || local.analytics || null

  saveLocalData({ 
    students: mergedStudents, 
    scores: mergedScores,
    schools: mergedSchools,
    placementResults: mergedPlacementResults,
    analytics: mergedAnalytics
  })
  
  return { 
    students: mergedStudents, 
    scores: mergedScores,
    schools: mergedSchools,
    placementResults: mergedPlacementResults,
    analytics: mergedAnalytics
  }
}

let _intervalId = null
let _pendingSyncTimer = null
let _lastSyncTime = 0
const _syncDebounceMs = 2000  // Wait 2 seconds before syncing after a change to batch updates

// Track localStorage keys that should trigger real-time sync
const _realtimeSyncKeys = [
  'registeredStudents',
  'testScores',
  'schools',
  'placementResults',
  'analyticsSnapshot'
]

function _scheduleDebouncedSync() {
  // Clear any pending sync
  if (_pendingSyncTimer) {
    clearTimeout(_pendingSyncTimer)
  }

  // Schedule a new sync in 2 seconds (debounced)
  _pendingSyncTimer = setTimeout(() => {
    const now = Date.now()
    const timeSinceLastSync = now - _lastSyncTime
    
    // Don't sync if we just synced less than 3 seconds ago
    if (timeSinceLastSync < 3000) {
      console.log('[SYNC] Skipping sync, synced', timeSinceLastSync, 'ms ago')
      return
    }
    
    console.log('[SYNC] Real-time sync triggered by data change')
    syncNow().catch(err => {
      console.error('[SYNC] Real-time sync failed:', err.message)
    })
  }, _syncDebounceMs)
}

function setupRealtimeSync() {
  // Listen for storage changes (local and cross-tab)
  window.addEventListener('storage', (event) => {
    if (_realtimeSyncKeys.includes(event.key)) {
      console.log('[SYNC] Storage change detected for key:', event.key)
      _scheduleDebouncedSync()
    }
  })

  // Custom event for in-tab data changes (when we modify localStorage directly)
  window.addEventListener('dataChanged', (event) => {
    console.log('[SYNC] dataChanged event detected:', event.detail?.key)
    _scheduleDebouncedSync()
  })

  console.log('[SYNC] Real-time sync listeners setup complete')
}

// Utility function for components to trigger a data change
function notifyDataChange(key) {
  console.log('[SYNC] notifyDataChange called for:', key)
  if (_realtimeSyncKeys.includes(key)) {
    _scheduleDebouncedSync()
  }
}

async function syncNow() {
  try {
    _lastSyncTime = Date.now()
    console.log('[SYNC] === syncNow() started ===')
    console.log('[SYNC] Calling download()...')
    // download server snapshot
    const server = await download()
    console.log('[SYNC] download() returned:', server)
    
    // Check if there are changes from other devices
    let hasRemoteChanges = false
    if (server && server.success && server.data) {
      const hasData = 
        (server.data.schools && server.data.schools.length > 0) ||
        (server.data.students && server.data.students.length > 0) ||
        (server.data.scores && server.data.scores.length > 0) ||
        (server.data.placementResults && server.data.placementResults.length > 0)
      
      if (hasData) {
        hasRemoteChanges = true
        console.log('[SYNC] Remote changes detected from other devices!')
      }
      
      console.log('[SYNC] Merging server data into local...')
      mergeServerIntoLocal(server.data)
      
      // Update last server sync time for next incremental sync
      if (server.data.timestamp) {
        _lastServerSyncTime = new Date(server.data.timestamp)
        localStorage.setItem('_lastServerSyncTime', _lastServerSyncTime.toISOString())
      }
    }
    
    // then upload local changes (best-effort)
    console.log('[SYNC] Calling upload()...')
    const payload = getLocalData()
    // Don't send preferences to backend yet - they're only stored locally
    const uploadPayload = {
      schools: payload.schools,
      students: payload.students,
      scores: payload.scores,
      placementResults: payload.placementResults,
      analytics: payload.analytics
    }
    console.log('[SYNC] Payload to upload:', {
      schools: uploadPayload.schools?.length || 0,
      students: uploadPayload.students?.length || 0,
      scores: uploadPayload.scores?.length || 0,
      placementResults: uploadPayload.placementResults?.length || 0,
      analytics: !!uploadPayload.analytics
    })
    console.log('[SYNC] Full payload keys:', Object.keys(uploadPayload))
    const uploadResult = await upload(uploadPayload)
    console.log('[SYNC] upload() returned:', uploadResult)
    
    console.log('[SYNC] === syncNow() completed successfully ===')
    
    // Dispatch completion event with timestamp
    const newTime = new Date().toISOString()
    window.dispatchEvent(new CustomEvent('syncCompleted', { 
      detail: { 
        timestamp: newTime,
        hasRemoteChanges: hasRemoteChanges 
      } 
    }))
    
    return { ok: true, message: 'Sync completed successfully', hasRemoteChanges }
  } catch (error) {
    console.error('[SYNC] === syncNow() failed ===')
    console.error('[SYNC] Error:', error)
    console.error('[SYNC] Error message:', error.message)
    throw error
  }
}

function startAutoSync(intervalMs = 5000) {
  // Setup real-time sync listeners on first auto sync start
  if (!window._realtimeSyncSetup) {
    setupRealtimeSync()
    window._realtimeSyncSetup = true
  }

  if (_intervalId) {
    console.log('[SYNC] Auto-sync already running, skipping restart')
    return
  }
  
  // Default to 5 seconds for cross-device sync (real-time on changes + 5s periodic backup)
  const finalInterval = intervalMs || 5000
  console.log('[SYNC] === Starting auto-sync with interval:', finalInterval, 'ms + real-time event triggers for cross-device sync ===')
  
  _intervalId = setInterval(() => {
    const now = new Date().toLocaleTimeString()
    console.log(`[SYNC] [${now}] Periodic auto-sync tick - executing syncNow()...`)
    syncNow().then((result) => {
      console.log(`[SYNC] [${new Date().toLocaleTimeString()}] ✅ Periodic auto-sync completed`, result?.hasRemoteChanges ? '(remote changes)' : '')
    }).catch((err) => {
      console.error(`[SYNC] [${new Date().toLocaleTimeString()}] ❌ Periodic auto-sync failed:`, err.message)
    })
  }, finalInterval)
}

function stopAutoSync() {
  if (!_intervalId) return
  clearInterval(_intervalId)
  _intervalId = null
}

export default { download, upload, syncNow, startAutoSync, stopAutoSync, notifyDataChange, setupRealtimeSync }
