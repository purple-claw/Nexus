import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiMail, FiLock, FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      await login(username, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-page)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Sign in to your Nexus account</p>
        </div>

        {/* Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg text-sm text-red-500"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}
              >
                {error}
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Username
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter your username"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full btn-lg"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><FiLogIn className="w-4 h-4" /> Sign in</>
              )}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="font-medium" style={{ color: 'var(--accent)' }}>
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
