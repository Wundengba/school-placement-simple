import { useState, useEffect } from 'react'
import '../styles/Dashboard.css'

export default function Dashboard({ user }) {
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const API_BASE = import.meta.env.VITE_API_BASE || '/api'
  // Fallback backend URL for production when frontend /api is not proxied to backend
  const BACKEND_FALLBACK = import.meta.env.VITE_BACKEND_FALLBACK || 'https://backend-seven-ashen-18.vercel.app'

  useEffect(() => {
    fetchDashboardData()
  }, [user?.role])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      let endpoint = ''
      const params = new URLSearchParams()

      switch (user?.role) {
        case 'admin':
          endpoint = '/dashboard/admin'
          params.append('role', 'admin')
          break
        case 'school':
          endpoint = '/dashboard/school'
          params.append('schoolId', user?.schoolId || '')
          break
        case 'student':
          endpoint = '/dashboard/student'
          params.append('studentId', user?.studentId || '')
          break
        default:
          return
      }

      // Try relative API base first (works when proxied). If it returns 404,
      // retry against explicit backend fallback (useful on Vercel where frontend and backend are separate).
      let response = await fetch(`${API_BASE}${endpoint}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (response.status === 404) {
        // Retry with explicit backend host
        const fallbackUrl = `${BACKEND_FALLBACK.replace(/\/$/, '')}/api${endpoint}?${params}`
        console.warn('Primary API returned 404 — retrying with fallback backend:', fallbackUrl)
        response = await fetch(fallbackUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch dashboard data (status ${response.status})`)
      }

      setDashboardData(data)
    } catch (err) {
      setError(err.message)
      console.error('Dashboard error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="dashboard-loading">Loading dashboard...</div>
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>Error: {error}</p>
        <button onClick={fetchDashboardData} className="btn btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Role: {user?.role?.toUpperCase()}</p>
      </div>

      {user?.role === 'admin' && <AdminDashboard data={dashboardData} />}
      {user?.role === 'school' && <SchoolDashboard data={dashboardData} />}
      {user?.role === 'student' && <StudentDashboard data={dashboardData} />}
    </div>
  )
}

function AdminDashboard({ data }) {
  return (
    <div className="dashboard-content">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Students</h3>
          <p className="stat-number">{data?.stats?.totalStudents || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Schools</h3>
          <p className="stat-number">{data?.stats?.totalSchools || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Placements</h3>
          <p className="stat-number">{data?.stats?.totalPlacements || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Placement Rate</h3>
          <p className="stat-number">{data?.stats?.placementRate || '0%'}</p>
        </div>
        <div className="stat-card">
          <h3>Placed Students</h3>
          <p className="stat-number">{data?.stats?.placedStudents || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number">{data?.stats?.pendingPlacements || 0}</p>
        </div>
      </div>

      {data?.recentActivity && data.recentActivity.length > 0 && (
        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <table className="activity-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.recentActivity.map((log, idx) => (
                <tr key={idx}>
                  <td>{log.username}</td>
                  <td>{log.action}</td>
                  <td>{log.entityName || log.entityType}</td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SchoolDashboard({ data }) {
  return (
    <div className="dashboard-content">
      {data?.school && (
        <div className="dashboard-header-info">
          <h2>{data.school.name}</h2>
          <p>Location: {data.school.location}</p>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Applications</h3>
          <p className="stat-number">{data?.stats?.total || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Accepted</h3>
          <p className="stat-number">{data?.stats?.accepted || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number">{data?.stats?.pending || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Rejected</h3>
          <p className="stat-number">{data?.stats?.rejected || 0}</p>
        </div>
      </div>

      {data?.placements && data.placements.length > 0 && (
        <div className="dashboard-section">
          <h2>Student Applications</h2>
          <table className="placements-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Applied Date</th>
              </tr>
            </thead>
            <tbody>
              {data.placements.map((placement, idx) => (
                <tr key={idx}>
                  <td>{placement.studentId?.name || 'N/A'}</td>
                  <td>{placement.studentId?.email || 'N/A'}</td>
                  <td><span className={`status-${placement.status}`}>{placement.status}</span></td>
                  <td>{new Date(placement.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StudentDashboard({ data }) {
  return (
    <div className="dashboard-content">
      {data?.currentPlacement ? (
        <div className="placement-status-card success">
          <h2>✓ Placed Successfully!</h2>
          <div className="placement-info">
            <h3>{data.currentPlacement.schoolId?.name}</h3>
            <p>Location: {data.currentPlacement.schoolId?.location}</p>
            <p>Sector: {data.currentPlacement.schoolId?.sector}</p>
          </div>
        </div>
      ) : (
        <div className="placement-status-card pending">
          <h2>Placement Status: Pending</h2>
          <p>You have applied to {data?.stats?.total || 0} school(s).</p>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Applications</h3>
          <p className="stat-number">{data?.stats?.total || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Accepted</h3>
          <p className="stat-number">{data?.stats?.accepted || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number">{data?.stats?.pending || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Rejected</h3>
          <p className="stat-number">{data?.stats?.rejected || 0}</p>
        </div>
      </div>

      {data?.history && data.history.length > 0 && (
        <div className="dashboard-section">
          <h2>Placement Timeline</h2>
          <div className="timeline">
            {data.history.map((event, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h4>{event.event}</h4>
                  <p>{event.notes || 'Status updated'}</p>
                  <small>{new Date(event.createdAt).toLocaleString()}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.allPlacements && data.allPlacements.length > 0 && (
        <div className="dashboard-section">
          <h2>My Applications</h2>
          <table className="placements-table">
            <thead>
              <tr>
                <th>School</th>
                <th>Location</th>
                <th>Status</th>
                <th>Applied Date</th>
              </tr>
            </thead>
            <tbody>
              {data.allPlacements.map((placement, idx) => (
                <tr key={idx}>
                  <td>{placement.schoolId?.name || 'N/A'}</td>
                  <td>{placement.schoolId?.location || 'N/A'}</td>
                  <td><span className={`status-${placement.status}`}>{placement.status}</span></td>
                  <td>{new Date(placement.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
