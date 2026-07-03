import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiHome, FiBook, FiFileText, FiHelpCircle,
  FiUpload, FiCalendar, FiList, FiChevronLeft, FiChevronRight,
  FiTarget, FiCode, FiBarChart2
} from 'react-icons/fi'
const navItems = [
  { to: '/', icon: FiHome, label: 'Dashboard' },
  { to: '/library', icon: FiBook, label: 'Library' },
  { to: '/reading', icon: FiFileText, label: 'Reading' },
  { to: '/formulas', icon: FiBarChart2, label: 'Formulas' },
  { to: '/notes', icon: FiFileText, label: 'Notes' },
  { to: '/code', icon: FiCode, label: 'Code Snippets' },
  { to: '/mcqs', icon: FiHelpCircle, label: 'MCQs' },
  { to: '/todos', icon: FiList, label: 'Todos' },
  { to: '/calendar', icon: FiCalendar, label: 'Calendar' },
  { to: '/daily', icon: FiTarget, label: 'Daily Plan' },
  { to: '/upload', icon: FiUpload, label: 'Upload' },
]

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const stored = localStorage.getItem('nexus-sidebar')
    if (stored) setCollapsed(stored === 'true')
  }, [])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('nexus-sidebar', String(next))
  }

  const sidebarContent = (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 shrink-0 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">N</span>
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-bold text-lg"
            style={{ color: 'var(--text-primary)' }}
          >
            Nexus
          </motion.span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to)

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen?.(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                collapsed ? 'justify-center' : ''
              }`}
              style={{
                background: isActive ? 'var(--accent-light)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--nav-hover-bg)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
              aria-label={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              {!collapsed && (
                <span>{item.label}</span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="activeTab"
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--accent)' }}
                />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className={`px-2 py-4 space-y-1 border-t shrink-0`} style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={toggleCollapse}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full transition-all duration-150 hover:bg-black/5 dark:hover:bg-white/5 ${
            collapsed ? 'justify-center' : ''
          }`}
          style={{ color: 'var(--text-tertiary)' }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <FiChevronRight className="w-5 h-5" aria-hidden="true" /> : <><FiChevronLeft className="w-5 h-5" aria-hidden="true" /> Collapse</>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:block h-screen sticky top-0 overflow-hidden shrink-0"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'var(--overlay)' }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute left-0 top-0 h-full w-64"
              onClick={(e) => e.stopPropagation()}
            >
              {sidebarContent}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
