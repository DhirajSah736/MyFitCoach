import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const AuthCallback: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback page loaded')
        
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          
          // Clear any stale session data to prevent repeated refresh token errors
          await supabase.auth.signOut()
          
          navigate('/auth/login?error=callback_error')
          return
        }

        if (data.session) {
          console.log('Session found:', data.session.user.id)
          
          // User is authenticated, check if they have a profile
          const { data: profileData, error: profileError } = await supabase
            .from('user_profile')
            .select('id')
            .eq('user_id', data.session.user.id)
            .single()
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error checking user profile:', profileError)
          }
          
          // If no profile exists, redirect to onboarding
          if (!profileData) {
            console.log('No profile found, redirecting to onboarding')
            navigate('/onboarding', { replace: true })
            return
          }
          
          // User has a profile, redirect to dashboard
          console.log('Auth callback successful, redirecting to dashboard')
          navigate('/dashboard', { replace: true })
        } else {
          // No session, redirect to login
          console.log('No session found, redirecting to login')
          
          // Clear any stale session data on unexpected errors as well
          await supabase.auth.signOut()
          
          navigate('/auth/login', { replace: true })
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error)
        
        // Clear any stale session data on unexpected errors as well
        await supabase.auth.signOut()
        
        navigate('/auth/login?error=unexpected_error', { replace: true })
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing sign in...</h2>
        <p className="text-gray-600">Please wait while we redirect you.</p>
      </div>
    </div>
  )
}

export default AuthCallback