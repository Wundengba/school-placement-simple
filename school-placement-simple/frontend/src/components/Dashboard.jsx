import { useState, useEffect } from 'react'
import '../styles/Dashboard.css'
import { IoPeople, IoSchool, IoCheckmarkDone, IoTime } from 'react-icons/io5'
import schools from '../data/schools'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSchools: 0,
    placedStudents: 0,
    pendingStudents: 0
  })

  useEffect(() => {
    // Load stats from localStorage
    const registeredStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
    const placedStudentsData = registeredStudents.filter(s => s.placedSchool !== undefined && s.placedSchool !== null)
    
    setStats({
      totalStudents: registeredStudents.length,
      totalSchools: schools.length,
      placedStudents: placedStudentsData.length,
      pendingStudents: registeredStudents.length - placedStudentsData.length
    })
  }, [])

  const handleGenerateReport = () => {
    const report = `DASHBOARD REPORT\nGenerated: ${new Date().toLocaleString()}\n\nSTATISTICS:\n- Total Students: ${stats.totalStudents}\n- Total Schools: ${stats.totalSchools}\n- Placed Students: ${stats.placedStudents}\n- Pending: ${stats.pendingStudents}\n- Placement Rate: ${Math.round((stats.placedStudents/stats.totalStudents)*100)}%`
    
    const blob = new Blob([report], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-report-${new Date().getTime()}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
    alert('Report generated and downloaded successfully!')
  }

  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Students', stats.totalStudents],
      ['Total Schools', stats.totalSchools],
      ['Placed Students', stats.placedStudents],
      ['Pending Students', stats.pendingStudents],
      ['Placement Rate (%)', Math.round((stats.placedStudents/stats.totalStudents)*100)]
    ]
    
    const csvData = rows.map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-export-${new Date().getTime()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    alert('Dashboard data exported to CSV successfully!')
  }

  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><IoPeople className="app-icon" /></div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalStudents}</div>
            <div className="stat-label">Total Students</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><IoSchool className="app-icon" /></div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalSchools}</div>
            <div className="stat-label">Schools</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><IoCheckmarkDone className="app-icon" /></div>
          <div className="stat-info">
            <div className="stat-number">{stats.placedStudents}</div>
            <div className="stat-label">Placed Students</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><IoTime className="app-icon" /></div>
          <div className="stat-info">
            <div className="stat-number">{stats.pendingStudents}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <button className="btn btn-success" onClick={handleGenerateReport}>Generate Report</button>
        <button className="btn btn-info" onClick={handleExportCSV}>Export CSV</button>
      </div>
    </div>
  )
}
