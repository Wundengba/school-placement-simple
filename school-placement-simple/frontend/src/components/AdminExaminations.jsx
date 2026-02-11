import { useState, useEffect } from 'react'
import { IoAdd, IoClose, IoCheckmark, IoTrash, IoEye, IoCreate } from 'react-icons/io5'

export default function AdminExaminations() {
  const [examTypes, setExamTypes] = useState([])
  const [examTypesLoading, setExamTypesLoading] = useState(false)
  const [newExamName, setNewExamName] = useState('')
  const [newExamDesc, setNewExamDesc] = useState('')
  const [editingExam, setEditingExam] = useState(null)
  const [editingExamName, setEditingExamName] = useState('')
  const [editingExamDesc, setEditingExamDesc] = useState('')

  const subjectOptions = [
    'English Language',
    'Mathematics',
    'Science',
    'Social Studies',
    'Computing',
    'Religious and Moral Educations',
    'Career Technology',
    'Creative Arts and Design',
    'Ghanian Language',
    'French'
  ]

  const [activeTab, setActiveTab] = useState('view') // 'view' or 'create'
  const [mocks, setMocks] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedExamType, setSelectedExamType] = useState(null)
  const [expandedMock, setExpandedMock] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    examType: '',
    subjects: ['English Language', 'Mathematics', 'Science'],
    totalQuestions: 100,
    duration: 180
  })

  const [newMockData, setNewMockData] = useState({
    title: '',
    description: '',
    subjects: ['English Language', 'Mathematics', 'Science']
  })

  const [editingMock, setEditingMock] = useState(null)
  const [editFormData, setEditFormData] = useState({ title: '', description: '', subjects: [] })
  const [assigningMock, setAssigningMock] = useState(null)
  const [studentsList, setStudentsList] = useState([])
  const [assignForm, setAssignForm] = useState({ studentId: '', scores: {} })

  useEffect(() => {
    fetchMocks()
    fetchExamTypes()
  }, [])

  const fetchExamTypes = async () => {
    try {
      setExamTypesLoading(true)
      const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://backend-seven-ashen-18.vercel.app/api' : '/api')
      const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
      const res = await fetch(`${API_BASE}/admin/exam-types`, { headers: { 'Authorization': `Bearer ${adminToken}` } })
      if (res.ok) {
        const data = await res.json()
        setExamTypes(data.examTypes || [])
        // default selected
        if ((data.examTypes || []).length > 0 && !selectedExamType) setSelectedExamType((data.examTypes || [])[0])
      }
    } catch (err) {
      console.error('Error fetching exam types:', err)
    } finally {
      setExamTypesLoading(false)
    }
  }

  const handleCreateExamType = async (e) => {
    e.preventDefault()
    if (!newExamName.trim()) return alert('Enter exam type name')
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://backend-seven-ashen-18.vercel.app/api' : '/api')
      const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
      const res = await fetch(`${API_BASE}/admin/exam-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ name: newExamName.trim(), description: newExamDesc.trim() })
      })
      if (res.ok) {
        setNewExamName('')
        setNewExamDesc('')
        fetchExamTypes()
        alert('✅ Examination type created')
      } else {
        const err = await res.json()
        alert('❌ ' + (err.error || 'Failed to create'))
      }
    } catch (err) {
      alert('❌ Error: ' + err.message)
    }
  }

  const openEditExam = (et) => {
    setEditingExam(et)
    setEditingExamName(et.name)
    setEditingExamDesc(et.description || '')
  }

  const handleUpdateExam = async (e) => {
    e.preventDefault()
    if (!editingExam || !editingExam.id) return
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://backend-seven-ashen-18.vercel.app/api' : '/api')
      const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
      const res = await fetch(`${API_BASE}/admin/exam-types/${editingExam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ name: editingExamName.trim(), description: editingExamDesc.trim() })
      })
      if (res.ok) {
        setEditingExam(null)
        setEditingExamName('')
        setEditingExamDesc('')
        fetchExamTypes()
        alert('✅ Updated')
      } else {
        const err = await res.json()
        alert('❌ ' + (err.error || 'Failed to update'))
      }
    } catch (err) {
      alert('❌ Error: ' + err.message)
    }
  }

  const handleDeleteExam = async (id) => {
    if (!confirm('Delete this exam type?')) return
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://backend-seven-ashen-18.vercel.app/api' : '/api')
      const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
      const res = await fetch(`${API_BASE}/admin/exam-types/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } })
      if (res.ok) {
        fetchExamTypes()
        alert('✅ Deleted')
      } else {
        alert('❌ Failed to delete')
      }
    } catch (err) {
      alert('❌ Error: ' + err.message)
    }
  }

  const fetchMocks = async () => {
    try {
      setLoading(true)
      const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://backend-seven-ashen-18.vercel.app/api' : '/api')
      const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
      
      const res = await fetch(`${API_BASE}/admin/mocks/list`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setMocks(data.mocks || [])
      }
    } catch (err) {
      console.error('Error fetching mocks:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMock = async (e) => {
    e.preventDefault()
    
    if (!newMockData.title.trim()) {
      alert('Please enter a mock exam title')
      return
    }

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://backend-seven-ashen-18.vercel.app/api' : '/api')
      const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
      
      const res = await fetch(`${API_BASE}/admin/mocks/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title: newMockData.title,
          description: newMockData.description
        })
      })

      if (res.ok) {
        const data = await res.json()
        alert('✅ Mock exam created successfully!')
        setNewMockData({ title: '', description: '', subjects: [] })
        setShowCreateForm(false)
        fetchMocks()
      } else {
        const error = await res.json()
        alert('❌ Error: ' + (error.error || 'Failed to create mock'))
      }
    } catch (err) {
      alert('❌ Error creating mock: ' + err.message)
    }
  }

  const handleDeleteMock = async (mockId) => {
    if (!confirm('Are you sure you want to delete this mock exam?')) return

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://backend-seven-ashen-18.vercel.app/api' : '/api')
      const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
      
      const res = await fetch(`${API_BASE}/admin/mocks/${mockId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })

      if (res.ok) {
        alert('✅ Mock exam deleted successfully!')
        fetchMocks()
      } else {
        alert('❌ Failed to delete mock exam')
      }
    } catch (err) {
      alert('❌ Error: ' + err.message)
    }
  }

  const openEditModal = (mock) => {
    setEditingMock(mock)
    setEditFormData({
      title: mock.title || '',
      description: mock.description || '',
      subjects: Array.isArray(mock.subjects) ? mock.subjects.map(s => s.subject ? s.subject : s) : []
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeEditModal = () => {
    setEditingMock(null)
    setEditFormData({ title: '', description: '', subjects: [] })
  }

  const handleUpdateMock = async (e) => {
    e.preventDefault()
    if (!editingMock) return

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://backend-seven-ashen-18.vercel.app/api' : '/api')
      const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')

      const res = await fetch(`${API_BASE}/admin/mocks/${editingMock.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description,
          subjects: editFormData.subjects
        })
      })

      if (res.ok) {
        alert('✅ Mock updated')
        closeEditModal()
        fetchMocks()
      } else {
        const err = await res.json()
        alert('❌ Update failed: ' + (err.error || 'Unknown error'))
      }
    } catch (err) {
      alert('❌ Error updating mock: ' + err.message)
    }
  }

  const fetchStudents = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://backend-seven-ashen-18.vercel.app/api' : '/api')
      const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
      const res = await fetch(`${API_BASE}/students`, { headers: { 'Authorization': `Bearer ${adminToken}` } })
      if (res.ok) {
        const data = await res.json()
        setStudentsList(data.students || data || [])
      }
    } catch (err) {
      console.error('Error fetching students:', err)
    }
  }

  const openAssignModal = async (mock) => {
    setAssigningMock(mock)
    // initialize scores object for subjects
    const subjects = Array.isArray(mock.subjects) && mock.subjects.length > 0
      ? mock.subjects.map(s => (s.subject ? s.subject : s))
      : ['Mathematics', 'English', 'Science']

    const scoresInit = {}
    subjects.forEach(sub => { scoresInit[sub] = '' })

    setAssignForm({ studentId: '', scores: scoresInit })
    await fetchStudents()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeAssignModal = () => {
    setAssigningMock(null)
    setAssignForm({ studentId: '', scores: {} })
  }

  const handleAssignChange = (subject, value) => {
    setAssignForm(prev => ({ ...prev, scores: { ...prev.scores, [subject]: value } }))
  }

  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    if (!assigningMock) return
    if (!assignForm.studentId) { alert('Select a student'); return }

    // prepare scores array
    const scoresArray = Object.entries(assignForm.scores).map(([subject, score]) => ({ subject, score: Number(score) }))

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? 'https://backend-seven-ashen-18.vercel.app/api' : '/api')
      const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')

      const res = await fetch(`${API_BASE}/admin/mocks/${assigningMock.id}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ studentId: assignForm.studentId, scores: scoresArray })
      })

      if (res.ok) {
        alert('✅ Scores assigned')
        closeAssignModal()
        fetchMocks()
      } else {
        const err = await res.json()
        alert('❌ Assign failed: ' + (err.error || 'Unknown error'))
      }
    } catch (err) {
      alert('❌ Error assigning scores: ' + err.message)
    }
  }

  const toggleSubject = (subject) => {
    setNewMockData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }))
  }

  return (
    <div className="student-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>📝 Examinations Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <IoAdd /> {showCreateForm ? 'Cancel' : 'Create Mock Exam'}
        </button>
      </div>

      {showCreateForm && (
        <div style={{
          backgroundColor: '#f9f9f9',
          border: '2px solid #2196F3',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24
        }}>
          <h3 style={{ marginTop: 0, color: '#2196F3' }}>Create New Mock Exam</h3>
          
          <form onSubmit={handleCreateMock}>
            {/* Mock Title */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: 6 }}>
                Mock Exam Title *
              </label>
              <input
                type="text"
                value={newMockData.title}
                onChange={(e) => setNewMockData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Mock Exam 1, Practice Test January"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: 6 }}>
                Description (Optional)
              </label>
              <textarea
                value={newMockData.description}
                onChange={(e) => setNewMockData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter exam description"
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Exam Type Selection */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: 8 }}>
                Examination Type
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 8
              }}>
                {examTypes.map(type => (
                  <div
                    key={type.id}
                    onClick={() => setSelectedExamType(type)}
                    style={{
                      padding: 12,
                      border: selectedExamType.id === type.id ? '2px solid #2196F3' : '1px solid #ddd',
                      borderRadius: 8,
                      cursor: 'pointer',
                      backgroundColor: selectedExamType.id === type.id ? '#e3f2fd' : '#fff',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: 13, color: '#333', marginBottom: 4 }}>
                      {type.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>
                      {type.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Selection */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: 8 }}>
                Select Subjects for This Mock
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 8
              }}>
                {subjectOptions.map(subject => (
                  <label key={subject} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 10,
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    cursor: 'pointer',
                    backgroundColor: newMockData.subjects.includes(subject) ? '#e3f2fd' : '#fff'
                  }}>
                    <input
                      type="checkbox"
                      checked={newMockData.subjects.includes(subject)}
                      onChange={() => toggleSubject(subject)}
                      style={{ marginRight: 8, width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 13 }}>{subject}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <IoCheckmark /> Create Mock Exam
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewMockData({ title: '', description: '', subjects: [] })
                }}
              >
                <IoClose /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing Mocks List */}
      <h3 style={{ marginTop: 24, marginBottom: 16, color: '#333' }}>
        📚 Mock Exams ({mocks.length})
      </h3>

      {loading ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '20px 0' }}>Loading mock exams...</p>
      ) : mocks.length === 0 ? (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: 24,
          borderRadius: 8,
          textAlign: 'center',
          color: '#999'
        }}>
          <p>No mock exams created yet.</p>
          <p style={{ fontSize: 12, margin: '8px 0 0 0' }}>Click "Create Mock Exam" to get started.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16
        }}>
          {mocks.map(mock => (
            <div key={mock.id} style={{
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 16,
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: 12
              }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#333', fontSize: 16 }}>
                    {mock.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, color: '#999' }}>
                    Created by: {mock.createdBy || 'Admin'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => openEditModal(mock)}
                    title="Edit mock"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1976d2',
                      cursor: 'pointer',
                      padding: 4,
                      fontSize: 16
                    }}
                  >
                    <IoCreate />
                  </button>
                  <button
                    onClick={() => openAssignModal(mock)}
                    title="Assign scores"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2e7d32',
                      cursor: 'pointer',
                      padding: 4,
                      fontSize: 16
                    }}
                  >
                    <IoAdd />
                  </button>
                  <button
                    onClick={() => handleDeleteMock(mock.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f44336',
                      cursor: 'pointer',
                      padding: 4,
                      fontSize: 16
                    }}
                    title="Delete mock"
                  >
                    <IoTrash />
                  </button>
                </div>
              </div>

              {mock.description && (
                <p style={{ margin: '0 0 12px 0', fontSize: 13, color: '#666' }}>
                  {mock.description}
                </p>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 12,
                borderTop: '1px solid #eee'
              }}>
                <div style={{ fontSize: 12, color: '#999' }}>
                  📅 {new Date(mock.createdAt).toLocaleDateString()}
                </div>
                <button
                  onClick={() => setExpandedMock(expandedMock === mock.id ? null : mock.id)}
                  style={{
                    background: '#2196F3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '6px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <IoEye /> {expandedMock === mock.id ? 'Hide' : 'View'} Scores
                </button>
              </div>

              {expandedMock === mock.id && mock.subjects && (
                <div style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid #eee'
                }}>
                  <div style={{ fontSize: 12, fontWeight: '600', color: '#333', marginBottom: 8 }}>
                    📊 Student Scores ({mock.subjects.length})
                  </div>
                  {mock.subjects.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
                      No scores assigned yet
                    </p>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6
                    }}>
                      {mock.subjects.slice(0, 3).map((score, idx) => (
                        <span key={idx} style={{
                          backgroundColor: '#f5f5f5',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 11
                        }}>
                          {score.subject}: {score.score}
                        </span>
                      ))}
                      {mock.subjects.length > 3 && (
                        <span style={{
                          backgroundColor: '#f5f5f5',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: '600'
                        }}>
                          +{mock.subjects.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Edit Modal */}
                  {editingMock && (
                    <div style={{
                      position: 'fixed',
                      left: 0,
                      top: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 9999,
                      padding: 20
                    }}>
                      <div style={{
                        width: '100%',
                        maxWidth: 720,
                        backgroundColor: '#fff',
                        borderRadius: 10,
                        padding: 20,
                        boxShadow: '0 6px 20px rgba(0,0,0,0.16)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <h3 style={{ margin: 0 }}>Edit Mock Exam</h3>
                          <button className="btn" onClick={closeEditModal}><IoClose /> Close</button>
                        </div>

                        <form onSubmit={handleUpdateMock}>
                          <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Title</label>
                            <input value={editFormData.title} onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }} />
                          </div>

                          <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Description</label>
                            <textarea value={editFormData.description} onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))} rows={3} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }} />
                          </div>

                          <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Subjects</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                              {subjectOptions.map(sub => (
                                <label key={sub} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, border: '1px solid #ddd', borderRadius: 6, background: editFormData.subjects.includes(sub) ? '#e3f2fd' : '#fff', cursor: 'pointer' }}>
                                  <input type="checkbox" checked={editFormData.subjects.includes(sub)} onChange={() => setEditFormData(prev => ({ ...prev, subjects: prev.subjects.includes(sub) ? prev.subjects.filter(s => s !== sub) : [...prev.subjects, sub] }))} />
                                  <span style={{ fontSize: 13 }}>{sub}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                            <button type="button" className="btn" onClick={closeEditModal}><IoClose /> Cancel</button>
                            <button type="submit" className="btn btn-primary"><IoCheckmark /> Save changes</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Assign Scores Modal */}
                  {assigningMock && (
                    <div style={{
                      position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
                    }}>
                      <div style={{ width: '100%', maxWidth: 720, backgroundColor: '#fff', borderRadius: 10, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <h3 style={{ margin: 0 }}>Assign Scores — {assigningMock.title}</h3>
                          <button className="btn" onClick={closeAssignModal}><IoClose /> Close</button>
                        </div>

                        <form onSubmit={handleAssignSubmit}>
                          <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Student</label>
                            <select value={assignForm.studentId} onChange={(e) => setAssignForm(prev => ({ ...prev, studentId: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }}>
                              <option value="">-- Select student --</option>
                              {studentsList.map(s => (
                                <option key={s.id || s.studentId} value={s.id || s.studentId}>{s.fullName || s.name || s.username || s.id}</option>
                              ))}
                            </select>
                          </div>

                          <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Scores</label>
                            <div style={{ display: 'grid', gap: 8 }}>
                              {Object.keys(assignForm.scores).map(subject => (
                                <div key={subject} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <div style={{ width: 180, fontSize: 13 }}>{subject}</div>
                                  <input type="number" min="0" max="999" value={assignForm.scores[subject]} onChange={(e) => handleAssignChange(subject, e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', width: 120 }} />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button type="button" className="btn" onClick={closeAssignModal}><IoClose /> Cancel</button>
                            <button type="submit" className="btn btn-primary"><IoCheckmark /> Assign Scores</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Exam Types Reference */}
      <div style={{
        marginTop: 32,
        padding: 20,
        backgroundColor: '#f5f5f5',
        borderRadius: 8
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>📋 Available Examination Types</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 12
        }}>
          {examTypes.map(type => (
            <div key={type.id} style={{
              backgroundColor: '#fff',
              padding: 12,
              borderRadius: 6,
              border: '1px solid #ddd'
            }}>
              <div style={{ fontWeight: '600', fontSize: 13, color: '#333', marginBottom: 4 }}>
                {type.name}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {type.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
