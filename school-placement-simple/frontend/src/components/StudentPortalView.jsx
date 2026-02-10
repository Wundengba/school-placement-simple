import { useState, useEffect } from 'react'
import { IoLogOut } from 'react-icons/io5'
import '../styles/StudentPortal.css'

export default function StudentPortalView({ studentInfo }) {
  const student = studentInfo ? JSON.parse(studentInfo) : null
  const [placementData, setPlacementData] = useState(null)
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    // Fetch student's placement data
    const fetchPlacementData = async () => {
      try {
        const resp = await fetch('/api/sync/download')
        const data = await resp.json()
        if (data.success && data.data.students) {
          const studentRecord = data.data.students.find(s => s.indexNumber === student.indexNumber)
          setPlacementData(studentRecord)
        }
      } catch (err) {
        console.error('Error fetching placement data:', err)
      } finally {
        setLoading(false)
      }
    }
    if (student) fetchPlacementData()
  }, [student])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('studentInfo')
    window.location.reload()
  }

  if (!student) {
    return <div className="student-portal error">Error loading student information</div>
  }

  return (
    <div className="student-portal">
      <header className="student-header">
        <div className="student-header-left">
          <h1>Student Placement Portal</h1>
          <p>Check your school placement status</p>
        </div>
        <div className="student-header-right">
          <span className="student-name">{student.fullName}</span>
          <button className="btn btn-logout" onClick={handleLogout}>
            <IoLogOut /> Logout
          </button>
        </div>
      </header>

      <main className="student-main">
        <div className="student-card">
          <h2>Your Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Index Number:</span>
              <span className="value">{student.indexNumber}</span>
            </div>
            <div className="info-item">
              <span className="label">Full Name:</span>
              <span className="value">{student.fullName}</span>
            </div>
            <div className="info-item">
              <span className="label">Email:</span>
              <span className="value">{student.email || 'Not provided'}</span>
            </div>
          </div>
        </div>

        <div className="student-card">
          <h2>Placement Status</h2>
          {loading ? (
            <p>Loading...</p>
          ) : placementData ? (
            <div className="status-info">
              <div className={`status-badge status-${placementData.status || 'pending'}`}>
                {placementData.status ? placementData.status.toUpperCase() : 'PENDING'}
              </div>
              {placementData.placedSchool && (
                <div className="placed-school">
                  <h3>Placed School:</h3>
                  <p>{typeof placementData.placedSchool === 'object' ? placementData.placedSchool.name : placementData.placedSchool}</p>
                </div>
              )}
              {!placementData.placedSchool && (
                <p className="not-placed">Not yet placed</p>
              )}
            </div>
          ) : (
            <p>No placement data available</p>
          )}
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
