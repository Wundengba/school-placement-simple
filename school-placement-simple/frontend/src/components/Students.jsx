import { useState, useEffect } from 'react'
import '../styles/Students.css'
import { IoPersonAdd, IoEye, IoTrash, IoSearch, IoClose } from 'react-icons/io5'

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

  const loadStudents = () => {
    // Load only registered students from localStorage
    const registeredStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
    const allTestScores = JSON.parse(localStorage.getItem('testScores') || '[]')
    
    // Enhance registered students with test score data and placement info
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

  const handleAddStudent = () => {
    // Navigate to Registration tab
    localStorage.setItem('activeTab', 'Registration')
    window.dispatchEvent(new Event('tabChanged'))
  }

  const handleViewStudent = (student) => {
    setSelectedStudent(student)
    setShowModal(true)
  }

  const handleDeleteStudent = (studentId) => {
    if (confirm('Are you sure you want to delete this student?')) {
      const updatedStudents = students.filter(s => s.id !== studentId)
      setStudents(updatedStudents)
      
      // Update localStorage for registered students
      const registeredStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
      const filteredRegistered = registeredStudents.filter(s => s.id !== studentId)
      localStorage.setItem('registeredStudents', JSON.stringify(filteredRegistered))
      
      alert('Student deleted successfully')
    }
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
                        <button className="btn btn-sm btn-info" onClick={() => handleViewStudent(student)}><IoEye className="app-icon" />View</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteStudent(student.id)}><IoTrash className="app-icon" />Delete</button>
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
              <div className="detail-group">
                <label>Index Number:</label>
                <p>{selectedStudent.indexNumber}</p>
              </div>
              <div className="detail-group">
                <label>Full Name:</label>
                <p>{selectedStudent.fullName}</p>
              </div>
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
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
