import { useState, useEffect, useMemo } from 'react'
import { IoLogOut, IoSchool, IoCheckmarkCircle } from 'react-icons/io5'
import '../styles/StudentPortal.css'
import schools from '../data/schools'

export default function StudentPortalView({ studentInfo }) {
  const student = studentInfo ? JSON.parse(studentInfo) : null
  const [placementData, setPlacementData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [studentDataError, setStudentDataError] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editData, setEditData] = useState({})
  const [editPhoto, setEditPhoto] = useState(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'placement', 'schools', 'selected', 'results'
  const [mockScores, setMockScores] = useState([])
  const [mocksLoading, setMocksLoading] = useState(false)
  
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
    
    // Check if current user is an admin
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
    const adminInfo = localStorage.getItem('adminInfo') || sessionStorage.getItem('adminInfo')
    setIsAdmin(!!(adminToken && adminInfo))
    
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
    
    // Fetch mock scores for the student
    const fetchMockScores = async () => {
      try {
        setMocksLoading(true)
        const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://backend-seven-ashen-18.vercel.app/api' : '/api')
        
        // Use student ID from login response or extract from student object
        const studentId = student.id || student.studentId
        if (!studentId) {
          console.warn('No student ID available for mock scores fetch')
          return
        }
        
        const resp = await fetch(`${API_BASE}/students/${studentId}/mocks`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!resp.ok) {
          console.warn('Mock scores fetch failed with status:', resp.status)
          setMockScores([])
          return
        }
        
        const data = await resp.json()
        if (data.success && data.mocks) {
          setMockScores(data.mocks)
          console.log('✅ Mock scores loaded:', data.mocks.length, 'mocks')
        } else {
          setMockScores([])
        }
      } catch (err) {
        console.error('Error fetching mock scores:', err.message)
        // Don't fail - just show empty mock scores section
        setMockScores([])
      } finally {
        setMocksLoading(false)
      }
    }
    
    fetchPlacementData()
    fetchMockScores()
  }, [student])

  const startEdit = () => {
    setEditData({
      fullName: student?.fullName || '',
      email: student?.email || '',
      gender: placementData?.gender || '',
      dateOfBirth: placementData?.dateOfBirth ? new Date(placementData.dateOfBirth).toISOString().split('T')[0] : '',
      guardianName: placementData?.guardianName || '',
      guardianPhone: placementData?.guardianPhone || ''
    })
    setEditPhotoPreview(placementData?.photo || null)
    setIsEditMode(true)
    setEditError('')
  }

  const cancelEdit = () => {
    setIsEditMode(false)
    setEditData({})
    setEditPhoto(null)
    setEditPhotoPreview(null)
    setEditError('')
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target?.result
        setEditPhoto(base64String)
        setEditPhotoPreview(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const saveProfile = async () => {
    setIsSaving(true)
    setEditError('')
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://backend-seven-ashen-18.vercel.app/api' : '/api')
      
      // Update student info with new data
      const updatedStudent = {
        ...student,
        ...editData,
        photo: editPhoto || placementData?.photo
      }

      // Update backend
      const resp = await fetch(`${API_BASE}/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })

      if (!resp.ok) {
        throw new Error('Failed to save profile changes')
      }

      // Update localStorage
      localStorage.setItem('studentInfo', JSON.stringify(updatedStudent))
      
      // Update placement data display
      setPlacementData({
        ...placementData,
        ...editData,
        photo: editPhoto || placementData?.photo
      })

      setIsEditMode(false)
      setEditData({})
      setEditPhoto(null)
      setEditPhotoPreview(null)
    } catch (err) {
      setEditError('Failed to save changes: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

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
    (async () => {
      try {
        // Save selections to localStorage
        const selections = { catA, catB, catC, savedAt: new Date().toISOString() }
        localStorage.setItem(`studentSchoolSelections_${student.indexNumber}`, JSON.stringify(selections))
        setSelectionSubmitted(true)
        setSelectionError('')

        // Try to persist selections to backend so admin sees them
        try {
          const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://backend-seven-ashen-18.vercel.app/api' : '/api')

          // Ensure we have a student id; fetch students list if necessary
          let studentId = student.id
          if (!studentId) {
            const listResp = await fetch(`${API_BASE}/students`)
            if (listResp.ok) {
              const list = await listResp.json()
              const found = list.find(s => s.indexNumber === student.indexNumber)
              studentId = found?.id
            }
          }

          if (studentId) {
            const prefResp = await fetch(`${API_BASE}/students/${studentId}/preferences`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ catA, catB, catC })
            })

            if (!prefResp.ok) {
              console.warn('Failed to persist preferences to backend')
            } else {
              console.log('Preferences saved to backend')
            }
          } else {
            console.warn('Could not determine student id to persist preferences')
          }
        } catch (err) {
          console.warn('Error saving preferences to backend:', err.message)
        }
      } catch (err) {
        setSelectionError('Failed to save selections: ' + err.message)
      } finally {
        setSelectionLoading(false)
      }
    })()
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

      {/* Tab Navigation */}
      <div style={{
        backgroundColor: '#f5f5f5',
        borderBottom: '2px solid #2196F3',
        display: 'flex',
        gap: 0,
        padding: '0 20px'
      }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '14px 24px',
            backgroundColor: activeTab === 'profile' ? '#2196F3' : 'transparent',
            color: activeTab === 'profile' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'profile' ? 'bold' : 'normal',
            borderRadius: '4px 4px 0 0',
            transition: 'all 0.3s ease'
          }}
        >
          👤 Profile
        </button>
        <button
          onClick={() => setActiveTab('placement')}
          style={{
            padding: '14px 24px',
            backgroundColor: activeTab === 'placement' ? '#2196F3' : 'transparent',
            color: activeTab === 'placement' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'placement' ? 'bold' : 'normal',
            borderRadius: '4px 4px 0 0',
            transition: 'all 0.3s ease'
          }}
        >
          🎓 Placement Status
        </button>
        <button
          onClick={() => setActiveTab('schools')}
          style={{
            padding: '14px 24px',
            backgroundColor: activeTab === 'schools' ? '#2196F3' : 'transparent',
            color: activeTab === 'schools' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'schools' ? 'bold' : 'normal',
            borderRadius: '4px 4px 0 0',
            transition: 'all 0.3s ease'
          }}
        >
          🏫 School Selection
        </button>
        <button
          onClick={() => setActiveTab('selected')}
          style={{
            padding: '14px 24px',
            backgroundColor: activeTab === 'selected' ? '#2196F3' : 'transparent',
            color: activeTab === 'selected' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'selected' ? 'bold' : 'normal',
            borderRadius: '4px 4px 0 0',
            transition: 'all 0.3s ease'
          }}
        >
          ✅ Your Selections
        </button>
        <button
          onClick={() => setActiveTab('results')}
          style={{
            padding: '14px 24px',
            backgroundColor: activeTab === 'results' ? '#2196F3' : 'transparent',
            color: activeTab === 'results' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'results' ? 'bold' : 'normal',
            borderRadius: '4px 4px 0 0',
            transition: 'all 0.3s ease'
          }}
        >
          📊 Results
        </button>
      </div>

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

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
        <div className="student-card">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
            <h2>Your Complete Information</h2>
            {!isEditMode && isAdmin && (
              <button className="btn btn-primary" onClick={startEdit} style={{padding: '8px 16px'}}>
                ✏️ Edit Profile
              </button>
            )}
          </div>
          {loading ? (
            <p style={{color: '#999'}}>Loading your information...</p>
          ) : isEditMode ? (
            <div className="student-edit-form">
              {editError && (
                <div style={{
                  backgroundColor: '#ffebee',
                  border: '1px solid #f44336',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                  color: '#c62828'
                }}>
                  {editError}
                </div>
              )}
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16}}>
                {/* Photo Upload */}
                <div style={{gridColumn: '1 / -1'}}>
                  <label style={{display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#333'}}>
                    Student Photo
                  </label>
                  <div style={{display: 'flex', gap: 16, alignItems: 'flex-start'}}>
                    <div style={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      backgroundColor: '#e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '3px solid #2196F3'
                    }}>
                      {editPhotoPreview ? (
                        <img src={editPhotoPreview} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      ) : (
                        <div style={{fontSize: 40, color: '#999'}}>📷</div>
                      )}
                    </div>
                    <div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoSelect}
                        style={{marginBottom: 8}}
                      />
                      <p style={{fontSize: '12px', color: '#666', margin: 0}}>Upload a new photo (JPG, PNG)</p>
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label style={{display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 14, color: '#333'}}>
                    Full Name
                  </label>
                  <input 
                    type="text"
                    value={editData.fullName}
                    onChange={(e) => setEditData({...editData, fullName: e.target.value})}
                    style={{width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd', fontSize: 14}}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 14, color: '#333'}}>
                    Email
                  </label>
                  <input 
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    style={{width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd', fontSize: 14}}
                  />
                </div>

                {/* Gender */}
                <div>
                  <label style={{display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 14, color: '#333'}}>
                    Gender
                  </label>
                  <select 
                    value={editData.gender}
                    onChange={(e) => setEditData({...editData, gender: e.target.value})}
                    style={{width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd', fontSize: 14}}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label style={{display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 14, color: '#333'}}>
                    Date of Birth
                  </label>
                  <input 
                    type="date"
                    value={editData.dateOfBirth}
                    onChange={(e) => setEditData({...editData, dateOfBirth: e.target.value})}
                    style={{width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd', fontSize: 14}}
                  />
                </div>

                {/* Guardian Name */}
                <div>
                  <label style={{display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 14, color: '#333'}}>
                    Guardian Name
                  </label>
                  <input 
                    type="text"
                    value={editData.guardianName}
                    onChange={(e) => setEditData({...editData, guardianName: e.target.value})}
                    style={{width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd', fontSize: 14}}
                  />
                </div>

                {/* Guardian Phone */}
                <div>
                  <label style={{display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 14, color: '#333'}}>
                    Guardian Phone
                  </label>
                  <input 
                    type="tel"
                    value={editData.guardianPhone}
                    onChange={(e) => setEditData({...editData, guardianPhone: e.target.value})}
                    style={{width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd', fontSize: 14}}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16}}>
                <button 
                  className="btn" 
                  onClick={cancelEdit}
                  style={{padding: '10px 20px', backgroundColor: '#f5f5f5', color: '#333', border: '1px solid #ddd'}}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={saveProfile}
                  style={{padding: '10px 20px'}}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="student-complete-info">
              <div style={{display: 'flex', gap: 24, flexWrap: 'wrap'}}>
                {/* Photo Section */}
                <div style={{textAlign: 'center'}}>
                  <div style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    backgroundColor: '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '3px solid #2196F3',
                    marginBottom: 10
                  }}>
                    {placementData?.photo ? (
                      <img src={placementData.photo} alt="Student Photo" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    ) : (
                      <div style={{fontSize: 40, color: '#999'}}>📷</div>
                    )}
                  </div>
                  <p style={{color: '#666', fontSize: '12px'}}>Student Photo</p>
                </div>

                {/* Details Section */}
                <div style={{flex: 1, minWidth: 250}}>
                  <div className="info-grid" style={{gridTemplateColumns: '1fr 1fr', gap: 16}}>
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
                    <div className="info-item">
                      <span className="label">Gender:</span>
                      <span className="value">{placementData?.gender || 'Not specified'}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Date of Birth:</span>
                      <span className="value">
                        {placementData?.dateOfBirth ? new Date(placementData.dateOfBirth).toLocaleDateString() : 'Not provided'}
                      </span>
                    </div>
                  </div>

                  {/* Guardian Information */}
                  <div style={{marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee'}}>
                    <h4 style={{marginBottom: 8, color: '#333'}}>Guardian Information</h4>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
                      <div className="info-item">
                        <span className="label">Guardian Name:</span>
                        <span className="value">{placementData?.guardianName || 'Not provided'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Guardian Phone:</span>
                        <span className="value">{placementData?.guardianPhone || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* PLACEMENT STATUS TAB */}
        {activeTab === 'placement' && (
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
        )}

        {/* SCHOOL SELECTION TAB */}
        {activeTab === 'schools' && (
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
        )}

        {/* YOUR SELECTIONS TAB */}
        {activeTab === 'selected' && (
        <div className="student-card">
          <h2>📋 Your Selected Schools</h2>
          {!selectionSubmitted ? (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: 8,
              padding: 16,
              color: '#856404'
            }}>
              <strong>ℹ️ No selections yet</strong>
              <p style={{margin: '8px 0 0 0'}}>You haven't submitted your school selections yet. Go to the "School Selection" tab to choose your preferred schools.</p>
            </div>
          ) : (
            <div>
              {/* Category A */}
              <div style={{marginBottom: 24}}>
                <h4 style={{color: '#2196F3', marginBottom: 12, fontSize: 16, fontWeight: 'bold'}}>📌 Category A (1 Selection)</h4>
                {catA ? (
                  <div style={{
                    backgroundColor: '#e3f2fd',
                    border: '1px solid #2196F3',
                    borderRadius: 8,
                    padding: 14,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{fontSize: 15, fontWeight: '500', color: '#1976D2'}}>
                      {schoolsByCategory['A']?.find(s => s.id === catA)?.name || catA}
                    </span>
                    <span style={{fontSize: 20}}>✓</span>
                  </div>
                ) : (
                  <div style={{color: '#999', fontStyle: 'italic', padding: 12}}>Not selected</div>
                )}
              </div>

              {/* Category B */}
              <div style={{marginBottom: 24}}>
                <h4 style={{color: '#4CAF50', marginBottom: 12, fontSize: 16, fontWeight: 'bold'}}>📌 Category B (2 Selections)</h4>
                {catB.filter(Boolean).length > 0 ? (
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12}}>
                    {catB.map((schoolId, idx) => (
                      schoolId ? (
                        <div key={idx} style={{
                          backgroundColor: '#e8f5e9',
                          border: '1px solid #4CAF50',
                          borderRadius: 8,
                          padding: 14,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{fontSize: 14, fontWeight: '500', color: '#388E3C'}}>
                            {schoolsByCategory['B']?.find(s => s.id === schoolId)?.name || schoolId}
                          </span>
                          <span style={{fontSize: 18}}>✓</span>
                        </div>
                      ) : (
                        <div key={idx} style={{color: '#999', fontStyle: 'italic', padding: 12}}>Not selected</div>
                      )
                    ))}
                  </div>
                ) : (
                  <div style={{color: '#999', fontStyle: 'italic', padding: 12}}>Not selected</div>
                )}
              </div>

              {/* Category C */}
              <div style={{marginBottom: 24}}>
                <h4 style={{color: '#FF9800', marginBottom: 12, fontSize: 16, fontWeight: 'bold'}}>📌 Category C (4 Selections)</h4>
                {catC.filter(Boolean).length > 0 ? (
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12}}>
                    {catC.map((schoolId, idx) => (
                      schoolId ? (
                        <div key={idx} style={{
                          backgroundColor: '#fff3e0',
                          border: '1px solid #FF9800',
                          borderRadius: 8,
                          padding: 14,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{fontSize: 14, fontWeight: '500', color: '#E65100'}}>
                            {schoolsByCategory['C']?.find(s => s.id === schoolId)?.name || schoolId}
                          </span>
                          <span style={{fontSize: 18}}>✓</span>
                        </div>
                      ) : (
                        <div key={idx} style={{color: '#999', fontStyle: 'italic', padding: 12}}>Not selected</div>
                      )
                    ))}
                  </div>
                ) : (
                  <div style={{color: '#999', fontStyle: 'italic', padding: 12}}>Not selected</div>
                )}
              </div>

              {/* Summary */}
              <div style={{
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                padding: 16,
                marginTop: 20,
                textAlign: 'center'
              }}>
                <p style={{margin: 0, color: '#666'}}>
                  <strong>Total Schools Selected:</strong> {[catA, ...catB.filter(Boolean), ...catC.filter(Boolean)].length} / 7
                </p>
              </div>
            </div>
          )}
        </div>
        )}

        {/* RESULTS TAB */}
        {activeTab === 'results' && (
        <div className="student-card">
          <h2>📊 Your Results</h2>
          {loading ? (
            <p style={{color: '#999'}}>Loading your test scores...</p>
          ) : (
            <div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24}}>
                {/* Mathematics */}
                <div style={{
                  backgroundColor: '#e3f2fd',
                  border: '2px solid #2196F3',
                  borderRadius: 12,
                  padding: 24,
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{fontSize: 14, color: '#1976D2', fontWeight: '600', marginBottom: 8}}>Mathematics</div>
                  <div style={{fontSize: 48, fontWeight: 'bold', color: '#2196F3', marginBottom: 8}}>
                    {placementData?.maths !== null && placementData?.maths !== undefined ? placementData.maths : '-'}
                  </div>
                  <div style={{fontSize: 12, color: '#666'}}>Score out of 100</div>
                </div>

                {/* English */}
                <div style={{
                  backgroundColor: '#e8f5e9',
                  border: '2px solid #4CAF50',
                  borderRadius: 12,
                  padding: 24,
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{fontSize: 14, color: '#388E3C', fontWeight: '600', marginBottom: 8}}>English</div>
                  <div style={{fontSize: 48, fontWeight: 'bold', color: '#4CAF50', marginBottom: 8}}>
                    {placementData?.english !== null && placementData?.english !== undefined ? placementData.english : '-'}
                  </div>
                  <div style={{fontSize: 12, color: '#666'}}>Score out of 100</div>
                </div>

                {/* Science */}
                <div style={{
                  backgroundColor: '#fff3e0',
                  border: '2px solid #FF9800',
                  borderRadius: 12,
                  padding: 24,
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{fontSize: 14, color: '#E65100', fontWeight: '600', marginBottom: 8}}>Science</div>
                  <div style={{fontSize: 48, fontWeight: 'bold', color: '#FF9800', marginBottom: 8}}>
                    {placementData?.science !== null && placementData?.science !== undefined ? placementData.science : '-'}
                  </div>
                  <div style={{fontSize: 12, color: '#666'}}>Score out of 100</div>
                </div>
              </div>

              {/* Score Statistics and Analytics */}
              <div style={{
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                padding: 20,
                marginTop: 24
              }}>
                <h4 style={{marginTop: 0, marginBottom: 16, color: '#333'}}>📈 Score Analysis</h4>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16}}>
                  <div>
                    <div style={{fontSize: 12, color: '#666', marginBottom: 4}}>Average Score</div>
                    <div style={{fontSize: 24, fontWeight: 'bold', color: '#2196F3'}}>
                      {placementData && (placementData.maths || placementData.english || placementData.science) 
                        ? Math.round(
                            ((placementData.maths || 0) + (placementData.english || 0) + (placementData.science || 0)) / 3
                          )
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize: 12, color: '#666', marginBottom: 4}}>Highest Subject</div>
                    <div style={{fontSize: 20, fontWeight: 'bold', color: '#4CAF50'}}>
                      {placementData && (placementData.maths || placementData.english || placementData.science)
                        ? (() => {
                            const scores = {
                              'Math': placementData.maths || 0,
                              'English': placementData.english || 0,
                              'Science': placementData.science || 0
                            }
                            const highest = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)
                            return `${highest[0]} (${highest[1]})`
                          })()
                        : '-'
                      }
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize: 12, color: '#666', marginBottom: 4}}>Lowest Subject</div>
                    <div style={{fontSize: 20, fontWeight: 'bold', color: '#FF9800'}}>
                      {placementData && (placementData.maths || placementData.english || placementData.science)
                        ? (() => {
                            const scores = {
                              'Math': placementData.maths || 0,
                              'English': placementData.english || 0,
                              'Science': placementData.science || 0
                            }
                            const lowest = Object.entries(scores).reduce((a, b) => a[1] < b[1] ? a : b)
                            return `${lowest[0]} (${lowest[1]})`
                          })()
                        : '-'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Level Badge */}
              <div style={{
                backgroundColor: '#f0f4ff',
                borderRadius: 8,
                padding: 20,
                marginTop: 16,
                textAlign: 'center',
                border: '1px solid #e0e7ff'
              }}>
                {placementData && (placementData.maths || placementData.english || placementData.science) ? (() => {
                  const avg = Math.round(((placementData.maths || 0) + (placementData.english || 0) + (placementData.science || 0)) / 3)
                  let level = 'N/A', badge = '−', color = '#999', bgColor = '#f0f0f0'
                  
                  if (avg >= 90) { level = 'Outstanding'; badge = '⭐'; color = '#fbc02d'; bgColor = '#fffde7' }
                  else if (avg >= 80) { level = 'Excellent'; badge = '🎯'; color = '#2196F3'; bgColor = '#e3f2fd' }
                  else if (avg >= 70) { level = 'Good'; badge = '👍'; color = '#4CAF50'; bgColor = '#e8f5e9' }
                  else if (avg >= 60) { level = 'Satisfactory'; badge = '✓'; color = '#FF9800'; bgColor = '#fff3e0' }
                  else { level = 'Needs Improvement'; badge = '→'; color = '#f44336'; bgColor = '#ffebee' }
                  
                  return (
                    <div style={{color: color}}>
                      <div style={{fontSize: 32, marginBottom: 8}}>{badge}</div>
                      <div style={{fontSize: 20, fontWeight: 'bold', marginBottom: 4}}>Performance Level</div>
                      <div style={{fontSize: 18, color: color}}>{level}</div>
                    </div>
                  )
                })() : <div style={{color: '#999'}}>No scores available</div>}
              </div>

              {/* Grade Scale Interpretation */}
              <div style={{
                backgroundColor: '#fff8f0',
                borderRadius: 8,
                padding: 20,
                marginTop: 16,
                border: '1px solid #ffe0b2'
              }}>
                <h4 style={{marginTop: 0, marginBottom: 12, color: '#333'}}>📝 Subject Grades</h4>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12}}>
                  {/* Mathematics Grade */}
                  <div style={{
                    backgroundColor: '#e3f2fd',
                    padding: 12,
                    borderRadius: 6,
                    textAlign: 'center'
                  }}>
                    <div style={{fontSize: 12, color: '#666', marginBottom: 6}}>Mathematics</div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div style={{fontSize: 24, fontWeight: 'bold', color: '#2196F3'}}>
                        {placementData?.maths ? (() => {
                          const score = placementData.maths
                          if (score >= 90) return 'A+'; if (score >= 85) return 'A'; if (score >= 80) return 'B+'; 
                          if (score >= 75) return 'B'; if (score >= 70) return 'C+'; if (score >= 65) return 'C';
                          return 'D'
                        })() : '-'}
                      </div>
                      <div style={{fontSize: 10, color: '#999', maxWidth: '40%'}}>
                        {placementData?.maths ? (() => {
                          if (placementData.maths >= 80) return '✓ Strong'; 
                          if (placementData.maths >= 60) return '→ Average';
                          return '⚠ Weak'
                        })() : ''}
                      </div>
                    </div>
                  </div>

                  {/* English Grade */}
                  <div style={{
                    backgroundColor: '#e8f5e9',
                    padding: 12,
                    borderRadius: 6,
                    textAlign: 'center'
                  }}>
                    <div style={{fontSize: 12, color: '#666', marginBottom: 6}}>English</div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div style={{fontSize: 24, fontWeight: 'bold', color: '#4CAF50'}}>
                        {placementData?.english ? (() => {
                          const score = placementData.english
                          if (score >= 90) return 'A+'; if (score >= 85) return 'A'; if (score >= 80) return 'B+'; 
                          if (score >= 75) return 'B'; if (score >= 70) return 'C+'; if (score >= 65) return 'C';
                          return 'D'
                        })() : '-'}
                      </div>
                      <div style={{fontSize: 10, color: '#999', maxWidth: '40%'}}>
                        {placementData?.english ? (() => {
                          if (placementData.english >= 80) return '✓ Strong'; 
                          if (placementData.english >= 60) return '→ Average';
                          return '⚠ Weak'
                        })() : ''}
                      </div>
                    </div>
                  </div>

                  {/* Science Grade */}
                  <div style={{
                    backgroundColor: '#fff3e0',
                    padding: 12,
                    borderRadius: 6,
                    textAlign: 'center'
                  }}>
                    <div style={{fontSize: 12, color: '#666', marginBottom: 6}}>Science</div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div style={{fontSize: 24, fontWeight: 'bold', color: '#FF9800'}}>
                        {placementData?.science ? (() => {
                          const score = placementData.science
                          if (score >= 90) return 'A+'; if (score >= 85) return 'A'; if (score >= 80) return 'B+'; 
                          if (score >= 75) return 'B'; if (score >= 70) return 'C+'; if (score >= 65) return 'C';
                          return 'D'
                        })() : '-'}
                      </div>
                      <div style={{fontSize: 10, color: '#999', maxWidth: '40%'}}>
                        {placementData?.science ? (() => {
                          if (placementData.science >= 80) return '✓ Strong'; 
                          if (placementData.science >= 60) return '→ Average';
                          return '⚠ Weak'
                        })() : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Strength Analysis */}
              <div style={{
                backgroundColor: '#f3e5f5',
                borderRadius: 8,
                padding: 20,
                marginTop: 16,
                border: '1px solid #e1bee7'
              }}>
                <h4 style={{marginTop: 0, marginBottom: 12, color: '#333'}}>💪 Strength Analysis</h4>
                {placementData && (placementData.maths || placementData.english || placementData.science) ? (() => {
                  const scores = [
                    { subject: 'Mathematics', score: placementData.maths || 0, color: '#2196F3' },
                    { subject: 'English', score: placementData.english || 0, color: '#4CAF50' },
                    { subject: 'Science', score: placementData.science || 0, color: '#FF9800' }
                  ]
                  const avgScore = Math.round((scores[0].score + scores[1].score + scores[2].score) / 3)
                  
                  return (
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12}}>
                      {scores.map((item, idx) => {
                        const diff = item.score - avgScore
                        const status = diff > 5 ? 'Strength' : diff < -5 ? 'Area to Improve' : 'Balanced'
                        const icon = diff > 5 ? '⬆️' : diff < -5 ? '⬇️' : '→'
                        const bgColor = diff > 5 ? '#e8f5e9' : diff < -5 ? '#ffebee' : '#f5f5f5'
                        
                        return (
                          <div key={idx} style={{
                            backgroundColor: bgColor,
                            padding: 12,
                            borderRadius: 6,
                            borderLeft: `4px solid ${item.color}`
                          }}>
                            <div style={{fontSize: 12, color: '#666', marginBottom: 4}}>{item.subject}</div>
                            <div style={{fontSize: 14, fontWeight: 'bold', color: item.color, marginBottom: 4}}>
                              {item.score} {icon}
                            </div>
                            <div style={{fontSize: 11, color: '#999'}}>{status}</div>
                            {diff !== 0 && <div style={{fontSize: 10, color: '#666', marginTop: 4}}>
                              {Math.abs(diff)} pts {diff > 0 ? 'above' : 'below'} avg
                            </div>}
                          </div>
                        )
                      })}
                    </div>
                  )
                })() : <div style={{color: '#999'}}>No scores available for analysis</div>}
              </div>

              {/* Grade Scale Reference */}
              <div style={{
                backgroundColor: '#eceff1',
                borderRadius: 8,
                padding: 16,
                marginTop: 16,
                fontSize: 12,
                color: '#555'
              }}>
                <div style={{fontWeight: 'bold', marginBottom: 8, color: '#333'}}>📊 Grade Scale Reference</div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8}}>
                  <div>A+: 90-100 (Outstanding)</div>
                  <div>A: 85-89 (Excellent)</div>
                  <div>B+: 80-84 (Very Good)</div>
                  <div>B: 75-79 (Good)</div>
                  <div>C+: 70-74 (Satisfactory)</div>
                  <div>C: 65-69 (Acceptable)</div>
                  <div>D: Below 65 (Needs Work)</div>
                </div>
              </div>

              {/* Mock Exam Scores Section */}
              <div style={{marginTop: 32}}>
                <h3 style={{color: '#333', marginBottom: 20, borderBottom: '2px solid #e0e0e0', paddingBottom: 12}}>
                  🧪 Mock Exam Results
                </h3>
                
                {mocksLoading ? (
                  <p style={{color: '#999', textAlign: 'center', padding: 20}}>Loading mock exam results...</p>
                ) : mockScores && mockScores.length > 0 ? (
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20}}>
                    {mockScores.map((mock, mockIdx) => (
                      <div key={mockIdx} style={{
                        backgroundColor: '#f9f9f9',
                        border: '1px solid #ddd',
                        borderRadius: 10,
                        padding: 20,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                      }}>
                        <div style={{marginBottom: 16, borderBottom: '2px solid #2196F3', paddingBottom: 12}}>
                          <div style={{fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4}}>
                            📝 {mock.mockTitle}
                          </div>
                          {mock.mockDescription && (
                            <div style={{fontSize: 13, color: '#666', marginBottom: 4}}>
                              {mock.mockDescription}
                            </div>
                          )}
                          <div style={{fontSize: 11, color: '#999'}}>
                            Created: {new Date(mock.createdAt).toLocaleDateString()} by {mock.createdBy || 'Admin'}
                          </div>
                        </div>

                        {/* Mock Scores Grid */}
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12}}>
                          {mock.scores.map((score, idx) => {
                            const colorMap = {
                              'Mathematics': '#2196F3',
                              'English': '#4CAF50',
                              'Science': '#FF9800',
                              'Literature': '#9C27B0',
                              'History': '#CDDC39',
                              'Geography': '#00BCD4'
                            }
                            const bgColorMap = {
                              'Mathematics': '#e3f2fd',
                              'English': '#e8f5e9',
                              'Science': '#fff3e0',
                              'Literature': '#f3e5f5',
                              'History': '#fffde7',
                              'Geography': '#e0f2f1'
                            }

                            let gradeLetters = '−'
                            let performanceLevel = ''
                            if (score.score !== null && score.score !== undefined) {
                              if (score.score >= 90) { gradeLetters = 'A+'; performanceLevel = 'Outstanding' }
                              else if (score.score >= 85) { gradeLetters = 'A'; performanceLevel = 'Excellent' }
                              else if (score.score >= 80) { gradeLetters = 'B+'; performanceLevel = 'Very Good' }
                              else if (score.score >= 75) { gradeLetters = 'B'; performanceLevel = 'Good' }
                              else if (score.score >= 70) { gradeLetters = 'C+'; performanceLevel = 'Satisfactory' }
                              else if (score.score >= 65) { gradeLetters = 'C'; performanceLevel = 'Acceptable' }
                              else { gradeLetters = 'D'; performanceLevel = 'Needs Work' }
                            }

                            return (
                              <div key={idx} style={{
                                backgroundColor: bgColorMap[score.subject] || '#f5f5f5',
                                padding: 12,
                                borderRadius: 8,
                                border: `2px solid ${colorMap[score.subject] || '#ddd'}`
                              }}>
                                <div style={{fontSize: 12, color: '#666', marginBottom: 6}}>
                                  {score.subject}
                                </div>
                                <div style={{
                                  fontSize: 28,
                                  fontWeight: 'bold',
                                  color: colorMap[score.subject] || '#333',
                                  marginBottom: 4,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <span>{score.score !== null && score.score !== undefined ? score.score : '−'}</span>
                                  <span style={{fontSize: 16}}>{gradeLetters}</span>
                                </div>
                                {performanceLevel && (
                                  <div style={{fontSize: 11, color: colorMap[score.subject] || '#999', fontWeight: '600'}}>
                                    {performanceLevel}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Mock Summary Stats */}
                        {mock.scores && mock.scores.length > 0 && (() => {
                          const validScores = mock.scores.filter(s => s.score !== null && s.score !== undefined).map(s => s.score)
                          if (validScores.length === 0) return null

                          const avg = Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
                          const highest = Math.max(...validScores)
                          const lowest = Math.min(...validScores)
                          const highestSubject = mock.scores.find(s => s.score === highest)
                          const lowestSubject = mock.scores.find(s => s.score === lowest)

                          return (
                            <div style={{
                              marginTop: 12,
                              paddingTop: 12,
                              borderTop: '1px solid #ddd',
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gap: 8,
                              fontSize: 11
                            }}>
                              <div style={{textAlign: 'center'}}>
                                <div style={{color: '#666', marginBottom: 4}}>Average</div>
                                <div style={{fontSize: 16, fontWeight: 'bold', color: '#2196F3'}}>{avg}</div>
                              </div>
                              <div style={{textAlign: 'center'}}>
                                <div style={{color: '#666', marginBottom: 4}}>Highest</div>
                                <div style={{fontSize: 14, fontWeight: 'bold', color: '#4CAF50'}}>
                                  {highestSubject?.subject} ({highest})
                                </div>
                              </div>
                              <div style={{textAlign: 'center'}}>
                                <div style={{color: '#666', marginBottom: 4}}>Lowest</div>
                                <div style={{fontSize: 14, fontWeight: 'bold', color: '#FF9800'}}>
                                  {lowestSubject?.subject} ({lowest})
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: '#f5f5f5',
                    padding: 24,
                    textAlign: 'center',
                    borderRadius: 8,
                    color: '#999'
                  }}>
                    <p style={{margin: 0}}>No mock exam results available yet.</p>
                    <p style={{margin: 0, fontSize: 12}}>Administrators will add mock exams as they become available.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        )}

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
