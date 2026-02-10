export const adminAuthService = {
  isAuthenticated: () => {
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
    return !!token
  },

  getAdminInfo: () => {
    const adminInfo = localStorage.getItem('adminInfo')
    return adminInfo ? JSON.parse(adminInfo) : null
  },

  getToken: () => {
    return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
  },

  login: async (username, password, apiBaseUrl) => {
    try {
      const response = await fetch(`${apiBaseUrl}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
      }

      const data = await response.json()
      
      if (data.token) {
        localStorage.setItem('adminToken', data.token)
        sessionStorage.setItem('adminToken', data.token)
        localStorage.setItem('adminInfo', JSON.stringify(data.admin))
        return { success: true, admin: data.admin }
      }

      throw new Error('No token received')
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  logout: () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminInfo')
    sessionStorage.removeItem('adminToken')
  },

  getAuthHeader: () => {
    const token = adminAuthService.getToken()
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }
}
