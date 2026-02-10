import { useState } from 'react'
import { IoLogIn, IoArrowBack } from 'react-icons/io5'
import '../styles/AdminLogin.css'

export default function AdminLogin({ onBack }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Username and password are required')
      return
    }

    setLoading(true)

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'https://backend-seven-ashen-18.vercel.app/api'
      console.log('[AdminLogin] Using API base:', API_BASE)
      
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        console.error('[AdminLogin] Login error:', data.error)
        setLoading(false)
        return
      }

      if (data.success && data.token) {
        // Store admin token and info
        localStorage.setItem('adminToken', data.token)
        sessionStorage.setItem('adminToken', data.token)
        localStorage.setItem('adminInfo', JSON.stringify(data.admin))
        
        console.log('✅ Admin login successful:', data.admin.username)
        
        // Trigger a refresh to reload the app with admin session
        window.location.reload()
      } else {
        setError('Login failed: No token received')
      }
    } catch (err) {
      console.error('[AdminLogin] Error:', err)
      setError(err.message || 'Failed to connect to server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <button className="back-btn" onClick={onBack}>
          <IoArrowBack /> Back
        </button>
        
        <h2>Admin Login</h2>
        <p className="subtitle">Manage school placements</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="login-btn"
          >
            <IoLogIn /> {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="demo-info">
          <p><strong>Demo Credentials:</strong></p>
          <p>Username: <code>admin</code></p>
          <p>Password: <code>admin123</code></p>
        </div>
      </div>
    </div>
  )
}
