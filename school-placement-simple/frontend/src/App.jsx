import { useState, useEffect } from 'react'
import syncService from './services/syncService'
import authService from './services/authService'
import { adminAuthService } from './services/adminAuthService'
import './App.css'
import LoginSelection from './components/LoginSelection'
import StudentLoginOption from './components/StudentLoginOption'
import StudentPortalView from './components/StudentPortalView'
// Dashboard removed per request
import Registration from './components/Registration'
import Students from './components/Students'
import TestScores from './components/TestScores'
import Analytics from './components/Analytics'
import SchoolSelection from './components/SchoolSelection'
import Placement from './components/Placement'
import Schools from './components/Schools'
import AdminExaminations from './components/AdminExaminations'
import { IoHome, IoPersonAdd, IoPeople, IoDocumentText, IoBarChart, IoLocation, IoCheckmarkDone, IoLibrary, IoLogOut, IoClipboard, IoMenu } from 'react-icons/io5'

function getInitialTab() {
  const saved = localStorage.getItem('activeTab')
  return saved || 'students'
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated())
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser())
  const [activeTab, setActiveTab] = useState(getInitialTab())
  const [lastSync, setLastSync] = useState(null)
  const [syncError, setSyncError] = useState(null)
  const apiBase = (import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '/api'

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab)
  }, [activeTab])

  // Sync on startup and start auto-sync (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return

    let mounted = true
    ;(async () => {
      try {
        console.log('[APP] Starting initial sync on app load...')
        const result = await syncService.syncNow()
        if (mounted) {
          const timestamp = new Date().toISOString()
          setLastSync(timestamp)
          setSyncError(null)
          console.log('[APP] ✅ Initial sync completed at:', timestamp)
        }
      } catch (e) {
        console.error('[APP] ❌ Initial sync failed:', e.message)
        if (mounted) setSyncError(e.message)
      }
      
      // Start auto-sync every 5 seconds (with real-time event-driven syncs on data changes)
      console.log('[APP] Starting auto-sync interval (every 5s) with real-time event triggers...')
      syncService.startAutoSync(5000)
    })()
    
    return () => { 
      console.log('[APP] Cleaning up: stopping auto-sync and unmounting')
      mounted = false
      syncService.stopAutoSync() 
    }
  }, [isAuthenticated])

  // Listen for auto-sync completions and update UI
  useEffect(() => {
    const handleSyncCompleted = (event) => {
      console.log('[APP] Received syncCompleted event')
      setLastSync(event.detail.timestamp)
    }
    
    window.addEventListener('syncCompleted', handleSyncCompleted)
    return () => window.removeEventListener('syncCompleted', handleSyncCompleted)
  }, [])

  // Listen for tab change events from components
  useEffect(() => {
    const handleTabChange = () => {
      const newTab = localStorage.getItem('activeTab')
      if (newTab) {
        setActiveTab(newTab.toLowerCase())
      }
    }
    
    window.addEventListener('tabChanged', handleTabChange)
    return () => window.removeEventListener('tabChanged', handleTabChange)
  }, [])

  // Handle login success
  const handleLoginSuccess = (user) => {
    setCurrentUser(user)
    setIsAuthenticated(true)
    console.log('[APP] User logged in:', user.username)
  }

  // Handle logout
  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      // Check if admin or student and logout accordingly
      if (adminAuth) {
        adminAuthService.logout()
      } else {
        authService.logout()
      }
      setIsAuthenticated(false)
      setCurrentUser(null)
      setLastSync(null)
      localStorage.removeItem('activeTab')
      setActiveTab('dashboard')
      console.log('[APP] User logged out')
      window.location.reload()
    }
  }

  // Check for student login
  const studentAuth = localStorage.getItem('authToken')
  const studentInfo = localStorage.getItem('studentInfo')
  
  // Check for admin login
  const adminAuth = localStorage.getItem('adminToken')
  const adminInfoJson = localStorage.getItem('adminInfo')
  const adminInfo = adminInfoJson ? JSON.parse(adminInfoJson) : null
  
  // If no authentication at all, show login selection
  if (!isAuthenticated && !studentAuth && !adminAuth) {
    return <LoginSelection />
  }

  // If admin is logged in, continue into the main app (dashboard tab removed)

  // If student is logged in (but not admin), show student view
  if (studentAuth && !adminAuth) {
    return <StudentPortalView studentInfo={studentInfo} />
  }

  // Otherwise show the main app
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const toggleSidebar = () => setSidebarOpen(s => !s)

  return (
    <div className="app">
      <header className="header">
        <div className="header-left" style={{display:'flex',alignItems:'center',gap:12}}>
          <button className="btn" onClick={toggleSidebar} aria-label="Toggle sidebar" style={{padding:'8px 10px'}}>
            <IoMenu />
          </button>
          <h1>Tankpe School Management & Placement System</h1>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end'}}>
          <span style={{fontSize:12,color:'#666'}}>Welcome, <strong>{currentUser?.fullName || currentUser?.username}</strong></span>
          <button className="btn" onClick={() => setActiveTab('students')} title="Home">
            <IoHome style={{marginRight:6}} /> Home
          </button>
          <button className="btn" onClick={async () => { try { await syncService.syncNow(); setLastSync(new Date().toISOString()); alert('Sync complete') } catch(e) { alert('Sync failed: '+e.message) } }}>
            Sync Now
          </button>
          <button className="btn btn-logout" onClick={handleLogout} title="Logout">
            <IoLogOut style={{marginRight:5}} /> Logout
          </button>
          <div style={{fontSize:12,color:'#666'}}>{lastSync ? `Last sync: ${new Date(lastSync).toLocaleString()}` : 'Not yet synced'}</div>
        </div>
      </header>

      <div className="app-body">
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            <button className={`tab-btn ${activeTab === 'registration' ? 'active' : ''}`} onClick={() => { setActiveTab('registration'); if (window.innerWidth < 900) setSidebarOpen(false) }}>
              <IoPersonAdd className="app-icon" /> Registration
            </button>
            <button className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`} onClick={() => { setActiveTab('students'); if (window.innerWidth < 900) setSidebarOpen(false) }}>
              <IoPeople className="app-icon" /> Students
            </button>
            <button className={`tab-btn ${activeTab === 'testscores' ? 'active' : ''}`} onClick={() => { setActiveTab('testscores'); if (window.innerWidth < 900) setSidebarOpen(false) }}>
              <IoDocumentText className="app-icon" /> Test Scores
            </button>
            <button className={`tab-btn ${activeTab === 'examinations' ? 'active' : ''}`} onClick={() => { setActiveTab('examinations'); if (window.innerWidth < 900) setSidebarOpen(false) }}>
              <IoClipboard className="app-icon" /> Examinations
            </button>
            <button className={`tab-btn ${activeTab === 'schoolselection' ? 'active' : ''}`} onClick={() => { setActiveTab('schoolselection'); if (window.innerWidth < 900) setSidebarOpen(false) }}>
              <IoLocation className="app-icon" /> School Selection
            </button>
            <button className={`tab-btn ${activeTab === 'placement' ? 'active' : ''}`} onClick={() => { setActiveTab('placement'); if (window.innerWidth < 900) setSidebarOpen(false) }}>
              <IoCheckmarkDone className="app-icon" /> Placement Results
            </button>
            <button className={`tab-btn ${activeTab === 'schools' ? 'active' : ''}`} onClick={() => { setActiveTab('schools'); if (window.innerWidth < 900) setSidebarOpen(false) }}>
              <IoLibrary className="app-icon" /> Schools
            </button>
            <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => { setActiveTab('analytics'); if (window.innerWidth < 900) setSidebarOpen(false) }}>
              <IoBarChart className="app-icon" /> Analytics
            </button>
          </nav>
        </aside>

        <main className="tab-content">
          {/* content rendering */}
          {/* Dashboard removed; keep remaining tabs rendering */}
          {activeTab === 'registration' && <Registration />}
          {activeTab === 'students' && <Students />}
          {activeTab === 'testscores' && <TestScores />}
          {activeTab === 'examinations' && <AdminExaminations />}
          {activeTab === 'schoolselection' && <SchoolSelection />}
          {activeTab === 'placement' && <Placement />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'schools' && <Schools />}
        </main>
      </div>
    </div>
  )
}
