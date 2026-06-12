import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/')) {
      const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/register'
      if (!isLoginPage) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default client
