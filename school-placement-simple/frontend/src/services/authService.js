/**
 * Authentication Service
 * Handles login, register, token management, and user verification
 */

const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '/api'

class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken')
    this.user = this.loadUser()
  }

  /**
   * Load user from localStorage
   */
  loadUser() {
    const userData = localStorage.getItem('currentUser')
    return userData ? JSON.parse(userData) : null
  }

  /**
   * Save user to localStorage
   */
  saveUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user))
    this.user = user
  }

  /**
   * Save token to localStorage
   */
  saveToken(token) {
    localStorage.setItem('authToken', token)
    this.token = token
  }

  /**
   * Register new user
   */
  async register(username, email, password, confirmPassword, fullName = '', role = 'staff') {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          email,
          password,
          confirmPassword,
          fullName,
          role
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      console.log('[AUTH] Registration successful')
      return data
    } catch (error) {
      console.error('[AUTH] Registration error:', error.message)
      throw error
    }
  }

  /**
   * Login user
   */
  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      // Save user and token
      this.saveUser(data.user)
      this.saveToken(data.user.token)

      console.log('[AUTH] Login successful for user:', data.user.username)
      return data
    } catch (error) {
      console.error('[AUTH] Login error:', error.message)
      throw error
    }
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('currentUser')
    this.token = null
    this.user = null
    console.log('[AUTH] User logged out')
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.user
  }

  /**
   * Get auth token
   */
  getToken() {
    return this.token
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.token && !!this.user
  }

  /**
   * Get authorization header
   */
  getAuthHeader() {
    return {
      'Authorization': `Bearer ${this.token}`
    }
  }

  /**
   * Verify token (check if still valid)
   */
  async verifyToken() {
    try {
      if (!this.token) {
        return false
      }

      const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      })

      if (response.ok) {
        return true
      } else {
        // Token expired or invalid
        this.logout()
        return false
      }
    } catch (error) {
      console.error('[AUTH] Token verification error:', error.message)
      this.logout()
      return false
    }
  }
}

export default new AuthService()
