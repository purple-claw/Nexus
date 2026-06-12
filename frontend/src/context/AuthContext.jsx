import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
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
    setUser(data.user)
    return data.user
  }

  const register = async (username, email, password) => {
    const { data } = await client.post('/auth/register', { username, email, password })
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    await client.post('/auth/logout')
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
