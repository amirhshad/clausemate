import { Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Contracts from './pages/Contracts'
import ContractDetail from './pages/ContractDetail'
import Timeline from './pages/Timeline'
import Recommendations from './pages/Recommendations'
import Settings from './pages/Settings'
import Layout from './components/Layout'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Public routes (no auth required)
  if (!user) {
    return (
      <>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Analytics />
      </>
    )
  }

  // Authenticated routes
  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/contracts/:id/analysis" element={<ContractDetail />} />
          <Route path="/analysis" element={<ContractDetail />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <Analytics />
    </>
  )
}

export default App
