import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiresOnboarding?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiresOnboarding = false }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, redirect to login with return url
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  // If authenticated, render the protected content
  // The Dashboard component will handle onboarding checks internally
  return <>{children}</>
}

export default ProtectedRoute