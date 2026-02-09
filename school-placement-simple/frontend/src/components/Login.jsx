import { useState, useEffect } from 'react'
import authService from '../services/authService'
import './Login.css'

export default function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Login form state
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  })

  // Register form state
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'staff'
  })

  // Handle login form change
  const handleLoginChange = (e) => {
    const { name, value } = e.target
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  // Handle register form change
  const handleRegisterChange = (e) => {
    const { name, value } = e.target
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  // Handle login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      // Validation
      if (!loginData.username.trim()) {
        throw new Error('Username or email is required')
      }
      if (!loginData.password.trim()) {
        throw new Error('Password is required')
      }

      // Call login API
      const result = await authService.login(loginData.username, loginData.password)
      
      setSuccess('Login successful! Redirecting...')
      
      // Redirect after short delay
      setTimeout(() => {
        onLoginSuccess(result.user)
      }, 500)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle register submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      // Validation
      if (!registerData.username.trim()) {
        throw new Error('Username is required')
      }
      if (!registerData.email.trim()) {
        throw new Error('Email is required')
      }
      if (!registerData.password.trim()) {
        throw new Error('Password is required')
      }
      if (registerData.password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }
      if (registerData.password !== registerData.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      // Call register API
      await authService.register(
        registerData.username,
        registerData.email,
        registerData.password,
        registerData.confirmPassword,
        registerData.fullName,
        registerData.role
      )

      setSuccess('Registration successful! You can now login.')
      // Reset form
      setRegisterData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        role: 'staff'
      })
      // Switch to login mode
      setTimeout(() => {
        setMode('login')
      }, 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Tankpe System</h1>
          <p>School Management & Placement</p>
        </div>

        {error && <div className="login-error">{error}</div>}
        {success && <div className="login-success">{success}</div>}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <h2>Login to Your Account</h2>
            
            <div className="form-group">
              <label htmlFor="username">Username or Email</label>
              <input
                type="text"
                id="username"
                name="username"
                value={loginData.username}
                onChange={handleLoginChange}
                placeholder="Enter your username or email"
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                placeholder="Enter your password"
                disabled={isLoading}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>

            <div className="form-footer">
              <span>Don't have an account? </span>
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setMode('register')
                  setError('')
                  setSuccess('')
                }}
              >
                Register here
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="login-form">
            <h2>Create Your Account</h2>
            
            <div className="form-group">
              <label htmlFor="reg-username">Username</label>
              <input
                type="text"
                id="reg-username"
                name="username"
                value={registerData.username}
                onChange={handleRegisterChange}
                placeholder="Choose a username"
                disabled={isLoading}
                minLength="3"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                placeholder="Enter your email"
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={registerData.fullName}
                onChange={handleRegisterChange}
                placeholder="Enter your full name (optional)"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <input
                type="password"
                id="reg-password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                placeholder="Create a password (min 6 characters)"
                disabled={isLoading}
                minLength="6"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                placeholder="Confirm your password"
                disabled={isLoading}
                minLength="6"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Account Type</label>
              <select
                id="role"
                name="role"
                value={registerData.role}
                onChange={handleRegisterChange}
                disabled={isLoading}
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Register'}
            </button>

            <div className="form-footer">
              <span>Already have an account? </span>
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setMode('login')
                  setError('')
                  setSuccess('')
                }}
              >
                Login here
              </button>
            </div>
          </form>
        )}

        <div className="login-demo">
          <p><strong>Demo Credentials:</strong></p>
          <p>Username: <code>demo</code></p>
          <p>Password: <code>demo123</code></p>
        </div>
      </div>
    </div>
  )
}
