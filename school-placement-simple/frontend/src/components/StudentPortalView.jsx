import { useState, useEffect, useMemo } from 'react'
import { IoLogOut, IoSchool, IoCheckmarkCircle } from 'react-icons/io5'
import '../styles/StudentPortal.css'
import schools from '../data/schools'

export default function StudentPortalView({ studentInfo }) {
  const student = studentInfo ? JSON.parse(studentInfo) : null
  const [placementData, setPlacementData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [studentDataError, setStudentDataError] = useState(null)
  
  // School selection state
  const mockSchools = useMemo(() => schools, [])
  const schoolsByCategory = useMemo(() => {
    return mockSchools.reduce((acc, s) => {
      acc[s.category] = acc[s.category] || []
      acc[s.category].push(s)
      return acc
    }, {})
  }, [mockSchools])
  
  const [catA, setCatA] = useState('')
  const [catB, setCatB] = useState(['', ''])
  const [catC, setCatC] = useState(['', '', '', ''])
  const [selectionSubmitted, setSelectionSubmitted] = useState(false)
  const [selectionError, setSelectionError] = useState('')
  const [selectionLoading, setSelectionLoading] = useState(false)

  useEffect(() => {
    if (!student) {
      setStudentDataError('Student information not available')
      setLoading(false)
      return
    }
    
    // Fetch student's placement data and any additional info from backend
    const fetchPlacementData = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://backend-seven-ashen-18.vercel.app/api' : '/api')
        const resp = await fetch(`${API_BASE}/sync/download`)
        const data = await resp.json()
        
        if (data.success && data.data.students) {
          const studentRecord = data.data.students.find(s => s.indexNumber === student.indexNumber)
          if (studentRecord) {
            setPlacementData(studentRecord)
          } else {
            setStudentDataError('Student record not found in database')
          }
        } else {
          setStudentDataError('Failed to load student data')
        }
      } catch (err) {
        console.error('Error fetching placement data:', err)
        setStudentDataError('Error loading student data: ' + err.message)
      } finally {
        setLoading(false)
      }
    }
    
    // Load student's existing school selections
    const existingSelections = localStorage.getItem(`studentSchoolSelections_${student.indexNumber}`)
    if (existingSelections) {
      const selections = JSON.parse(existingSelections)
      setCatA(selections.catA || '')
      setCatB(selections.catB || ['', ''])
      setCatC(selections.catC || ['', '', '', ''])
      setSelectionSubmitted(true)
    }
    
    fetchPlacementData()
  }, [student])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('studentInfo')
    window.location.reload()
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

  const validateSelections = () => {
    setSelectionError('')
    if (!catA) return 'Please select one Category A school.'
    if (catB.filter(Boolean).length !== 2) return 'Please select two Category B schools.'
    if (catC.filter(Boolean).length !== 4) return 'Please select four Category C schools.'
    const allSelected = [catA, ...catB, ...catC].filter(Boolean)
    const uniques = new Set(allSelected)
    if (uniques.size !== allSelected.length) return 'Please ensure all selected schools are unique.'
    return ''
  }

  const handleSubmitSelections = (e) => {
    e.preventDefault()
    const error = validateSelections()
    if (error) {
      setSelectionError(error)
      return
    }
    
    setSelectionLoading(true)
    try {
      // Save selections to localStorage
      const selections = { catA, catB, catC, savedAt: new Date().toISOString() }
      localStorage.setItem(`studentSchoolSelections_${student.indexNumber}`, JSON.stringify(selections))
      setSelectionSubmitted(true)
      setSelectionError('')
    } catch (err) {
      setSelectionError('Failed to save selections: ' + err.message)
    } finally {
      setSelectionLoading(false)
    }
  }

  const handleResetSelections = () => {
    setCatA('')
    setCatB(['', ''])
    setCatC(['', '', '', ''])
    setSelectionSubmitted(false)
    setSelectionError('')
  }

  if (!student) {
    return (
      <div className="student-portal error">
        <div style={{padding: 40, textAlign: 'center'}}>
          <h2>Error loading student information</h2>
          <p style={{color: '#666', marginBottom: 20}}>Student data is not available. Please log in again.</p>
          <button className="btn btn-primary" onClick={() => {
            localStorage.removeItem('authToken')
            localStorage.removeItem('studentInfo')
            window.location.reload()
          }}>
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  const displayName = student?.fullName || 'Student'
  const displayIndex = student?.indexNumber || 'N/A'
  const displayEmail = student?.email || 'Not provided'

  return (
    <div className="student-portal">
      <header className="student-header">
        <div className="student-header-left">
          <h1>Student Placement Portal</h1>
          <p>Check your school placement status and make selections</p>
        </div>
        <div className="student-header-right">
          <span className="student-name">{displayName}</span>
          <button className="btn btn-logout" onClick={handleLogout}>
            <IoLogOut /> Logout
          </button>
        </div>
      </header>

      <main className="student-main">
        {studentDataError && (
          <div style={{
            backgroundColor: '#ffebee',
            border: '1px solid #f44336',
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
            color: '#c62828'
          }}>
            <strong>⚠️ Data Error:</strong> {studentDataError}
          </div>
        )}

        <div className="student-card">
          <h2>Your Information</h2>
          {loading ? (
            <p style={{color: '#999'}}>Loading your information...</p>
          ) : (
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Index Number:</span>
                <span className="value">{displayIndex}</span>
              </div>
              <div className="info-item">
                <span className="label">Full Name:</span>
                <span className="value">{displayName}</span>
              </div>
              <div className="info-item">
                <span className="label">Email:</span>
                <span className="value">{displayEmail}</span>
              </div>
            </div>
          )}
        </div>

        <div className="student-card">
          <h2>Placement Status</h2>
          {loading ? (
            <p style={{color: '#999'}}>Loading your placement status...</p>
          ) : placementData ? (
            <div className="status-info">
              <div className={`status-badge status-${placementData.status || 'pending'}`}>
                {(placementData.status || 'PENDING').toUpperCase()}
              </div>
              {placementData.placedSchool && (
                <div className="placed-school">
                  <h3>Placed School:</h3>
                  <p>{typeof placementData.placedSchool === 'object' ? (placementData.placedSchool?.name || 'Unknown School') : placementData.placedSchool}</p>
                </div>
              )}
              {!placementData.placedSchool && (
                <p className="not-placed">You have not been placed yet. Please complete your school selections below.</p>
              )}
            </div>
          ) : (
            <p>No placement data available</p>
          )}
        </div>

        <div className="student-card">
          <h2><IoSchool style={{marginRight: 8}} /> School Selection</h2>
          <p style={{color: '#666', marginBottom: 16}}>Select your preferred schools: 1 Category A, 2 Category B, 4 Category C (must be unique)</p>
          
          {selectionSubmitted && !selectionError && (
            <div style={{
              backgroundColor: '#e8f5e9',
              border: '1px solid #4caf50',
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
              color: '#2e7d32'
            }}>
              <IoCheckmarkCircle style={{marginRight: 8, fontSize: 20, verticalAlign: 'middle'}} />
              <strong>Selections saved successfully!</strong>
            </div>
          )}
          
          <form onSubmit={handleSubmitSelections}>
            <div style={{marginBottom: 20}}>
              <h4 style={{marginBottom: 8}}>Category A (select 1)</h4>
              <select 
                value={catA} 
                onChange={(e) => setCatA(e.target.value)}
                style={{width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ddd'}}
              >
                <option value="">-- Select Category A school --</option>
                {(schoolsByCategory.A || [])
                  .filter(s => s.id === catA || !new Set([...(catB.filter(Boolean)), ...(catC.filter(Boolean))]).has(s.id))
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </select>
            </div>

            <div style={{marginBottom: 20}}>
              <h4 style={{marginBottom: 8}}>Category B (select 2)</h4>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
                {[0, 1].map(i => (
                  <select 
                    key={i} 
                    value={catB[i]} 
                    onChange={(e) => handleBChange(i, e.target.value)}
                    style={{padding: 10, borderRadius: 4, border: '1px solid #ddd'}}
                  >
                    <option value="">-- Select B{i + 1} --</option>
                    {(schoolsByCategory.B || [])
                      .filter(s => s.id === catB[i] || !new Set([catA, ...catB.filter((v, idx) => idx !== i && Boolean(v)), ...catC.filter(Boolean)]).has(s.id))
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </select>
                ))}
              </div>
            </div>

            <div style={{marginBottom: 20}}>
              <h4 style={{marginBottom: 8}}>Category C (select 4)</h4>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
                {[0, 1, 2, 3].map(i => (
                  <select 
                    key={i} 
                    value={catC[i]} 
                    onChange={(e) => handleCChange(i, e.target.value)}
                    style={{padding: 10, borderRadius: 4, border: '1px solid #ddd'}}
                  >
                    <option value="">-- Select C{i + 1} --</option>
                    {(schoolsByCategory.C || [])
                      .filter(s => s.id === catC[i] || !new Set([catA, ...catB.filter(Boolean), ...catC.filter((v, idx) => idx !== i && Boolean(v))]).has(s.id))
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </select>
                ))}
              </div>
            </div>

            {selectionError && (
              <div style={{
                backgroundColor: '#ffebee',
                border: '1px solid #f44336',
                borderRadius: 8,
                padding: 12,
                color: '#c62828',
                marginBottom: 16
              }}>
                {selectionError}
              </div>
            )}

            <div style={{display: 'flex', gap: 12}}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={selectionLoading || selectionSubmitted}
                style={{flex: 1}}
              >
                {selectionLoading ? 'Saving...' : (selectionSubmitted ? 'Update Selections' : 'Save Preferences')}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleResetSelections}
                disabled={selectionLoading}
                style={{flex: 1}}
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        <div className="student-card">
          <h3>Important Notes</h3>
          <ul>
            <li>Your placement status may be updated regularly</li>
            <li>Please check back frequently for updates</li>
            <li>Contact your school if you have any questions</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
