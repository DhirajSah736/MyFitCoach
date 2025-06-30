import React from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import LoginForm from '../components/auth/LoginForm'
import SignupForm from '../components/auth/SignupForm'
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm'
import ResetPasswordForm from '../components/auth/ResetPasswordForm'

const AuthPage: React.FC = () => {
  const { type } = useParams<{ type: string }>()

  const renderForm = () => {
    switch (type) {
      case 'login':
        return <LoginForm />
      case 'signup':
        return <SignupForm />
      case 'forgot-password':
        return <ForgotPasswordForm />
      case 'reset-password':
        return <ResetPasswordForm />
      default:
        return <Navigate to="/auth/login" replace />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236C63FF' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              MyFitCoach
            </span>
          </div>
        </div>

        {renderForm()}
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-orange-200/30 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 right-10 w-16 h-16 bg-purple-300/20 rounded-full blur-lg animate-pulse delay-500"></div>
    </div>
  )
}

export default AuthPage