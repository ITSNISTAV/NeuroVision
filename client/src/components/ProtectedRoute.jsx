import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from './Navbar'

export default function ProtectedRoute() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="protected-layout">
      <div className="bg-orb orb1" aria-hidden />
      <div className="bg-orb orb2" aria-hidden />
      <div className="bg-orb orb3" aria-hidden />
      <Navbar />
      <Outlet />
    </div>
  )
}
