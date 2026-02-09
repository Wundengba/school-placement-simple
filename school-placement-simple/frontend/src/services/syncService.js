// Use hardcoded production URL as fallback for deployment
const PRODUCTION_API_BASE = 'https://backend-seven-ashen-18.vercel.app/api'

// Determine API base immediately
let API_BASE = '/api'  // Default fallback

// Track last successful sync time for cross-device sync
let _lastServerSyncTime = localStorage.getItem('_lastServerSyncTime') ? new Date(localStorage.getItem('_lastServerSyncTime')) : null

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
  
  // Gather per-student selections from individual localStorage keys
  const allSelections = []
  students.forEach(student => {
    if (student.id) {
      const selectionKey = `schoolSelections_${student.id}`
      const selection = JSON.parse(localStorage.getItem(selectionKey) || 'null')
      if (selection) {
        allSelections.push({
          studentId: student.id,
          indexNumber: student.indexNumber,
          ...selection
        })
      }
    }
  })
  
  // Get placement results
  const placementResults = JSON.parse(localStorage.getItem('placementResults') || '[]')
  
  // Get analytics data
  const analyticsData = JSON.parse(localStorage.getItem('analyticsSnapshot') || 'null')
  
  console.log('[SYNC] getLocalData() retrieved:', {
    studentsCount: students?.length || 0,
    scoresCount: scores?.length || 0,
    schoolsCount: schools?.length || 0,
    selectionsCount: allSelections?.length || 0,
    placementCount: placementResults?.length || 0,
    hasAnalytics: !!analyticsData
  })
  console.log('[SYNC] Sample student:', students?.[0])
  console.log('[SYNC] Sample score:', scores?.[0])
  console.log('[SYNC] Sample selection:', allSelections?.[0])
  console.log('[SYNC] Sample placement result:', placementResults?.[0])
  
  return { 
    students, 
    scores, 
    schools,
    preferences: allSelections,
    placementResults,
    analytics: analyticsData
  }
}

function saveLocalData({ students, scores, schools, preferences, placementResults, analytics }) {
  if (Array.isArray(students)) localStorage.setItem('registeredStudents', JSON.stringify(students))
  if (Array.isArray(scores)) localStorage.setItem('testScores', JSON.stringify(scores))
  if (Array.isArray(schools)) localStorage.setItem('schools', JSON.stringify(schools))
  
  // Save preferences (schoolSelections) per-student
  if (Array.isArray(preferences)) {
    preferences.forEach(pref => {
      if (pref.studentId) {
        const selectionKey = `schoolSelections_${pref.studentId}`
        const cleanPref = { ...pref }
        delete cleanPref.studentId
        delete cleanPref.indexNumber
        localStorage.setItem(selectionKey, JSON.stringify(cleanPref))
      }
    })
  }
  
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

  // Merge preferences (by studentId, prefer server but include local additions)
  const prefMap = {}
  ;(server.preferences || []).forEach(p => { if (p.studentId) prefMap[p.studentId] = p })
  local.preferences.forEach(p => { if (p.studentId && !prefMap[p.studentId]) prefMap[p.studentId] = p })
  const mergedPreferences = Object.values(prefMap)

  // Merge placement results (prefer server as source of truth)
  const mergedPlacementResults = server.placementResults || local.placementResults || []

  // Merge analytics (prefer server, keep local if server doesn't have it)
  const mergedAnalytics = server.analytics || local.analytics || null

  saveLocalData({ 
    students: mergedStudents, 
    scores: mergedScores,
    schools: mergedSchools,
    preferences: mergedPreferences,
    placementResults: mergedPlacementResults,
    analytics: mergedAnalytics
  })
  
  return { 
    students: mergedStudents, 
    scores: mergedScores,
    schools: mergedSchools,
    preferences: mergedPreferences,
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
    console.log('[SYNC] Payload to upload:', {
      schools: payload.schools?.length || 0,
      students: payload.students?.length || 0,
      scores: payload.scores?.length || 0,
      preferences: payload.preferences?.length || 0,
      placementResults: payload.placementResults?.length || 0,
      analytics: !!payload.analytics
    })
    console.log('[SYNC] Full payload keys:', Object.keys(payload))
    const uploadResult = await upload(payload)
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
