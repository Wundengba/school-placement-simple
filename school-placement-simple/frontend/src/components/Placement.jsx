import { useState, useEffect } from 'react'
import '../styles/Placement.css'
import { IoCheckmarkCircle, IoCloseCircle, IoSearch, IoPlay } from 'react-icons/io5'
import schools from '../data/schools'

export default function Placement() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isRunning, setIsRunning] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState(null)

  useEffect(() => {
    loadPlacementData()
  }, [])

  const loadPlacementData = () => {
    const registeredStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
    const allTestScores = JSON.parse(localStorage.getItem('allTestScores') || '[]')
    
    // Combine student info with their test scores and placement (case-insensitive index match)
    const studentsWithPlacement = registeredStudents.map(student => {
      const testScore = allTestScores.find(ts => ((ts.indexNumber || '').toString().trim().toUpperCase()) === ((student.indexNumber || '').toString().trim().toUpperCase()))
      return {
        ...student,
        testScore,
        placementCategory: testScore?.placement || 'Unknown',
        aggregate: testScore?.aggregate || 'N/A'
      }
    })
    
    setStudents(studentsWithPlacement)
    setLoading(false)
  }

  const handleRunPlacement = () => {
    setIsRunning(true)
    
    // Get all registered students and their test scores
    const registeredStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
    const allTestScores = JSON.parse(localStorage.getItem('allTestScores') || '[]')
    
    if (registeredStudents.length === 0) {
      alert('No registered students found!')
      setIsRunning(false)
      return
    }
    
    if (allTestScores.length === 0) {
      alert('No test scores entered yet. Please enter test scores for students before running placement.')
      setIsRunning(false)
      return
    }
    
    let placedCount = 0
    let notQualifiedCount = 0

    // Build a quick map of test scores by normalized index
    const scoreByIndex = {}
    allTestScores.forEach(ts => {
      const key = (ts.indexNumber || '').toString().trim().toUpperCase()
      scoreByIndex[key] = ts
    })

    // Capacity map (if schools define capacity, otherwise unlimited)
    const capacityMap = {}
    schools.forEach(s => { capacityMap[s.id] = s.capacity || Infinity })
    const filledMap = {}

    // Prepare candidates: students with test scores and who are qualified (not 'Not Qualified')
    const candidates = registeredStudents.map(student => {
      const ts = scoreByIndex[(student.indexNumber || '').toString().trim().toUpperCase()]
      return { student, testScore: ts }
    })

    // Mark not-qualified early
    candidates.forEach(c => {
      if (!c.testScore) return
      if (c.testScore.placement === 'Not Qualified') notQualifiedCount++
    })

    // Sort eligible candidates by aggregate (numeric) ascending — better performance first (lower is better)
    const eligible = candidates
      .filter(c => c.testScore && c.testScore.placement && c.testScore.placement !== 'Not Qualified')
      .sort((a,b) => Number(a.testScore.aggregate || Infinity) - Number(b.testScore.aggregate || Infinity))

    const placedById = {}

    // Process each candidate in order, trying their preferences in order
    for (const c of eligible) {
      const student = c.student
      const testScore = c.testScore
      const placement = testScore.placement // 'A'|'B'|'C'

      const selections = JSON.parse(localStorage.getItem(`schoolSelections_${student.id}`) || '{}') || {}
      let schoolsToCheck = []
      if (placement === 'A') {
        if (selections.catA) schoolsToCheck = [selections.catA]
      } else if (placement === 'B') {
        schoolsToCheck = (selections.catB || []).filter(Boolean)
      } else if (placement === 'C') {
        schoolsToCheck = (selections.catC || []).filter(Boolean)
      }

      let assigned = null
      for (const schoolId of schoolsToCheck) {
        const school = schools.find(s => s.id === schoolId)
        if (!school) continue
        const used = filledMap[schoolId] || 0
        const cap = capacityMap[schoolId] === undefined ? Infinity : capacityMap[schoolId]
        if (used < cap) {
          // assign
          filledMap[schoolId] = used + 1
          assigned = { id: school.id, name: school.name, category: school.category, selected: true }
          placedCount++
          break
        }
      }

      if (assigned) placedById[student.id] = assigned
    }

    // Build updated students preserving original order
    const updatedStudents = registeredStudents.map(student => {
      const ts = scoreByIndex[(student.indexNumber || '').toString().trim().toUpperCase()]
      if (!ts) {
        return { ...student }
      }
      if (ts.placement === 'Not Qualified') {
        return { ...student, placedSchool: null, status: 'Not Qualified' }
      }
      if (placedById[student.id]) {
        return { ...student, placedSchool: placedById[student.id], status: 'Placed' }
      }
      return { ...student, placedSchool: null, status: 'Not Placed' }
    })
    
    // Update localStorage with placed students
    localStorage.setItem('registeredStudents', JSON.stringify(updatedStudents))

    // Persist debug info to help troubleshooting
    try {
      const debug = updatedStudents.map(s => ({
        id: s.id,
        indexNumber: s.indexNumber,
        placementCategory: s.placedSchool ? (typeof s.placedSchool === 'object' ? s.placedSchool.category : s.placedSchool) : (s.placementCategory || null),
        placedSchool: s.placedSchool || null,
        selections: JSON.parse(localStorage.getItem(`schoolSelections_${s.id}`) || 'null') || {}
      }))
      localStorage.setItem('placementDebug', JSON.stringify(debug))
      console.log('placementDebug', debug)
    } catch (e) {
      console.warn('Failed to write placement debug info', e)
    }

    // Reload placement data
    loadPlacementData()
    setIsRunning(false)

    const notPlaced = registeredStudents.filter(s => {
      const ts = allTestScores.find(t => ((t.indexNumber || '').toString().trim().toUpperCase()) === ((s.indexNumber || '').toString().trim().toUpperCase()))
      return ts && ts.placement !== 'Not Qualified' && !s.placedSchool
    }).length

    alert(`Placement Algorithm Completed!\n\nTotal Students: ${registeredStudents.length}\nPlaced: ${placedCount}\nNot Qualified: ${notQualifiedCount}\nNo Preferences/Not Placed: ${notPlaced}\n\nStudents are placed based on:\n- Their test score placement category\n- Their school preferences (selections)\n\nStudents without school selections cannot be placed.`)
  }

  const handleGenerateProfiles = () => {
    const registeredStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
    const allTestScores = JSON.parse(localStorage.getItem('allTestScores') || '[]')
    const profiles = registeredStudents.map(student => {
      const ts = allTestScores.find(ts => ((ts.indexNumber || '').toString().trim().toUpperCase()) === ((student.indexNumber || '').toString().trim().toUpperCase())) || null
      const selections = JSON.parse(localStorage.getItem(`schoolSelections_${student.id}`) || 'null') || { catA: '', catB: [], catC: [] }

      const profile = {
        id: student.id,
        indexNumber: student.indexNumber,
        fullName: student.fullName,
        registeredDetails: student,
        testScore: ts,
        selections: selections,
        aggregate: ts?.aggregate ?? null,
        placementCategory: ts?.placement ?? null,
        placedSchool: student.placedSchool || null,
        status: student.status || null,
        generatedAt: new Date().toISOString()
      }

      try {
        localStorage.setItem(`studentProfile_${student.id}`, JSON.stringify(profile))
      } catch (e) {
        console.warn('Failed to persist student profile', e)
      }

      return profile
    })

    // Also create profiles for test scores that do not belong to registered students
    allTestScores.forEach(ts => {
      const idx = (ts.indexNumber || '').toString().trim().toUpperCase()
      const already = profiles.find(p => (p.indexNumber || '').toString().trim().toUpperCase() === idx)
      if (already) return

      const profile = {
        id: null,
        indexNumber: ts.indexNumber,
        fullName: ts.fullName,
        registeredDetails: null,
        testScore: ts,
        selections: {},
        aggregate: ts.aggregate ?? null,
        placementCategory: ts.placement ?? null,
        placedSchool: null,
        status: null,
        generatedAt: new Date().toISOString()
      }

      try {
        localStorage.setItem(`studentProfile_index_${ts.indexNumber}`, JSON.stringify(profile))
      } catch (e) {
        console.warn('Failed to persist unregistered student profile', e)
      }

      profiles.push(profile)
    })

    try {
      localStorage.setItem('studentProfiles', JSON.stringify(profiles))
    } catch (e) {
      console.warn('Failed to persist student profiles array', e)
    }

    alert(`Generated ${profiles.length} student profiles and saved to localStorage.`)
  }

  const openProfile = (studentId) => {
    // try to load persisted profile first
    let profile = null
    try {
      profile = JSON.parse(localStorage.getItem(`studentProfile_${studentId}`) || 'null')
    } catch (e) {
      profile = null
    }

    if (!profile) {
      // build one from current stores
      const registeredStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
      const allTestScores = JSON.parse(localStorage.getItem('allTestScores') || '[]')
      const student = registeredStudents.find(s => s.id === studentId)
      if (!student) return alert('Student profile not found')
      const ts = allTestScores.find(ts => ((ts.indexNumber || '').toString().trim().toUpperCase()) === ((student.indexNumber || '').toString().trim().toUpperCase())) || null
      const selections = JSON.parse(localStorage.getItem(`schoolSelections_${student.id}`) || 'null') || { catA: '', catB: [], catC: [] }

      profile = {
        id: student.id,
        indexNumber: student.indexNumber,
        fullName: student.fullName,
        registeredDetails: student,
        testScore: ts,
        selections,
        aggregate: ts?.aggregate ?? null,
        placementCategory: ts?.placement ?? null,
        placedSchool: student.placedSchool || null,
        status: student.status || null,
        generatedAt: new Date().toISOString()
      }
    }

    // Always fetch fresh test scores to ensure they're up-to-date
    try {
      const allTestScores = JSON.parse(localStorage.getItem('allTestScores') || '[]')
      const registeredStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
      const student = registeredStudents.find(s => s.id === studentId)
      
      if (student && student.indexNumber) {
        const normalizedIndex = (student.indexNumber || '').toString().trim().toUpperCase()
        const freshTestScore = allTestScores.find(ts => ((ts.indexNumber || '').toString().trim().toUpperCase()) === normalizedIndex)
        if (freshTestScore) {
          profile.testScore = freshTestScore
          profile.aggregate = freshTestScore.aggregate ?? null
          profile.placementCategory = freshTestScore.placement ?? null
          console.log('Loaded fresh test score for', student.fullName, ':', freshTestScore)
        } else {
          console.warn('No test score found for', student.fullName, 'index:', student.indexNumber)
        }
      }
    } catch (e) {
      console.warn('Failed to fetch fresh test score data', e)
    }

    setSelectedProfile(profile)
  }

  const closeProfile = () => setSelectedProfile(null)

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.indexNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'placed' && student.placedSchool) ||
      (filterStatus === 'notplaced' && !student.placedSchool) ||
      (filterStatus === student.placementCategory.toLowerCase())
    
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: students.length,
    placed: students.filter(s => s.placedSchool).length,
    notPlaced: students.filter(s => !s.placedSchool).length
  }

  return (
    <div className="placement-container">
      <h2>Placement Results</h2>
      
      <div className="placement-stats">
        <div className="stat-box">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Students</div>
        </div>
        <div className="stat-box placed">
          <div className="stat-number">{stats.placed}</div>
          <div className="stat-label">Placed</div>
        </div>
        <div className="stat-box notplaced">
          <div className="stat-number">{stats.notPlaced}</div>
          <div className="stat-label">Not Placed</div>
        </div>
      </div>

      <div className="placement-controls">
        <div className="search-box">
          <IoSearch className="app-icon" />
          <input
            type="text"
            placeholder="Search by index or name..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Students</option>
          <option value="placed">Placed</option>
          <option value="notplaced">Not Placed</option>
          <option value="a">Category A</option>
          <option value="b">Category B</option>
          <option value="c">Category C</option>
          <option value="unknown">No Test Scores</option>
        </select>
      </div>

      <div className="placement-actions">
        <button 
          className="btn btn-primary" 
          onClick={handleRunPlacement}
          disabled={isRunning}
        >
          <IoPlay className="app-icon" /> 
          {isRunning ? 'Running...' : 'Run Placement Algorithm'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleGenerateProfiles}
          style={{ marginLeft: '0.5rem' }}
        >
          Generate Profiles
        </button>
      </div>

      {loading ? (
        <p>Loading placement data...</p>
      ) : (
        <div className="placement-table">
          <table>
            <thead>
              <tr>
                <th>Index Number</th>
                <th>Full Name</th>
                <th>Placement Category</th>
                <th>Aggregate</th>
                <th>Actions</th>
                <th>Placed School</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student.id} className={student.placedSchool ? 'row-placed' : 'row-notplaced'}>
                    <td className="index-cell">{student.indexNumber}</td>
                    <td className="name-cell">{student.fullName}</td>
                    <td className="category-cell">
                      {student.placementCategory !== 'Unknown' ? (
                        <span className={`category-badge cat-${student.placementCategory}`}>
                          Category {student.placementCategory}
                        </span>
                      ) : (
                        <span className="category-badge cat-unknown">Unknown</span>
                      )}
                    </td>
                    <td className="aggregate-cell">
                      {student.aggregate !== 'N/A' ? (
                        <span className="aggregate-value">{student.aggregate}</span>
                      ) : (
                        <span className="aggregate-na">—</span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <button className="btn btn-sm btn-secondary" onClick={() => openProfile(student.id)}>View</button>
                    </td>
                    <td className="school-cell">
                      {student.placedSchool ? (
                        <div className="school-info">
                          <div className="school-name">
                            {typeof student.placedSchool === 'object' 
                              ? student.placedSchool.name 
                              : student.placedSchool}
                          </div>
                          {typeof student.placedSchool === 'object' && (
                            <>
                              <div className="school-category">
                                Category {student.placedSchool.category}
                              </div>
                              {student.placedSchool.autoAssigned && (
                                <div className="assignment-type auto-assigned">
                                  Auto-Assigned
                                </div>
                              )}
                              {!student.placedSchool.autoAssigned && (
                                <div className="assignment-type selected">
                                  Selected
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="school-info no-placement">
                          {student.placementCategory === 'Not Qualified' ? (
                            <div className="not-qualified">Not Qualified</div>
                          ) : student.placementCategory !== 'Unknown' && student.placementCategory !== 'Not Qualified' ? (
                            <>
                              <div className="entitled-category">
                                Category <strong>{student.placementCategory}</strong>
                              </div>
                              <div className="no-school-assigned">No preferences selected</div>
                            </>
                          ) : (
                            <span className="no-school">—</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="status-cell">
                      {student.placedSchool ? (
                        <div className="status-badge placed">
                          <IoCheckmarkCircle className="status-icon" />
                          <span>Placed</span>
                        </div>
                      ) : (
                        <div className="status-badge notplaced">
                          <IoCloseCircle className="status-icon" />
                          <span>Pending</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    No students found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Profile modal */}
      {selectedProfile && (
        <div className="profile-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="profile-modal" style={{ background: '#fff', padding: '1.5rem', width: '95%', maxWidth: 1000, borderRadius: 8, maxHeight: '95%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #ddd', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Student Profile</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem', color: '#666' }}>{selectedProfile.fullName} — Index: {selectedProfile.indexNumber}</p>
              </div>
              <div>
                <button className="btn btn-secondary" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(selectedProfile)); alert('Profile copied to clipboard') }}>Copy JSON</button>
                <button className="btn btn-danger" style={{ marginLeft: 8 }} onClick={closeProfile}>Close</button>
              </div>
            </div>

            {/* Key Info at top */}
            <section style={{ marginBottom: '1.5rem', background: '#f9f9f9', padding: '1rem', borderRadius: 6 }}>
              <h4 style={{ marginTop: 0 }}>Placement Status</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div><strong>Aggregate:</strong> <span style={{ fontSize: '1.2rem', color: '#0066cc' }}>{selectedProfile.aggregate ?? '—'}</span></div>
                <div><strong>Category:</strong> <span style={{ fontSize: '1.2rem', color: '#0066cc' }}>{selectedProfile.placementCategory ? (selectedProfile.placementCategory === 'Not Qualified' ? 'Not Qualified' : `Category ${selectedProfile.placementCategory}`) : '—'}</span></div>
                <div><strong>Status:</strong> <span style={{ fontSize: '1.2rem', color: '#0066cc' }}>{selectedProfile.status || 'Not Placed'}</span></div>
              </div>
            </section>

            {/* Test Scores - Prominent */}
            <section style={{ marginBottom: '1.5rem', border: '2px solid #007bff', padding: '1rem', borderRadius: 6, background: '#f0f7ff' }}>
              <h4 style={{ marginTop: 0, color: '#007bff' }}>Test Scores</h4>
              {selectedProfile.testScore ? (
                <div style={{ fontSize: '0.95rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>English Language</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>{selectedProfile.testScore.english ?? '—'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Mathematics</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>{selectedProfile.testScore.mathematics ?? '—'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Science</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>{selectedProfile.testScore.science ?? '—'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Social Studies</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>{selectedProfile.testScore.socialStudies ?? '—'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Computing</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>{selectedProfile.testScore.computing ?? '—'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Religious & Moral Education</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>{selectedProfile.testScore.religious ?? '—'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Career Technology</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>{selectedProfile.testScore.careerTech ?? '—'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Creative Arts & Design</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>{selectedProfile.testScore.creativeArts ?? '—'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Ghanaian Language</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>{selectedProfile.testScore.ghanaianLanguage ?? '—'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>French</td>
                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>{selectedProfile.testScore.french ?? '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    <p><strong>Average:</strong> {selectedProfile.testScore.average ?? '—'}</p>
                    <p><strong>Aggregate (Core + Best 2):</strong> {selectedProfile.testScore.aggregate ?? '—'}</p>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>⚠️ No test scores recorded for this student</p>
              )}
            </section>

            {/* School Preferences - Prominent */}
            <section style={{ marginBottom: '1.5rem', border: '2px solid #28a745', padding: '1rem', borderRadius: 6, background: '#f0fff4' }}>
              <h4 style={{ marginTop: 0, color: '#28a745' }}>School Preferences</h4>
              {selectedProfile.selections && (Object.keys(selectedProfile.selections).length > 0 || (selectedProfile.selections.catA || selectedProfile.selections.catB?.length > 0 || selectedProfile.selections.catC?.length > 0)) ? (
                <div style={{ fontSize: '0.95rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Category A (1 choice):</strong>
                    <p style={{ margin: '0.5rem 0' }}>{selectedProfile.selections.catA ? `✓ ${selectedProfile.selections.catA}` : '—'}</p>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Category B (2 choices):</strong>
                    <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                      {selectedProfile.selections.catB && selectedProfile.selections.catB.length > 0 ? (
                        selectedProfile.selections.catB.map((s, i) => <li key={i}>{s || '—'}</li>)
                      ) : (
                        <li>—</li>
                      )}
                    </ol>
                  </div>
                  <div>
                    <strong>Category C (4 choices):</strong>
                    <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                      {selectedProfile.selections.catC && selectedProfile.selections.catC.length > 0 ? (
                        selectedProfile.selections.catC.map((s, i) => <li key={i}>{s || '—'}</li>)
                      ) : (
                        <li>—</li>
                      )}
                    </ol>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>⚠️ No school preferences recorded</p>
              )}
            </section>

            {/* Placed School */}
            {selectedProfile.placedSchool && (
              <section style={{ marginBottom: '1.5rem', background: '#e8f5e9', padding: '1rem', borderRadius: 6 }}>
                <h4 style={{ marginTop: 0 }}>Placed School</h4>
                <p><strong>{selectedProfile.placedSchool.name || selectedProfile.placedSchool}</strong></p>
                {typeof selectedProfile.placedSchool === 'object' && selectedProfile.placedSchool.category && (
                  <p>Category: {selectedProfile.placedSchool.category}</p>
                )}
              </section>
            )}

            {/* Registered Details */}
            <section style={{ marginBottom: '1.5rem' }}>
              <h4>Registered Details (JSON)</h4>
              <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: '0.75rem', borderRadius: 4, fontSize: '0.85rem', overflow: 'auto', maxHeight: 200 }}>{JSON.stringify(selectedProfile.registeredDetails, null, 2)}</pre>
            </section>

            {/* Raw Test Score Data */}
            <section style={{ marginBottom: '1.5rem' }}>
              <h4>Test Score (JSON)</h4>
              <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: '0.75rem', borderRadius: 4, fontSize: '0.85rem', overflow: 'auto', maxHeight: 200 }}>{JSON.stringify(selectedProfile.testScore, null, 2)}</pre>
            </section>

            <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '1rem' }}>Generated: {selectedProfile.generatedAt}</p>
          </div>
        </div>
      )}

      {filteredStudents.length > 0 && (
        <div className="placement-summary">
          <p>
            Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students
            {filterStatus !== 'all' && ` (Filter: ${filterStatus})`}
          </p>
        </div>
      )}
    </div>
  )
}
