import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { SubscriptionDetails, CancelMembershipResponse, ReactivateMembershipResponse, VerifySubscriptionResponse } from '../types/subscription'

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Call the database function to get subscription details
      const { data, error } = await supabase.rpc('get_user_subscription_details', {
        user_id_param: user.id
      })

      if (error) throw error

      if (data) {
        setSubscription({
          planType: data.planType || 'free',
          status: data.status || 'active',
          currentPeriodEnd: data.currentPeriodEnd,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
          isWhitelisted: data.isWhitelisted || false,
          hasPremiumAccess: data.hasPremiumAccess || false,
          sessionsUsed: data.sessionsUsed || 0,
          sessionsRemaining: data.sessionsRemaining || 3
        })
      } else {
        // Default subscription for new users
        setSubscription({
          planType: 'free',
          status: 'active',
          cancelAtPeriodEnd: false,
          isWhitelisted: user.email === 'eyemdheeraj436@gmail.com',
          hasPremiumAccess: user.email === 'eyemdheeraj436@gmail.com',
          sessionsUsed: 0,
          sessionsRemaining: user.email === 'eyemdheeraj436@gmail.com' ? 999 : 3
        })
      }
    } catch (err) {
      console.error('Error fetching subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription')
      
      // Fallback subscription
      setSubscription({
        planType: 'free',
        status: 'active',
        cancelAtPeriodEnd: false,
        isWhitelisted: user.email === 'eyemdheeraj436@gmail.com',
        hasPremiumAccess: user.email === 'eyemdheeraj436@gmail.com',
        sessionsUsed: 0,
        sessionsRemaining: user.email === 'eyemdheeraj436@gmail.com' ? 999 : 3
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  const checkPremiumAccess = useCallback(async (): Promise<boolean> => {
    if (!user) return false

    try {
      const { data, error } = await supabase.rpc('check_user_premium_access_with_usage', {
        user_email: user.email || '',
        user_id_param: user.id
      })

      if (error) throw error
      return data?.hasPremiumAccess || false
    } catch (err) {
      console.error('Error checking premium access:', err)
      return user.email === 'eyemdheeraj436@gmail.com'
    }
  }, [user])

  const trackSessionUsage = useCallback(async (): Promise<boolean> => {
    if (!user) return false

    try {
      const { data, error } = await supabase.rpc('track_ai_session_usage', {
        user_id_param: user.id
      })

      if (error) throw error
      
      // Refresh subscription data after tracking usage
      await fetchSubscription()
      
      return data || false
    } catch (err) {
      console.error('Error tracking session usage:', err)
      return false
    }
  }, [user, fetchSubscription])

  const verifySubscription = useCallback(async (sessionId: string): Promise<VerifySubscriptionResponse> => {
    if (!user) throw new Error('User not authenticated')

    try {
      console.log('Verifying subscription with session ID:', sessionId);
      
      const { data, error } = await supabase.functions.invoke('verify-subscription', {
        body: { sessionId }
      })

      if (error) {
        console.error('Error from verify-subscription function:', error);
        throw error;
      }

      console.log('Verification response:', data);

      // Refresh subscription data
      await fetchSubscription()

      return data as VerifySubscriptionResponse
    } catch (err) {
      console.error('Error verifying subscription:', err)
      throw err
    }
  }, [user, fetchSubscription])

  const cancelMembership = useCallback(async (): Promise<CancelMembershipResponse> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase.rpc('cancel_user_membership', {
        user_id_param: user.id
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error)
      }

      // Refresh subscription data
      await fetchSubscription()

      return data as CancelMembershipResponse
    } catch (err) {
      console.error('Error canceling membership:', err)
      throw err
    }
  }, [user, fetchSubscription])

  const reactivateMembership = useCallback(async (): Promise<ReactivateMembershipResponse> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase.rpc('reactivate_user_membership', {
        user_id_param: user.id
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error)
      }

      // Refresh subscription data
      await fetchSubscription()

      return data as ReactivateMembershipResponse
    } catch (err) {
      console.error('Error reactivating membership:', err)
      throw err
    }
  }, [user, fetchSubscription])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  return {
    subscription,
    loading,
    error,
    checkPremiumAccess,
    trackSessionUsage,
    verifySubscription,
    cancelMembership,
    reactivateMembership,
    refetch: fetchSubscription
  }
}