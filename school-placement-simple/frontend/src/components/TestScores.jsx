import { useState, useMemo, useEffect } from 'react'
import '../styles/TestScores.css'
import { IoCloudUpload } from 'react-icons/io5'
import syncService from '../services/syncService'

export default function TestScores() {
  // Mock students for lookup (would normally come from backend)
  const mockStudents = [
    { id: 1, indexNumber: 'STU001', fullName: 'John Doe' },
    { id: 2, indexNumber: 'STU002', fullName: 'Jane Smith' },
    { id: 3, indexNumber: 'STU003', fullName: 'Bob Johnson' }
  ]

  const [scores, setScores] = useState([])
  const [filter, setFilter] = useState('all')
  const [lookupError, setLookupError] = useState('')

  // Form state for a single student's scores
  const [form, setForm] = useState({
    indexNumber: '',
    fullName: '',
    english: '',
    mathematics: '',
    science: '',
    socialStudies: '',
    computing: '',
    religious: '',
    careerTech: '',
    creativeArts: '',
    ghanaianLanguage: '',
    french: ''
  })

  const subjectKeys = [
    'english',
    'mathematics',
    'science',
    'socialStudies',
    'computing',
    'religious',
    'careerTech',
    'creativeArts',
    'ghanaianLanguage',
    'french'
  ]

  const subjectLabels = {
    english: 'English Language',
    mathematics: 'Mathematics',
    science: 'Science',
    socialStudies: 'Social Studies',
    computing: 'Computing',
    religious: 'Religious & Moral Education',
    careerTech: 'Career Technology',
    creativeArts: 'Creative Arts & Design',
    ghanaianLanguage: 'Ghanaian Language (Asante Twi)',
    french: 'French'
  }

  const studentsByIndex = useMemo(() => {
    const map = {}
    // Add mock students
    mockStudents.forEach(s => (map[s.indexNumber] = s))
    // Add registered students from localStorage
    const registeredStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
    registeredStudents.forEach(s => {
      if (s.indexNumber && s.fullName) {
        map[s.indexNumber] = { id: s.id, indexNumber: s.indexNumber, fullName: s.fullName }
      }
    })
    return map
  }, [])

  // Load existing test scores from localStorage on component mount
  useEffect(() => {
    const loadScores = () => {
      const storedScores = JSON.parse(localStorage.getItem('testScores') || '[]')
      if (storedScores && storedScores.length > 0) {
        setScores(storedScores)
      }
    }

    loadScores()

    // Listen for sync completion to refresh scores
    const handleSyncCompleted = (event) => {
      console.log('[TESTSCORES] Sync completed, refreshing scores...')
      loadScores()
    }
    
    window.addEventListener('syncCompleted', handleSyncCompleted)
    
    return () => {
      window.removeEventListener('syncCompleted', handleSyncCompleted)
    }
  }, [])

  const handleBulkUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      console.log('File selected:', file.name)
      alert('CSV import coming soon!')
    }
  }

  const handleDownloadReport = () => {
    const report = `TEST SCORES REPORT\nGenerated: ${new Date().toLocaleString()}\n\nTOTAL RECORDS: ${scores.length}\n\nDETAILS:\n${scores.map(s => `${s.indexNumber} - ${s.fullName}\nAverage: ${s.average}\nAggregate: ${s.aggregate}\nPlacement: ${s.placement === 'Not Qualified' ? 'Not Qualified' : `Category ${s.placement}`}\n`).join('\n')}`
    
    const blob = new Blob([report], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-scores-report-${new Date().getTime()}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
    alert('Test scores report downloaded successfully!')
  }

  const handleIndexChange = (e) => {
    const val = e.target.value.trim().toUpperCase()
    setForm(prev => ({ ...prev, indexNumber: val }))
    if (val && studentsByIndex[val]) {
      setForm(prev => ({ ...prev, fullName: studentsByIndex[val].fullName }))
      setLookupError('')
    } else if (val) {
      setForm(prev => ({ ...prev, fullName: '' }))
      setLookupError('Student not found')
    } else {
      setForm(prev => ({ ...prev, fullName: '' }))
      setLookupError('')
    }
  }

  const handleScoreChange = (key, value) => {
    // allow only numbers and clamp 0-100
    let v = value === '' ? '' : Number(value)
    if (v !== '' && (isNaN(v) || v < 0)) v = 0
    if (v !== '' && v > 100) v = 100
    setForm(prev => ({ ...prev, [key]: v }))
  }

  const calculateAverage = (entry) => {
    const vals = subjectKeys.map(k => Number(entry[k] || 0))
    const sum = vals.reduce((a,b) => a + b, 0)
    return Math.round((sum / vals.length) * 100) / 100
  }

  // map a raw score (0-100) to numeric grade 1-9 per user's scale
  const scoreToGrade = (score) => {
    const s = Number(score)
    if (s >= 90 && s <= 100) return 1
    if (s >= 80 && s <= 89) return 2
    if (s >= 75 && s <= 79) return 3
    if (s >= 70 && s <= 74) return 4
    if (s >= 65 && s <= 69) return 5
    if (s >= 60 && s <= 64) return 6
    if (s >= 55 && s <= 59) return 7
    if (s >= 50 && s <= 54) return 8
    return 9
  }

  // compute aggregate using four core subjects + best two of the remaining (lower is better)
  const computeCorePlusBestTwoAggregate = (entry) => {
    const coreKeys = ['english', 'mathematics', 'science', 'socialStudies']
    const coreGrades = coreKeys.map(k => scoreToGrade(Number(entry[k] || 0)))
    const remainingKeys = subjectKeys.filter(k => !coreKeys.includes(k))
    const remainingGrades = remainingKeys.map(k => scoreToGrade(Number(entry[k] || 0)))
    remainingGrades.sort((a,b) => a - b)
    const bestTwo = remainingGrades.slice(0, 2)
    return [...coreGrades, ...bestTwo].reduce((a,b) => a + b, 0)
  }

  const placementFromAggregate = (agg) => {
    if (agg >= 6 && agg <= 9) return 'A'
    if (agg >= 10 && agg <= 15) return 'B'
    if (agg >= 16 && agg <= 30) return 'C'
    return 'Not Qualified'
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.indexNumber || !form.fullName) {
      alert('Please provide index number and verify full name')
      return
    }
    // ensure all scores are numbers between 0 and 100
    for (const k of subjectKeys) {
      const v = form[k]
      if (v === '' || isNaN(Number(v))) {
        alert(`Please enter a numeric score for ${subjectLabels[k]}`)
        return
      }
      if (Number(v) < 0 || Number(v) > 100) {
        alert(`${subjectLabels[k]} must be between 0 and 100`)
        return
      }
    }

    const avg = calculateAverage(form)
    const newEntry = {
      id: Date.now(),
      indexNumber: form.indexNumber,
      fullName: form.fullName,
      ...subjectKeys.reduce((acc,k) => ({ ...acc, [k]: Number(form[k]) }), {}),
      average: avg,
      aggregate: computeCorePlusBestTwoAggregate(form),
      placement: placementFromAggregate(computeCorePlusBestTwoAggregate(form))
    }

    setScores(prev => [newEntry, ...prev])
    
    // Save to localStorage for persistence and placement algorithm (use 'testScores' for sync compatibility)
    const allTestScores = JSON.parse(localStorage.getItem('testScores') || '[]')
    const existingIndex = allTestScores.findIndex(s => s.indexNumber === form.indexNumber)
    if (existingIndex >= 0) {
      allTestScores[existingIndex] = newEntry
    } else {
      allTestScores.push(newEntry)
    }
    localStorage.setItem('testScores', JSON.stringify(allTestScores))

    // Trigger real-time sync
    syncService.notifyDataChange('testScores')

    // Persist/update student profile if student is registered
    try {
      const reg = studentsByIndex[newEntry.indexNumber]
      if (reg && reg.id) {
        const profileKey = `studentProfile_${reg.id}`
        const existing = JSON.parse(localStorage.getItem(profileKey) || 'null') || {}
        const selections = JSON.parse(localStorage.getItem(`schoolSelections_${reg.id}`) || 'null') || { catA: '', catB: [], catC: [] }
        const regStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
        const regFull = regStudents.find(s => s.id === reg.id) || reg

        const profile = {
          id: reg.id,
          indexNumber: reg.indexNumber,
          fullName: reg.fullName,
          registeredDetails: regFull,
          testScore: newEntry,
          selections,
          aggregate: newEntry.aggregate,
          placementCategory: newEntry.placement,
          placedSchool: regFull.placedSchool || existing.placedSchool || null,
          status: regFull.status || existing.status || null,
          generatedAt: new Date().toISOString()
        }

        localStorage.setItem(profileKey, JSON.stringify(profile))

        // update central profiles array
        const profiles = JSON.parse(localStorage.getItem('studentProfiles') || '[]')
        const pi = profiles.findIndex(p => p.id === reg.id)
        if (pi >= 0) profiles[pi] = profile
        else profiles.push(profile)
        localStorage.setItem('studentProfiles', JSON.stringify(profiles))
      } else {
        // Unregistered student: persist profile keyed by index
        const profileKey = `studentProfile_index_${newEntry.indexNumber}`
        const existing = JSON.parse(localStorage.getItem(profileKey) || 'null') || {}
        const profile = {
          id: null,
          indexNumber: newEntry.indexNumber,
          fullName: newEntry.fullName,
          registeredDetails: null,
          testScore: newEntry,
          selections: {},
          aggregate: newEntry.aggregate,
          placementCategory: newEntry.placement,
          placedSchool: existing.placedSchool || null,
          status: existing.status || null,
          generatedAt: new Date().toISOString()
        }
        localStorage.setItem(profileKey, JSON.stringify(profile))

        const profiles = JSON.parse(localStorage.getItem('studentProfiles') || '[]')
        const pi = profiles.findIndex(p => (p.id && p.id === profile.id) || (p.indexNumber && p.indexNumber === profile.indexNumber))
        if (pi >= 0) profiles[pi] = profile
        else profiles.push(profile)
        localStorage.setItem('studentProfiles', JSON.stringify(profiles))
      }
    } catch (e) {
      console.warn('Failed to update student profile after score save', e)
    }
    
    // reset form except keep index and name for convenience
    setForm({ indexNumber: '', fullName: '', english: '', mathematics: '', science: '', socialStudies: '', computing: '', religious: '', careerTech: '', creativeArts: '', ghanaianLanguage: '', french: '' })
    alert('Test scores saved successfully!')
  }

  const computeGrade = (avg) => {
    if (avg >= 90 && avg <= 100) return 1
    if (avg >= 80 && avg <= 89) return 2
    if (avg >= 75 && avg <= 79) return 3
    if (avg >= 70 && avg <= 74) return 4
    if (avg >= 65 && avg <= 69) return 5
    if (avg >= 60 && avg <= 64) return 6
    if (avg >= 55 && avg <= 59) return 7
    if (avg >= 50 && avg <= 54) return 8
    return 9
  }

  return (
    <div className="testscores-container">
      <h2>Test Scores Management</h2>

      <div className="testscores-header">
        <div className="upload-section">
          <label htmlFor="csv-upload" className="btn btn-success">
            <IoCloudUpload className="app-icon" /> Upload CSV
          </label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleBulkUpload}
            style={{ display: 'none' }}
          />
        </div>

        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Students</option>
          <option value="high">High Performers (80+)</option>
          <option value="medium">Medium (60-79)</option>
          <option value="low">Low Performers (-60)</option>
        </select>
      </div>

      <form className="scores-entry" onSubmit={handleSubmit}>
        <div className="entry-row">
          <div className="form-group">
            <label>Search Index Number</label>
            <input
              type="text"
              value={form.indexNumber}
              onChange={handleIndexChange}
              placeholder="Enter index number to auto-fill name"
            />
            {lookupError && <div className="error-message">{lookupError}</div>}
          </div>
          <div className="form-group">
            <label>Full Name (verification)</label>
            <input type="text" value={form.fullName} readOnly placeholder="Student full name" />
          </div>
        </div>

        <div className="scores-grid">
          {subjectKeys.map(key => (
            <div className="form-group" key={key}>
              <label>{subjectLabels[key]} (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form[key]}
                onChange={(e) => handleScoreChange(key, e.target.value)}
                placeholder="0"
              />
            </div>
          ))}
        </div>

        <button type="submit" className="btn btn-primary">Save Scores</button>
      </form>

      <div className="scores-table">
        <table>
          <thead>
            <tr>
              <th>Index Number</th>
              <th>Student Name</th>
              {subjectKeys.map(k => <th key={k}>{subjectLabels[k]}</th>)}
                <th>Average</th>
                <th>Aggregate (Core + Best 2)</th>
              <th>Placement</th>
            </tr>
          </thead>
          <tbody>
            {scores.map(score => (
              <tr key={score.id}>
                <td>{score.indexNumber}</td>
                <td>{score.fullName}</td>
                {subjectKeys.map(k => (
                  <td className="score-cell" key={k}>{score[k]}</td>
                ))}
                <td className="score-average"><strong>{score.average}</strong></td>
                <td className="score-aggregate"><strong>{score.aggregate}</strong></td>
                <td>
                  <span className={`placement-badge placement-${(score.placement||'').toString().replace(/\s+/g, '').toLowerCase()}`}>
                    {score.placement === 'Not Qualified' ? 'Not Qualified' : `Category ${score.placement}`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="btn btn-primary" onClick={handleDownloadReport}>Download Report</button>
    </div>
  )
}
