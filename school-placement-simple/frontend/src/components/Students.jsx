import { useState, useEffect } from 'react'
import '../styles/Students.css'
import { IoPersonAdd, IoEye, IoSearch, IoClose, IoTrash } from 'react-icons/io5'
import syncService from '../services/syncService'

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadStudents()

    // Listen for sync completion to refresh students
    const handleSyncCompleted = (event) => {
      console.log('[STUDENTS] Sync completed, refreshing students...')
      loadStudents()
    }
    
    window.addEventListener('syncCompleted', handleSyncCompleted)
    
    return () => {
      window.removeEventListener('syncCompleted', handleSyncCompleted)
    }
  }, [])

  const loadStudents = async () => {
    setLoading(true)
    const allTestScores = JSON.parse(localStorage.getItem('testScores') || '[]')

    // Try authoritative backend first, fall back to localStorage if unavailable
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'https://backend-seven-ashen-18.vercel.app/api'
      const resp = await fetch(`${API_BASE}/students`)
      if (!resp.ok) throw new Error('Backend students fetch failed')
      const backendStudents = await resp.json()

      const enhanced = backendStudents.map(student => {
        const testScore = allTestScores.find(ts => ts.indexNumber === student.indexNumber)
        return {
          ...student,
          placementCategory: testScore?.placement || 'Unknown',
          aggregate: testScore?.aggregate || 'N/A',
          placedSchool: student.placedSchool || null
        }
      })

      setStudents(enhanced)
      setLoading(false)
      return
    } catch (err) {
      console.warn('[STUDENTS] Backend fetch failed, falling back to localStorage:', err.message)
      // fallback to localStorage registeredStudents
      const registeredStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
      const enhancedRegisteredStudents = registeredStudents.map(student => {
        const testScore = allTestScores.find(ts => ts.indexNumber === student.indexNumber)
        return {
          ...student,
          placementCategory: testScore?.placement || 'Unknown',
          aggregate: testScore?.aggregate || 'N/A',
          placedSchool: student.placedSchool || null
        }
      })

      setStudents(enhancedRegisteredStudents)
      setLoading(false)
    }
  }

  const handleAddStudent = () => {
    // Navigate to Registration tab
    localStorage.setItem('activeTab', 'Registration')
    window.dispatchEvent(new Event('tabChanged'))
  }

  const handleViewStudent = (student) => {
    setSelectedStudent(student)
    setShowModal(true)
  }

  const isAdmin = Boolean(localStorage.getItem('adminToken'))

  const handleDeleteStudent = async (student) => {
    if (!student) return
    const confirmed = window.confirm(`Delete student ${student.fullName} (${student.indexNumber}) permanently? This cannot be undone.`)
    if (!confirmed) return

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'https://backend-seven-ashen-18.vercel.app/api'
      const adminToken = localStorage.getItem('adminToken') || ''

      const res = await fetch(`${API_BASE}/students/${student.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken ? `Bearer ${adminToken}` : ''
        }
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to delete student')
      }

      // Remove from localStorage registeredStudents as well
      const registered = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
      const next = registered.filter(s => s.id !== student.id)
      localStorage.setItem('registeredStudents', JSON.stringify(next))

      // Close modal and refresh list
      setShowModal(false)
      setSelectedStudent(null)
      loadStudents()
      alert('Student deleted successfully')
    } catch (err) {
      console.error('Delete student error:', err)
      alert('Failed to delete student: ' + (err.message || 'Unknown error'))
    }
  }

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})

  const handleEditClick = (student) => {
    setSelectedStudent(student)
    setEditForm({
      fullName: student.fullName || '',
      email: student.email || '',
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      status: student.status || 'pending'
    })
    setIsEditing(true)
    setShowModal(true)
  }

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveEdit = async () => {
    if (!selectedStudent) return
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'https://backend-seven-ashen-18.vercel.app/api'
      const adminToken = localStorage.getItem('adminToken') || ''

      const res = await fetch(`${API_BASE}/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminToken ? `Bearer ${adminToken}` : ''
        },
        body: JSON.stringify(editForm)
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to update student')
      }

      const updated = await res.json()
      setSelectedStudent(updated)
      setIsEditing(false)
      loadStudents()
      alert('Student updated successfully')
    } catch (err) {
      console.error('Update student error:', err)
      alert('Failed to update student: ' + (err.message || 'Unknown error'))
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditForm({})
  }


  const filteredStudents = students.filter(student =>
    student.indexNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="students-container">
      <h2>Student Management</h2>
      
      <div className="students-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <IoSearch className="app-icon" />
          <input 
            type="text" 
            placeholder="Search students..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleAddStudent}><IoPersonAdd className="app-icon" />Add New Student</button>
      </div>

      {loading ? (
        <p>Loading students...</p>
      ) : students.length === 0 ? (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          backgroundColor: '#f9f9f9', 
          borderRadius: '6px',
          border: '1px solid #ddd'
        }}>
          <p style={{ color: '#666', fontSize: '1rem', marginBottom: '1rem' }}>No registered students yet.</p>
          <button className="btn btn-primary" onClick={handleAddStudent}><IoPersonAdd className="app-icon" />Register First Student</button>
        </div>
      ) : (
        <div className="students-table">
          <table>
            <thead>
              <tr>
                <th>Index Number</th>
                <th>Full Name</th>
                <th>Status</th>
                <th>Placed School</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: '#999' }}>
                    No students match your search.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  let statusClass = 'status-placed'
                  let statusText = 'Placed'
                  
                  if (student.placedSchool) {
                    statusText = 'Placed'
                    statusClass = 'status-placed'
                  } else if (student.placementCategory === 'Unknown') {
                    statusText = 'No Test Scores'
                    statusClass = 'status-notested'
                  } else if (student.placementCategory === 'Not Qualified') {
                    statusText = 'Not Qualified'
                    statusClass = 'status-notqualified'
                  } else {
                    statusText = `Category ${student.placementCategory}`
                    statusClass = `status-category-${student.placementCategory.toLowerCase()}`
                  }
                  
                  return (
                    <tr key={student.id} className={statusClass}>
                      <td>{student.indexNumber}</td>
                      <td>{student.fullName}</td>
                      <td>
                        <span className={`badge badge-${statusClass}`}>
                          {statusText}
                        </span>
                      </td>
                      <td>
                        {student.placedSchool ? (
                          typeof student.placedSchool === 'object' ? student.placedSchool.name : student.placedSchool
                        ) : (
                          'Not placed'
                        )}
                      </td>
                      <td>
                        <div style={{display: 'flex', gap: 8}}>
                          <button className="btn btn-sm btn-info" onClick={() => handleViewStudent(student)}><IoEye className="app-icon" />View</button>
                          {isAdmin && (
                            <button className="btn btn-sm btn-danger" onClick={() => handleDeleteStudent(student)} style={{display: 'flex', alignItems: 'center'}}>
                              <IoTrash className="app-icon" /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Detail Modal */}
      {showModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Student Details</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><IoClose className="app-icon" /></button>
            </div>
            <div className="modal-body">
              {isEditing ? (
                <div>
                  <div className="detail-group">
                    <label>Full Name:</label>
                    <input type="text" value={editForm.fullName || ''} onChange={(e) => handleEditChange('fullName', e.target.value)} />
                  </div>
                  <div className="detail-group">
                    <label>Email:</label>
                    <input type="email" value={editForm.email || ''} onChange={(e) => handleEditChange('email', e.target.value)} />
                  </div>
                  <div className="detail-group">
                    <label>Guardian Name:</label>
                    <input type="text" value={editForm.guardianName || ''} onChange={(e) => handleEditChange('guardianName', e.target.value)} />
                  </div>
                  <div className="detail-group">
                    <label>Guardian Phone:</label>
                    <input type="text" value={editForm.guardianPhone || ''} onChange={(e) => handleEditChange('guardianPhone', e.target.value)} />
                  </div>
                  <div className="detail-group">
                    <label>Status:</label>
                    <select value={editForm.status || 'pending'} onChange={(e) => handleEditChange('status', e.target.value)}>
                      <option value="pending">pending</option>
                      <option value="placed">placed</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  {/* Student Photo */}
                  {selectedStudent.photo && (
                    <div className="detail-group" style={{textAlign: 'center', marginBottom: '1rem'}}>
                      <div style={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        margin: '0 auto',
                        backgroundColor: '#e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '2px solid #667eea'
                      }}>
                        <img src={selectedStudent.photo} alt="Student" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      </div>
                    </div>
                  )}
                  <div className="detail-group">
                    <label>Index Number:</label>
                    <p>{selectedStudent.indexNumber}</p>
                  </div>
                  <div className="detail-group">
                    <label>Full Name:</label>
                    <p>{selectedStudent.fullName}</p>
                  </div>
                  {selectedStudent.email && (
                    <div className="detail-group">
                      <label>Email:</label>
                      <p>{selectedStudent.email}</p>
                    </div>
                  )}
                  <div className="detail-group">
                    <label>Status:</label>
                    <p><span className={`badge badge-${selectedStudent.status}`}>{selectedStudent.status.toUpperCase()}</span></p>
                  </div>
                  <div className="detail-group">
                    <label>Placed School:</label>
                    <p>
                      {selectedStudent.placedSchool ? (
                        <>
                          {typeof selectedStudent.placedSchool === 'object' ? (
                            <>
                              <strong>{selectedStudent.placedSchool.name}</strong>
                              <br />
                              <small>Category {selectedStudent.placedSchool.category}</small>
                              {selectedStudent.placedSchool.autoAssigned && (
                                <>
                                  <br />
                                  <small style={{ color: '#0c45a6', fontWeight: 'bold' }}>Auto-Assigned</small>
                                </>
                              )}
                              {!selectedStudent.placedSchool.autoAssigned && (
                                <>
                                  <br />
                                  <small style={{ color: '#166534', fontWeight: 'bold' }}>Selected</small>
                                </>
                              )}
                            </>
                          ) : (
                            selectedStudent.placedSchool
                          )}
                        </>
                      ) : (
                        <>
                          {selectedStudent.placementCategory && selectedStudent.placementCategory !== 'Unknown' && selectedStudent.placementCategory !== 'Not Qualified' ? (
                            <>
                              <strong style={{ color: '#92400e' }}>Category {selectedStudent.placementCategory}</strong>
                              <br />
                              <small>No school preferences selected</small>
                            </>
                          ) : selectedStudent.placementCategory === 'Not Qualified' ? (
                            <strong style={{ color: '#991b1b' }}>Not Qualified</strong>
                          ) : (
                            'Not yet placed'
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  {selectedStudent.gender && (
                    <div className="detail-group">
                      <label>Gender:</label>
                      <p>{selectedStudent.gender}</p>
                    </div>
                  )}
                  {selectedStudent.dateOfBirth && (
                    <div className="detail-group">
                      <label>Date of Birth:</label>
                      <p>{selectedStudent.dateOfBirth}</p>
                    </div>
                  )}
                  {selectedStudent.guardianName && (
                    <div className="detail-group">
                      <label>Guardian Name:</label>
                      <p>{selectedStudent.guardianName}</p>
                    </div>
                  )}
                  {selectedStudent.guardianPhone && (
                    <div className="detail-group">
                      <label>Guardian Phone:</label>
                      <p>{selectedStudent.guardianPhone}</p>
                    </div>
                  )}
                  {(selectedStudent.maths || selectedStudent.english || selectedStudent.science) && (
                    <>
                      <div style={{borderTop: '1px solid #eee', marginTop: '1rem', paddingTop: '1rem'}}>
                        <h4 style={{margin: '0 0 0.75rem 0', color: '#333'}}>Test Scores</h4>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem'}}>
                          {selectedStudent.maths !== null && selectedStudent.maths !== undefined && (
                            <div className="detail-group">
                              <label>Mathematics:</label>
                              <p style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#2196F3'}}>{selectedStudent.maths}</p>
                            </div>
                          )}
                          {selectedStudent.english !== null && selectedStudent.english !== undefined && (
                            <div className="detail-group">
                              <label>English:</label>
                              <p style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#4CAF50'}}>{selectedStudent.english}</p>
                            </div>
                          )}
                          {selectedStudent.science !== null && selectedStudent.science !== undefined && (
                            <div className="detail-group">
                              <label>Science:</label>
                              <p style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#FF9800'}}>{selectedStudent.science}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  {selectedStudent.placementCategory && selectedStudent.placementCategory !== 'Unknown' && (
                    <div className="detail-group">
                      <label>Placement Category:</label>
                      <p>
                        <strong style={{ 
                          color: selectedStudent.placementCategory === 'A' ? '#166534' : 
                                 selectedStudent.placementCategory === 'B' ? '#92400e' :
                                 selectedStudent.placementCategory === 'C' ? '#991b1b' :
                                 selectedStudent.placementCategory === 'Not Qualified' ? '#7c2d12' : '#6b7280'
                        }}>
                          {selectedStudent.placementCategory === 'Not Qualified' ? 'Not Qualified' : `Category ${selectedStudent.placementCategory}`}
                        </strong>
                      </p>
                    </div>
                  )}
                  {selectedStudent.aggregate && selectedStudent.aggregate !== 'N/A' && (
                    <div className="detail-group">
                      <label>Aggregate Score (Best 6):</label>
                      <p><strong>{selectedStudent.aggregate}</strong></p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer" style={{display: 'flex', gap: 8}}>
              {isEditing ? (
                <>
                  <button className="btn btn-primary" onClick={handleSaveEdit}>Save</button>
                  <button className="btn btn-secondary" onClick={handleCancelEdit}>Cancel</button>
                </>
              ) : (
                <>
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                  {isAdmin && (
                    <button className="btn btn-sm btn-info" onClick={() => handleEditClick(selectedStudent)}>Edit</button>
                  )}
                  {isAdmin && (
                    <button className="btn btn-danger" onClick={() => handleDeleteStudent(selectedStudent)}>
                      <IoTrash className="app-icon" /> Delete
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
