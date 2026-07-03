import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('nexus_token')
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }
      const { data } = await client.get('/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUser() }, [fetchUser])

  const login = async (username, password) => {
    const { data } = await client.post('/auth/login', { username, password })
    localStorage.setItem('nexus_token', data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (username, email, password) => {
    const { data } = await client.post('/auth/register', { username, email, password })
    localStorage.setItem('nexus_token', data.token)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try {
      await client.post('/auth/logout')
    } catch {
      // ignore
    }
    localStorage.removeItem('nexus_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be within AuthProvider')
  return ctx
}
