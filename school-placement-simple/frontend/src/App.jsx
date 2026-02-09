import { useState, useEffect } from 'react'
import syncService from './services/syncService'
import authService from './services/authService'
import './App.css'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Registration from './components/Registration'
import Students from './components/Students'
import TestScores from './components/TestScores'
import Analytics from './components/Analytics'
import SchoolSelection from './components/SchoolSelection'
import Placement from './components/Placement'
import Schools from './components/Schools'
import { IoHome, IoPersonAdd, IoPeople, IoDocumentText, IoBarChart, IoLocation, IoCheckmarkDone, IoLibrary, IoLogOut } from 'react-icons/io5'

function getInitialTab() {
  const saved = localStorage.getItem('activeTab')
  return saved || 'dashboard'
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
      authService.logout()
      setIsAuthenticated(false)
      setCurrentUser(null)
      setLastSync(null)
      localStorage.removeItem('activeTab')
      setActiveTab('dashboard')
      console.log('[APP] User logged out')
    }
  }

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  // Otherwise show the main app
  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>Tankpe School Management & Placement System</h1>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end'}}>
          <span style={{fontSize:12,color:'#666'}}>Welcome, <strong>{currentUser?.fullName || currentUser?.username}</strong></span>
          <button className="btn" onClick={async () => { try { await syncService.syncNow(); setLastSync(new Date().toISOString()); alert('Sync complete') } catch(e) { alert('Sync failed: '+e.message) } }}>
            Sync Now
          </button>
          <button className="btn btn-logout" onClick={handleLogout} title="Logout">
            <IoLogOut style={{marginRight:5}} /> Logout
          </button>
          <div style={{fontSize:12,color:'#666'}}>{lastSync ? `Last sync: ${new Date(lastSync).toLocaleString()}` : 'Not yet synced'}</div>
        </div>
      </header>

      <nav className="tabs-nav">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <IoHome className="app-icon" /> Dashboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'registration' ? 'active' : ''}`}
          onClick={() => setActiveTab('registration')}
        >
          <IoPersonAdd className="app-icon" /> Registration
        </button>
        <button 
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <IoPeople className="app-icon" /> Students
        </button>
        <button 
          className={`tab-btn ${activeTab === 'testscores' ? 'active' : ''}`}
          onClick={() => setActiveTab('testscores')}
        >
          <IoDocumentText className="app-icon" /> Test Scores
        </button>
        <button 
          className={`tab-btn ${activeTab === 'schoolselection' ? 'active' : ''}`}
          onClick={() => setActiveTab('schoolselection')}
        >
          <IoLocation className="app-icon" /> School Selection
        </button>
        <button 
          className={`tab-btn ${activeTab === 'placement' ? 'active' : ''}`}
          onClick={() => setActiveTab('placement')}
        >
          <IoCheckmarkDone className="app-icon" /> Placement Results
        </button>
        <button 
          className={`tab-btn ${activeTab === 'schools' ? 'active' : ''}`}
          onClick={() => setActiveTab('schools')}
        >
          <IoLibrary className="app-icon" /> Schools
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <IoBarChart className="app-icon" /> Analytics
        </button>
      </nav>

      <main className="tab-content">
        {activeTab === 'dashboard' && <Dashboard user={currentUser} />}
        {activeTab === 'registration' && <Registration />}
        {activeTab === 'students' && <Students />}
        {activeTab === 'testscores' && <TestScores />}
        {activeTab === 'schoolselection' && <SchoolSelection />}
        {activeTab === 'placement' && <Placement />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'schools' && <Schools />}
      </main>
    </div>
  )
}
