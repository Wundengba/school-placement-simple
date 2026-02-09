import { useState, useMemo } from 'react'
import '../styles/SchoolSelection.css'
import { IoSchool, IoCheckmarkCircle, IoSearch } from 'react-icons/io5'
import schools from '../data/schools'
import syncService from '../services/syncService'

export default function SchoolSelection() {
  // load schools from external data file
  const mockSchools = useMemo(() => schools, [schools])

  const schoolsByCategory = useMemo(() => {
    return mockSchools.reduce((acc, s) => {
      acc[s.category] = acc[s.category] || []
      acc[s.category].push(s)
      return acc
    }, {})
  }, [mockSchools])

  // Student lookup
  const [studentIndexInput, setStudentIndexInput] = useState('')
  const [currentStudent, setCurrentStudent] = useState(null)
  const [lookupError, setLookupError] = useState('')

  const [catA, setCatA] = useState('')
  const [catB, setCatB] = useState(['', ''])
  const [catC, setCatC] = useState(['', '', '', ''])
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const allSelected = useMemo(() => {
    return [catA, ...catB, ...catC].filter(Boolean)
  }, [catA, catB, catC])

  const handleFindStudent = () => {
    setLookupError('')
    const index = studentIndexInput.trim()
    
    if (!index) {
      setLookupError('Please enter a student index number')
      return
    }

    // Look for student in registered students
    const registeredStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
    const student = registeredStudents.find(s => s.indexNumber === index)

    if (!student) {
      setLookupError(`Student with index number "${index}" not found`)
      return
    }

    // Load student's previous selections if they exist
    const studentSelections = JSON.parse(localStorage.getItem(`schoolSelections_${student.id}`) || 'null')
    
    setCurrentStudent(student)
    
    if (studentSelections) {
      // Restore previous selections
      setCatA(studentSelections.catA || '')
      setCatB(studentSelections.catB || ['', ''])
      setCatC(studentSelections.catC || ['', '', '', ''])
    } else {
      // Clear selections for new entry
      setCatA('')
      setCatB(['', ''])
      setCatC(['', '', '', ''])
    }

    setSubmitted(false)
    setError('')
  }

  const handleBChange = (idx, val) => {
    const next = [...catB]
    next[idx] = val
    setCatB(next)
  }

  const handleCChange = (idx, val) => {
    const next = [...catC]
    next[idx] = val
    setCatC(next)
  }

  const validate = () => {
    setError('')
    if (!catA) return 'Please select one Category A school.'
    if (catB.filter(Boolean).length !== 2) return 'Please select two Category B schools.'
    if (catC.filter(Boolean).length !== 4) return 'Please select four Category C schools.'
    // uniqueness
    const uniques = new Set(allSelected)
    if (uniques.size !== allSelected.length) return 'Please ensure all selected schools are unique.'
    return ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    
    // Save selections with student ID
    const selections = { catA, catB, catC }
    localStorage.setItem(`schoolSelections_${currentStudent.id}`, JSON.stringify(selections))
    
    // Trigger real-time sync for preferences
    syncService.notifyDataChange('schoolSelections')
    
    setSubmitted(true)
    console.log('School selections saved:', { student: currentStudent, ...selections })

    // Update student profile with new selections
    try {
      const profileKey = `studentProfile_${currentStudent.id}`
      const existing = JSON.parse(localStorage.getItem(profileKey) || 'null') || {}
      const allTestScores = JSON.parse(localStorage.getItem('testScores') || '[]')
      const ts = allTestScores.find(ts => ((ts.indexNumber || '').toString().trim().toUpperCase()) === ((currentStudent.indexNumber || '').toString().trim().toUpperCase())) || null

      const profile = {
        id: currentStudent.id,
        indexNumber: currentStudent.indexNumber,
        fullName: currentStudent.fullName,
        registeredDetails: currentStudent,
        testScore: ts,
        selections: selections,
        aggregate: ts?.aggregate ?? null,
        placementCategory: ts?.placement ?? null,
        placedSchool: currentStudent.placedSchool || existing.placedSchool || null,
        status: currentStudent.status || existing.status || null,
        generatedAt: new Date().toISOString()
      }

      localStorage.setItem(profileKey, JSON.stringify(profile))

      const profiles = JSON.parse(localStorage.getItem('studentProfiles') || '[]')
      const pi = profiles.findIndex(p => p.id === currentStudent.id)
      if (pi >= 0) profiles[pi] = profile
      else profiles.push(profile)
      localStorage.setItem('studentProfiles', JSON.stringify(profiles))
    } catch (e) {
      console.warn('Failed to update student profile after saving selections', e)
    }
  }

  const reset = () => {
    setCatA('')
    setCatB(['', ''])
    setCatC(['', '', '', ''])
    setSubmitted(false)
    setError('')
  }

  const handleNewStudent = () => {
    setCurrentStudent(null)
    setStudentIndexInput('')
    setLookupError('')
    reset()
  }

  // Show lookup screen if no student selected
  if (!currentStudent) {
    return (
      <div className="schoolselection-container">
        <h2>School Selection</h2>
        <p className="muted">Retrieve student record to proceed</p>

        <div className="student-lookup-section">
          <div className="lookup-input-group">
            <input
              type="text"
              value={studentIndexInput}
              onChange={(e) => setStudentIndexInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleFindStudent()}
              placeholder="Student Index Number"
              className="lookup-input"
            />
            <button className="btn btn-primary" onClick={handleFindStudent}>
              <IoSearch className="app-icon" />Find
            </button>
          </div>
          {lookupError && <div className="error-box">{lookupError}</div>}
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="schoolselection-container">
        <div className="success-box">
          <h2><IoCheckmarkCircle className="app-icon" /> Selection Saved</h2>
          <p>School preferences have been recorded for <strong>{currentStudent.fullName}</strong> (Index: {currentStudent.indexNumber})</p>
          <div className="selection-summary">
            <h4>Category A</h4>
            <p>{mockSchools.find(s=>s.id===catA)?.name || '-'}</p>
            <h4>Category B</h4>
            <ol>
              {catB.map((id, i) => <li key={i}>{mockSchools.find(s=>s.id===id)?.name || '-'}</li>)}
            </ol>
            <h4>Category C</h4>
            <ol>
              {catC.map((id, i) => <li key={i}>{mockSchools.find(s=>s.id===id)?.name || '-'}</li>)}
            </ol>
          </div>
          <div className="btn-group">
            <button className="btn btn-secondary" onClick={reset}>Update Selections</button>
            <button className="btn btn-primary" onClick={handleNewStudent}>Select Another Student</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="schoolselection-container">
      <h2>School Selection</h2>
      <div className="student-info-bar">
        <p><strong>Student:</strong> {currentStudent.fullName} <span className="muted">(Index: {currentStudent.indexNumber})</span></p>
        <button className="btn btn-sm btn-secondary" onClick={handleNewStudent}>Find Different Student</button>
      </div>
      <p className="muted">Select your preferred schools: 1 Category A, 2 Category B, 4 Category C. Choices must be unique.</p>

      <form className="selection-form" onSubmit={handleSubmit}>
        <div className="section">
          <h3><IoSchool className="app-icon"/> Category A (choose 1)</h3>
          <select value={catA} onChange={(e)=>setCatA(e.target.value)} required>
            <option value="">-- Select Category A school --</option>
            {(schoolsByCategory.A||[])
              .filter(s => {
                const selectedCheck = s.id === catA || !new Set([...(catB.filter(Boolean)), ...(catC.filter(Boolean))]).has(s.id)
                return selectedCheck
              })
              .map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
          </select>
        </div>

        <div className="section">
          <h3><IoSchool className="app-icon"/> Category B (choose 2)</h3>
          <div className="grid-2">
            {[0,1].map(i => (
              <select key={i} value={catB[i]} onChange={(e)=>handleBChange(i, e.target.value)} required>
                <option value="">-- Select B{ i+1 } --</option>
                {(schoolsByCategory.B||[])
                  .filter(s => {
                    const selectedCheck = s.id === catB[i] || !new Set([catA, ...catB.filter((v, idx) => idx !== i && Boolean(v)), ...catC.filter(Boolean)]).has(s.id)
                    return selectedCheck
                  })
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </select>
            ))}
          </div>
        </div>

        <div className="section">
          <h3><IoSchool className="app-icon"/> Category C (choose 4)</h3>
          <div className="grid-4">
            {[0,1,2,3].map(i => (
              <select key={i} value={catC[i]} onChange={(e)=>handleCChange(i, e.target.value)} required>
                <option value="">-- Select C{ i+1 } --</option>
                {(schoolsByCategory.C||[])
                  .filter(s => {
                    const selectedCheck = s.id === catC[i] || !new Set([catA, ...catB.filter(Boolean), ...catC.filter((v, idx) => idx !== i && Boolean(v))]).has(s.id)
                    return selectedCheck
                  })
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </select>
            ))}
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="btn-group">
          <button type="submit" className="btn btn-primary">Save Preferences</button>
          <button type="button" className="btn btn-danger" onClick={reset}>Reset</button>
        </div>
      </form>
    </div>
  )
}
