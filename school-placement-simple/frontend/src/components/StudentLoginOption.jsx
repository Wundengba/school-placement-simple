import { useState } from 'react'
import { IoLogIn } from 'react-icons/io5'
import '../styles/StudentLogin.css'

export default function StudentLoginOption() {
  const [showStudentLogin, setShowStudentLogin] = useState(false)
  const [indexNumber, setIndexNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // VERSION: NEW-BUILD-2026-02-09

  const validateIndex = (index) => {
    const trimmed = index.trim()
    if (!trimmed) return 'Index number is required'
    if (trimmed.length !== 12) return 'Index number must be exactly 12 digits'
    if (!/^\d{12}$/.test(trimmed)) return 'Index number must contain only digits'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    const validationError = validateIndex(indexNumber)
    if (validationError) {
      setError(validationError)
      return
    }
    
    setLoading(true)

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'https://backend-seven-ashen-18.vercel.app/api'
      console.log('[StudentLogin] Using API base:', API_BASE)
      const res = await fetch(`${API_BASE}/students/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indexNumber: indexNumber.trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Login failed')
        console.error('[StudentLogin] Login error:', data.message)
        setLoading(false)
        return
      }

      if (data.success && data.token) {
        // Store token and student info
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('studentInfo', JSON.stringify(data.student))
        
        console.log('✅ Student login successful')
        // Reload to show student portal
        window.location.reload()
      }
    } catch (err) {
      console.error('[StudentLogin] Error:', err)
      setError(err.message || 'Failed to connect to server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!showStudentLogin) {
    return (
      <div className="student-login-prompt">
        <p>✅ UPDATED - Are you a student or parent?</p>
        <button className="btn btn-secondary" onClick={() => setShowStudentLogin(true)}>
          <IoLogIn style={{marginRight:6}} /> Student Portal Login
        </button>
      </div>
    )
  }

  return (
    <div className="student-login-modal">
      <div className="student-login-card">
        <div className="student-login-header">
          <h2>Student Portal Login</h2>
          <p>Enter your index number to check your placement status</p>
        </div>

        <form onSubmit={handleSubmit} className="student-login-form">
          <div className="form-group">
            <label htmlFor="indexNumber">Index Number</label>
            <input
              type="text"
              id="indexNumber"
              placeholder="e.g., 050708500126"
              value={indexNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '')
                setIndexNumber(val.slice(0, 12))
              }}
              maxLength="12"
              disabled={loading}
              required
              autoFocus
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-buttons">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || indexNumber.trim().length !== 12}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowStudentLogin(false)} disabled={loading}>
              Back
            </button>
          </div>
        </form>

        <div className="student-login-footer">
          <p style={{fontSize: 12, color: '#666', marginTop: 12}}>Enter your 12-digit student index number to access your placement results.</p>
        </div>
      </div>
    </div>
  )
}
