import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Library from './pages/Library'
import TopicDetail from './pages/TopicDetail'
import ReadingList from './pages/ReadingList'
import ReadingDetail from './pages/ReadingDetail'
import ContentDetail from './pages/ContentDetail'
import MCQList from './pages/MCQList'
import MCQPractice from './pages/MCQPractice'
import Upload from './pages/Upload'
import Calendar from './pages/Calendar'
import DailyView from './pages/DailyView'
import Todos from './pages/Todos'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage />
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="library" element={<Library />} />
        <Route path="topics/:id" element={<TopicDetail />} />
        <Route path="reading" element={<ReadingList />} />
        <Route path="reading/:id" element={<ReadingDetail />} />
        <Route path="reading/item/:type/:id" element={<ContentDetail />} />
        <Route path="mcqs" element={<MCQList />} />
        <Route path="mcqs/practice" element={<MCQPractice />} />
        <Route path="upload" element={<Upload />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="daily" element={<DailyView />} />
        <Route path="daily/:date" element={<DailyView />} />
        <Route path="todos" element={<Todos />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
