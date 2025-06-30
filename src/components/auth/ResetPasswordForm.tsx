import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const ResetPasswordForm: React.FC = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [tokenChecked, setTokenChecked] = useState(false)
  
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const extractAndSetToken = async () => {
      try {
        console.log('Checking for reset token...')
        
        // 1. Check URL hash (Supabase default format)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        let token = hashParams.get('access_token')
        let type = hashParams.get('type')
        
        // 2. Check URL query params (alternative format)
        if (!token) {
          const searchParams = new URLSearchParams(location.search)
          token = searchParams.get('token') || searchParams.get('access_token')
          type = searchParams.get('type')
        }
        
        // 3. Check if token is in the hash without params format
        if (!token && window.location.hash && window.location.hash.length > 1) {
          token = window.location.hash.substring(1)
        }
        
        console.log('Reset token found:', token ? 'Yes' : 'No')
        console.log('Token type:', type || 'Not specified')
        
        if (token) {
          setAccessToken(token)
          
          // Set the session with the token
          const { error } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: null
          })
          
          if (error) {
            console.error('Error setting session with token:', error)
            setError('Invalid or expired reset token. Please request a new password reset.')
          } else {
            console.log('Session set successfully with token')
          }
        } else {
          setError('No reset token found. Please request a new password reset.')
          console.error('No reset token found in URL:', window.location.href)
        }
        
        setTokenChecked(true)
      } catch (err) {
        console.error('Error extracting token:', err)
        setError('Failed to process reset token. Please request a new password reset.')
        setTokenChecked(true)
      }
    }
    
    extractAndSetToken()
  }, [location])

  const validatePassword = () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePassword() || !accessToken) {
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      console.log('Attempting to reset password with token')
      const { error } = await updatePassword(password)
      
      if (error) {
        console.error('Error from Supabase:', error)
        throw error
      }
      
      console.log('Password reset successful')
      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth/login')
      }, 3000)
    } catch (error: any) {
      console.error('Error resetting password:', error)
      setError(error.message || 'Failed to reset password. Please try again or request a new reset link.')
    } finally {
      setLoading(false)
    }
  }

  if (!tokenChecked) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset token...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful</h2>
          <p className="text-gray-600 mb-6">
            Your password has been successfully reset. You will be redirected to the login page shortly.
          </p>
          <Link
            to="/auth/login"
            className="block w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-200"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Your Password</h2>
          <p className="text-gray-600">Enter your new password below</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter new password"
                required
                disabled={loading || !accessToken}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters long</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Confirm new password"
                required
                disabled={loading || !accessToken}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !accessToken}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Resetting Password...</span>
              </>
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/auth/login"
            className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-500 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordForm