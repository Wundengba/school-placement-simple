import { useState, useEffect } from 'react'
import '../styles/Analytics.css'
import { IoDocumentText, IoCloudDownload, IoDownload } from 'react-icons/io5'
import schools from '../data/schools'

export default function Analytics() {
  const [analytics, setAnalytics] = useState({
    placementRate: 0,
    averageScore: 0,
    totalStudents: 0,
    schoolDemand: []
  })

  const [gradeDistribution, setGradeDistribution] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0
  })

  const [placementByStatus, setPlacementByStatus] = useState({
    placed: 0,
    pending: 0,
    unplaced: 0
  })

  // Load actual school demand from student selections
  useEffect(() => {
    const registeredStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
    const allTestScores = JSON.parse(localStorage.getItem('testScores') || '[]')
    const schoolDemandMap = {}
    
    // Calculate placement breakdown
    let placed = 0
    let pending = 0
    let unplaced = 0

    // Calculate average score
    let totalScore = 0
    const scoredStudents = allTestScores.length

    // Count selections for each school and placement status
    registeredStudents.forEach(student => {
      const selections = JSON.parse(localStorage.getItem(`schoolSelections_${student.id}`) || 'null')
      
      // Check placement status
      if (student.placedSchool && student.placedSchool !== null && student.placedSchool !== undefined) {
        placed++
      } else if (selections) {
        // Has selections but not placed yet = pending
        pending++
        
        // Count selections
        if (selections.catA) {
          const schoolName = selections.catA
          schoolDemandMap[schoolName] = (schoolDemandMap[schoolName] || 0) + 1
        }
        if (selections.catB && Array.isArray(selections.catB)) {
          selections.catB.forEach(school => {
            if (school) {
              schoolDemandMap[school] = (schoolDemandMap[school] || 0) + 1
            }
          })
        }
        if (selections.catC && Array.isArray(selections.catC)) {
          selections.catC.forEach(school => {
            if (school) {
              schoolDemandMap[school] = (schoolDemandMap[school] || 0) + 1
            }
          })
        }
      } else {
        unplaced++
      }
    })

    // Calculate average score from test scores
    allTestScores.forEach(score => {
      if (score.average) {
        totalScore += score.average
      }
    })
    const averageScore = scoredStudents > 0 ? Math.round(totalScore / scoredStudents) : 0

    // Compute grade distribution from actual test averages
    const computeGrade = (avg) => {
      const s = Number(avg)
      if (s >= 90 && s <= 100) return 1
      if (s >= 80 && s <= 89) return 2
      if (s >= 75 && s <= 79) return 3
      if (s >= 70 && s <= 74) return 4
      if (s >= 65 && s <= 69) return 5
      if (s >= 60 && s <= 64) return 6
      if (s >= 55 && s <= 59) return 7
      if (s >= 50 && s <= 54) return 8
      return 9
    }

    const newGradeDist = {1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0}
    allTestScores.forEach(s => {
      if (s && (s.average !== null && s.average !== undefined)) {
        const g = computeGrade(s.average)
        newGradeDist[g] = (newGradeDist[g] || 0) + 1
      }
    })
    setGradeDistribution(newGradeDist)

    // Calculate placement rate
    const totalStudents = registeredStudents.length
    const placementRate = totalStudents > 0 ? Math.round((placed / totalStudents) * 100) : 0

    // Update placement breakdown
    setPlacementByStatus({
      placed,
      pending,
      unplaced
    })

    // Convert to array and sort by demand
    const schoolDemandArray = Object.entries(schoolDemandMap)
      .map(([name, demand]) => ({ 
        name, 
        demand,
        capacity: 100 // Default capacity
      }))
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 5) // Top 5 schools

    setAnalytics(prev => ({
      ...prev,
      placementRate,
      averageScore,
      totalStudents,
      schoolDemand: schoolDemandArray
    }))
  }, [])

  const handleGenerateReport = () => {
    const report = `STUDENT PLACEMENT ANALYTICS REPORT
Generated: ${new Date().toLocaleString()}

SUMMARY METRICS:
- Placement Rate: ${analytics.placementRate}%
- Average Score: ${analytics.averageScore}
- Total Students: 180
- Total Schools: ${schools.length}

PLACEMENT STATUS:
- Placed: ${placementByStatus.placed}
- Pending: ${placementByStatus.pending}
- Unplaced: ${placementByStatus.unplaced}

GRADE DISTRIBUTION:
${Object.entries(gradeDistribution).map(([grade, count]) => `- Grade ${grade}: ${count} students`).join('\n')}

SCHOOL DEMAND vs CAPACITY:
${analytics.schoolDemand.map(s => `- ${s.name}: ${s.demand}/${s.capacity} (${Math.round((s.demand/s.capacity)*100)}%)`).join('\n')}

Report generated successfully.`
    
    const blob = new Blob([report], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `placement-report-${new Date().getTime()}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
    alert('Report generated and downloaded successfully!')
  }

  const handleExportAnalytics = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Placement Rate', `${analytics.placementRate}%`],
      ['Average Score', analytics.averageScore],
      ['Placed Students', placementByStatus.placed],
      ['Pending Students', placementByStatus.pending],
      ['Unplaced Students', placementByStatus.unplaced],
      [''],
      ['School Name', 'Demand', 'Capacity', 'Utilization']
    ]
    
    analytics.schoolDemand.forEach(s => {
      rows.push([
        s.name,
        s.demand,
        s.capacity,
        `${Math.round((s.demand/s.capacity)*100)}%`
      ])
    })
    
    const csvData = rows.map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-export-${new Date().getTime()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    alert('Analytics exported to CSV successfully!')
  }

  const handleDownloadChart = () => {
    alert('Chart download feature is being prepared. For now, you can take a screenshot of the analytics dashboard.')
  }

  return (
    <div className="analytics-container">
      <h2>Analytics & Reports</h2>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Placement Rate</h3>
          <div className="large-metric">{analytics.placementRate}%</div>
          <p>Students successfully placed</p>
        </div>

        <div className="analytics-card">
          <h3>Average Score</h3>
          <div className="large-metric">{analytics.averageScore}</div>
          <p>Overall mean test score</p>
        </div>

        <div className="analytics-card">
          <h3>Total Students</h3>
          <div className="large-metric">{analytics.totalStudents}</div>
          <p>Registered for placement</p>
        </div>

        <div className="analytics-card">
          <h3>Total Schools</h3>
          <div className="large-metric">{schools.length}</div>
          <p>Participating institutions</p>
        </div>
      </div>

      <div className="analytics-section">
        <h3>School Demand vs Capacity</h3>
        <table className="demand-table">
          <thead>
            <tr>
              <th>School</th>
              <th>Demand</th>
              <th>Capacity</th>
              <th>Utilization</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {analytics.schoolDemand.map((school, idx) => {
              const utilization = Math.round((school.demand / school.capacity) * 100)
              const status = utilization > 100 ? 'Over Capacity' : utilization > 80 ? 'High' : 'Normal'
              return (
                <tr key={idx}>
                  <td>{school.name}</td>
                  <td className="center">{school.demand}</td>
                  <td className="center">{school.capacity}</td>
                  <td className="center">
                    <div className="utilization-bar">
                      <div 
                        className={`bar-fill status-${status.toLowerCase().replace(' ', '-')}`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                      <span className="bar-label">{utilization}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${status.toLowerCase().replace(' ', '-')}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card" style={{textAlign: 'left'}}>
          <h3>Placement Breakdown</h3>
          <div style={{marginTop: '1rem'}}>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <span>Placed</span><strong>{placementByStatus.placed}</strong>
            </div>
            <div style={{height: '10px', background: '#e9ecef', borderRadius: 6, margin: '8px 0'}}>
              <div style={{width: `${Math.round((placementByStatus.placed/(placementByStatus.placed+placementByStatus.pending+placementByStatus.unplaced))*100)}%`, height: '100%', background: 'linear-gradient(90deg,#51cf66,#40c057)', borderRadius: 6}} />
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <span>Pending</span><strong>{placementByStatus.pending}</strong>
            </div>
            <div style={{height: '10px', background: '#e9ecef', borderRadius: 6, margin: '8px 0'}}>
              <div style={{width: `${Math.round((placementByStatus.pending/(placementByStatus.placed+placementByStatus.pending+placementByStatus.unplaced))*100)}%`, height: '100%', background: 'linear-gradient(90deg,#ffd93d,#ffb000)', borderRadius: 6}} />
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <span>Unplaced</span><strong>{placementByStatus.unplaced}</strong>
            </div>
            <div style={{height: '10px', background: '#e9ecef', borderRadius: 6, margin: '8px 0'}}>
              <div style={{width: `${Math.round((placementByStatus.unplaced/(placementByStatus.placed+placementByStatus.pending+placementByStatus.unplaced))*100)}%`, height: '100%', background: 'linear-gradient(90deg,#ff6b6b,#ff5252)', borderRadius: 6}} />
            </div>
          </div>
        </div>

        <div className="analytics-card" style={{textAlign: 'left'}}>
          <h3>Grade Distribution</h3>
          <div style={{marginTop: '1rem'}}>
            {Object.entries(gradeDistribution).map(([grade, count]) => {
              const total = Object.values(gradeDistribution).reduce((a,b)=>a+b,0)
              const pct = Math.round((count/total)*100)
              return (
                <div key={grade} style={{marginBottom: '10px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span>{grade}</span>
                    <strong>{count} ({pct}%)</strong>
                  </div>
                  <div style={{height: '8px', background: '#e9ecef', borderRadius: 6, marginTop: '6px'}}>
                    <div style={{width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#667eea,#764ba2)', borderRadius: 6}} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="analytics-card" style={{textAlign: 'left'}}>
          <h3>Top Schools by Demand</h3>
          <ol style={{marginTop: '1rem'}}>
            {analytics.schoolDemand.sort((a,b)=>b.demand-a.demand).slice(0,5).map((s, idx) => (
              <li key={idx} style={{marginBottom: '8px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span>{s.name}</span>
                  <strong>{s.demand}</strong>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="analytics-actions">
        <button className="btn btn-primary" onClick={handleGenerateReport}><IoDocumentText className="app-icon" />Generate Full Report</button>
        <button className="btn btn-success" onClick={handleExportAnalytics}><IoCloudDownload className="app-icon" />Export Analytics</button>
        <button className="btn btn-info" onClick={handleDownloadChart}><IoDownload className="app-icon" />Download Chart</button>
      </div>
    </div>
  )
}
