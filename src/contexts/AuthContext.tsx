import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, metadata?: { first_name?: string, last_name?: string }) => Promise<{ error: AuthError | null, data?: any }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string, redirectTo?: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          
          // Handle invalid refresh token by clearing the session
          if (error.message?.includes('refresh_token_not_found') || error.message?.includes('Invalid Refresh Token')) {
            console.log('Invalid refresh token detected, clearing session')
            await supabase.auth.signOut()
            if (mounted) {
              setSession(null)
              setUser(null)
              setLoading(false)
            }
            return
          }
        }
        
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, metadata?: { first_name?: string, last_name?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/email-verification-success`,
        data: metadata
      }
    })
    return { error, data }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    console.log('Initiating Google sign-in')
    const redirectUrl = `${window.location.origin}/auth/callback`
    console.log('Redirect URL:', redirectUrl)
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    
    if (error) {
      console.error('Google sign-in error:', error)
    } else {
      console.log('Google sign-in initiated successfully')
    }
    
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string, redirectTo?: string) => {
    console.log('Sending password reset email to:', email)
    
    // Use provided redirectTo or default to current origin
    const resetRedirectTo = redirectTo || `${window.location.origin}/auth/reset-password`
    console.log('Using redirect URL:', resetRedirectTo)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirectTo
    })
    
    if (error) {
      console.error('Error sending reset password email:', error)
    } else {
      console.log('Reset password email sent successfully')
    }
    
    return { error }
  }

  const updatePassword = async (password: string) => {
    console.log('Updating password')
    const { error } = await supabase.auth.updateUser({ password })
    
    if (error) {
      console.error('Error updating password:', error)
    } else {
      console.log('Password updated successfully')
    }
    
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}