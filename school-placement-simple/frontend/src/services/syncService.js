const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '/api'

async function download() {
  const res = await fetch(`${API_BASE}/sync/download`)
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  return res.json()
}

async function upload(payload) {
  const res = await fetch(`${API_BASE}/sync/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return res.json()
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
  // download server snapshot
  const server = await download()
  if (server && server.success && server.data) {
    mergeServerIntoLocal(server.data)
  }
  // then upload local changes (best-effort)
  const payload = getLocalData()
  await upload(payload)
  return { ok: true }
}

function startAutoSync(intervalMs = 60000) {
  if (_intervalId) return
  _intervalId = setInterval(() => {
    syncNow().catch(() => {})
  }, intervalMs)
}

function stopAutoSync() {
  if (!_intervalId) return
  clearInterval(_intervalId)
  _intervalId = null
}

export default { download, upload, syncNow, startAutoSync, stopAutoSync }
