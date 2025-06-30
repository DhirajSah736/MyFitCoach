import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Bot, 
  Video, 
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  User,
  Activity,
  Target,
  TrendingUp,
  Zap,
  Clock,
  Calendar,
  History,
  X,
  Trash2,
  PhoneOff,
  Crown,
  Lock,
  Info
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSubscription } from '../../hooks/useSubscription'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'

interface TavusConversation {
  conversation_id: string
  conversation_url: string
  status: 'active' | 'ended' | 'error'
}

interface ConversationHistory {
  id: string
  conversation_id: string
  conversation_url: string
  status: 'active' | 'ended' | 'error'
  started_at: string
  ended_at?: string
  duration_seconds?: number
  end_reason?: string
}

const AICoachSection: React.FC = () => {
  const { user } = useAuth()
  const { subscription, checkPremiumAccess, trackSessionUsage } = useSubscription()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isEndingConversation, setIsEndingConversation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStep, setConnectionStep] = useState('')
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new')
  const [activeConversation, setActiveConversation] = useState<TavusConversation | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  // Session timeout - 3 minutes (180 seconds)
  const SESSION_TIMEOUT = 180 // seconds
  
  // Timer refs for session management
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sessionEndingRef = useRef<boolean>(false)

  // Tavus configuration from environment variables
  const TAVUS_API_KEY = import.meta.env.VITE_TAVUS_API_KEY
  const TAVUS_PERSONA_ID = import.meta.env.VITE_TAVUS_PERSONA_ID
  const TAVUS_REPLICA_ID = import.meta.env.VITE_TAVUS_REPLICA_ID

  // Check if Tavus is properly configured
  const isTavusConfigured = TAVUS_API_KEY && TAVUS_PERSONA_ID && TAVUS_REPLICA_ID

  // Check premium access on component mount and subscription changes
  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        const hasAccess = await checkPremiumAccess()
        setHasPremiumAccess(hasAccess)
      }
    }
    checkAccess()
  }, [user, subscription, checkPremiumAccess])

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    console.log('🧹 Clearing all timers')
    
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current)
      sessionTimeoutRef.current = null
      console.log('✅ Cleared session timeout')
    }
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
      console.log('✅ Cleared timer interval')
    }
    
    setTimeRemaining(null)
  }, [])

  // Handle session end with reason
  const handleEndSession = useCallback(async (reason: 'manual' | 'timeout' = 'manual') => {
    // Prevent multiple simultaneous calls
    if (sessionEndingRef.current) {
      console.log('⚠️ Session already ending, ignoring duplicate call')
      return
    }
    
    sessionEndingRef.current = true
    console.log(`🛑 Ending session due to: ${reason}`)
    
    // Clear all timers immediately
    clearAllTimers()

    if (!activeConversation) {
      console.log('⚠️ No active conversation to end')
      // Reset state if no active conversation
      setSessionStarted(false)
      setActiveConversation(null)
      setSessionStartTime(null)
      sessionEndingRef.current = false
      return
    }

    setIsEndingConversation(true)
    setConnectionStep(`Ending conversation (${reason === 'manual' ? 'manually by user' : 'automatically after 3-minute timeout'})...`)

    try {
      // 1. Terminate Tavus conversation via API
      console.log('📞 Terminating Tavus conversation via API')
      const response = await fetch(`https://tavusapi.com/v2/conversations/${activeConversation.conversation_id}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': TAVUS_API_KEY
        }
      })

      if (!response.ok) {
        console.warn('⚠️ Failed to properly end conversation via API:', response.statusText)
        // Continue with cleanup even if API call fails
      } else {
        console.log('✅ Successfully terminated Tavus conversation')
      }

      // 2. Calculate session duration
      const duration = sessionStartTime 
        ? Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000)
        : undefined

      console.log('⏱️ Session duration:', duration, 'seconds')

      // 3. Update database record status with end reason
      await updateConversationStatus(
        activeConversation.conversation_id, 
        'ended', 
        duration,
        reason === 'manual' ? 'Session ended manually by user' : 'Session ended automatically after 3-minute timeout'
      )

      setConnectionStep(reason === 'manual' 
        ? 'Session ended manually by user' 
        : 'Session ended automatically after 3-minute timeout')
      
      // 4. Release allocated resources
      setActiveConversation(null)
      setSessionStartTime(null)
      setSessionStarted(false)
      
      console.log('🧹 Released all session resources')
      
      // Clear status after a few seconds
      setTimeout(() => {
        setConnectionStep('')
      }, 3000)

    } catch (err) {
      console.error('❌ Error ending conversation:', err)
      setError('Failed to end conversation properly. Please try again.')
      setConnectionStep('')
    } finally {
      setIsEndingConversation(false)
      sessionEndingRef.current = false
      console.log('✅ Session end process completed')
    }
  }, [activeConversation, sessionStartTime, TAVUS_API_KEY, clearAllTimers])

  // Start session timeout and countdown timer
  const startSessionTimeout = useCallback(() => {
    if (!sessionStarted || sessionEndingRef.current) {
      console.log('⚠️ Cannot start session timeout - session not started or ending')
      return
    }

    console.log(`⏰ Starting ${SESSION_TIMEOUT}-second session timeout`)
    
    // Clear any existing timers
    clearAllTimers()
    
    // Set initial time remaining
    setTimeRemaining(SESSION_TIMEOUT)
    
    // Start countdown interval
    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Clear interval when reaching 0
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current)
            timerIntervalRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Set session timeout
    sessionTimeoutRef.current = setTimeout(() => {
      if (sessionStarted && !sessionEndingRef.current) {
        console.log('⏰ Session ending due to timeout')
        handleEndSession('timeout')
      } else {
        console.log('⚠️ Timeout triggered but session not active or already ending')
      }
    }, SESSION_TIMEOUT * 1000)

    console.log(`✅ Set ${SESSION_TIMEOUT}-second session timeout`)
  }, [sessionStarted, clearAllTimers, handleEndSession, SESSION_TIMEOUT])

  // Effect to manage session lifecycle
  useEffect(() => {
    if (sessionStarted && activeConversation) {
      console.log(`🚀 Session started - initializing ${SESSION_TIMEOUT}-second timeout`)
      
      // Start timeout
      startSessionTimeout()
      
      // Return cleanup function
      return () => {
        console.log('🧹 Cleaning up session timers')
        clearAllTimers()
      }
    } else {
      console.log('🛑 Session not active - clearing timers')
      clearAllTimers()
    }
  }, [sessionStarted, activeConversation, startSessionTimeout, clearAllTimers])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting - cleaning up timers')
      clearAllTimers()
    }
  }, [clearAllTimers])

  // Fetch conversation history
  useEffect(() => {
    const fetchConversationHistory = async () => {
      if (!user || !isTavusConfigured) return

      setHistoryLoading(true)
      try {
        const { data, error } = await supabase
          .from('ai_conversation_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })

        if (error) throw error
        setConversationHistory(data || [])
      } catch (err) {
        console.error('Error fetching conversation history:', err)
      } finally {
        setHistoryLoading(false)
      }
    }

    fetchConversationHistory()
  }, [user, isTavusConfigured])

  const saveConversationToHistory = async (conversationData: TavusConversation) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('ai_conversation_logs')
        .insert([{
          user_id: user.id,
          conversation_id: conversationData.conversation_id,
          conversation_url: conversationData.conversation_url,
          status: conversationData.status,
          started_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      
      // Add to local state
      setConversationHistory(prev => [data, ...prev])
      return data
    } catch (err) {
      console.error('Error saving conversation to history:', err)
      return null
    }
  }

  const updateConversationStatus = async (
    conversationId: string, 
    status: 'ended' | 'error', 
    duration?: number,
    endReason?: string
  ) => {
    if (!user) return

    try {
      const updateData: any = {
        status,
        ended_at: new Date().toISOString(),
        end_reason: endReason
      }
      
      if (duration) {
        updateData.duration_seconds = duration
      }

      const { error } = await supabase
        .from('ai_conversation_logs')
        .update(updateData)
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      setConversationHistory(prev => 
        prev.map(conv => 
          conv.conversation_id === conversationId 
            ? { ...conv, ...updateData }
            : conv
        )
      )
      
      console.log(`✅ Updated conversation status: ${status}, reason: ${endReason}`)
    } catch (err) {
      console.error('Error updating conversation status:', err)
    }
  }

  const deleteConversationFromHistory = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('ai_conversation_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      // Remove from local state
      setConversationHistory(prev => prev.filter(conv => conv.id !== id))
      setShowDeleteConfirm(null)
    } catch (err) {
      console.error('Error deleting conversation:', err)
    }
  }

  const startConversation = async () => {
    if (!isTavusConfigured) {
      setError('Tavus AI is not properly configured. Please check your environment variables.')
      return
    }

    // Check premium access before starting conversation
    if (!hasPremiumAccess) {
      if (subscription?.planType === 'free') {
        setError(`You've used ${subscription.sessionsUsed} of 3 free AI video chat sessions this month. Upgrade to premium for unlimited access.`)
      } else {
        setError('Premium subscription required to access Larry AI Coach. Please upgrade your plan.')
      }
      return
    }

    setIsConnecting(true)
    setError(null)
    setConnectionStep('Creating conversation with Larry...')

    try {
      // Track session usage for free users
      const canUseSession = await trackSessionUsage()
      if (!canUseSession) {
        setError('Session limit reached. Please upgrade to premium for unlimited access.')
        setIsConnecting(false)
        return
      }

      const conversationPayload = {
        replica_id: TAVUS_REPLICA_ID,
        persona_id: TAVUS_PERSONA_ID,
        conversation_name: `Fitness Session with ${user?.email?.split('@')[0] || 'User'}`,
        properties: {
          participant_left_timeout: 300, // 5 minutes - longer than our 3-minute limit
          participant_absent_timeout: 300, // 5 minutes - longer than our 3-minute limit
          enable_recording: false,
          language: 'English',
          max_call_duration: 300 // 5 minutes - longer than our 3-minute limit
        }
      }

      console.log('🚀 Creating Tavus conversation with payload:', conversationPayload)

      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TAVUS_API_KEY
        },
        body: JSON.stringify(conversationPayload)
      })

      const responseText = await response.text()
      console.log('📞 Tavus API Response:', response.status, responseText)

      if (!response.ok) {
        let errorMessage = `Failed to create conversation: ${response.status} ${response.statusText}`
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          // Use the default error message if JSON parsing fails
        }
        throw new Error(errorMessage)
      }

      const data = JSON.parse(responseText)
      console.log('✅ Conversation created successfully:', data)
      
      setConnectionStep('Opening video session...')
      
      const newConversation = {
        conversation_id: data.conversation_id,
        conversation_url: data.conversation_url,
        status: 'active' as const
      }
      
      // Save to history and set as active conversation
      await saveConversationToHistory(newConversation)
      setActiveConversation(newConversation)
      setSessionStartTime(new Date())
      
      // Start the session and 3-minute timeout
      setSessionStarted(true)
      console.log('🎯 Session started - 3-minute timeout will be initialized')
      
      // Open in new tab
      window.open(data.conversation_url, '_blank', 'noopener,noreferrer')
      
      setConnectionStep('Session opened in new tab!')
      
      // Clear status after a few seconds
      setTimeout(() => {
        setConnectionStep('')
      }, 3000)
      
    } catch (err) {
      console.error('❌ Error starting conversation:', err)
      setError(err instanceof Error ? err.message : 'Failed to start conversation with AI Coach')
      setConnectionStep('')
    } finally {
      setIsConnecting(false)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown duration'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'ended':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      case 'ended':
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />
    }
  }

  // Format subscription plan name for display
  const formatPlanName = (planType: string) => {
    switch (planType) {
      case 'free':
        return 'Free Plan'
      case 'monthly':
        return 'Monthly Premium'
      case 'yearly':
        return 'Yearly Premium'
      default:
        return 'Unknown Plan'
    }
  }

  if (!isTavusConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Bot className="w-7 h-7 text-purple-600" />
              <span>AI Fitness Coach</span>
            </h2>
            <p className="text-gray-600 mt-1">Meet Larry - Your Virtual Fitness Tutor</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-12">
          <div className="text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Configuration Required</h3>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-6">
              To use the AI Coach feature, please configure your Tavus API credentials in the environment variables:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto overflow-x-auto">
              <code className="text-xs sm:text-sm text-gray-800">
                VITE_TAVUS_API_KEY=your_api_key<br/>
                VITE_TAVUS_PERSONA_ID=your_persona_id<br/>
                VITE_TAVUS_REPLICA_ID=your_tavus_replica_id
              </code>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Bot className="w-7 h-7 text-purple-600" />
            <span>AI Fitness Coach</span>
            {!hasPremiumAccess && <Lock className="w-5 h-5 text-gray-400" />}
          </h2>
          <p className="text-gray-600 mt-1">
            Meet Larry - Your Virtual Fitness Tutor
            {!hasPremiumAccess && (
              <span className="ml-2 text-orange-600 font-medium">
                (Premium Feature)
              </span>
            )}
          </p>
        </div>
        
        {/* End Conversation Button - Only show when there's an active conversation */}
        {activeConversation && sessionStarted && (
          <button
            onClick={() => handleEndSession('manual')}
            disabled={isEndingConversation}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl self-start"
          >
            {isEndingConversation ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ending...</span>
              </>
            ) : (
              <>
                <PhoneOff className="w-4 h-4" />
                <span>End Conversation</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Subscription Status Banner */}
      {subscription && (
        <div className={`p-4 rounded-lg border ${
          subscription.isWhitelisted 
            ? 'bg-purple-50 border-purple-200' 
            : subscription.planType === 'free' 
              ? 'bg-blue-50 border-blue-200'
              : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-3">
              {subscription.isWhitelisted ? (
                <Crown className="w-5 h-5 text-purple-600 flex-shrink-0" />
              ) : subscription.planType !== 'free' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
              )}
              
              <div>
                <span className="font-medium">
                  {subscription.isWhitelisted 
                    ? 'Whitelisted Access' 
                    : formatPlanName(subscription.planType)}
                </span>
                <span className="mx-2 text-gray-500">•</span>
                <span>
                  {subscription.isWhitelisted || subscription.planType !== 'free'
                    ? 'Unlimited AI sessions'
                    : `${subscription.sessionsRemaining} of 3 AI sessions remaining this month`}
                </span>
              </div>
            </div>
            
            {subscription.planType === 'free' && !subscription.isWhitelisted && (
              <button
                onClick={() => window.location.href = '/dashboard#premium'}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Upgrade
              </button>
            )}
          </div>
        </div>
      )}

      {/* Premium Access Required Notice */}
      {!hasPremiumAccess && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-6 sm:p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              {subscription?.planType === 'free' ? 'Monthly Limit Reached' : 'Premium Feature'}
            </h3>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-6">
              {subscription?.planType === 'free' 
                ? `You've used ${subscription.sessionsUsed} of 3 free AI video chat sessions this month. Upgrade to premium for unlimited access to Larry AI Coach.`
                : 'Larry AI Coach is available to premium subscribers. Upgrade your plan to get unlimited access to personalized AI fitness coaching.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => window.location.href = '/dashboard#premium'}
                className="inline-flex items-center space-x-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-base sm:text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
              >
                <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Upgrade to Premium</span>
              </button>
              <div className="text-sm text-gray-600">
                {subscription?.isWhitelisted ? (
                  <span className="text-green-600 font-medium">
                    ✓ You have whitelisted access
                  </span>
                ) : subscription?.planType === 'free' ? (
                  <span>
                    Free plan: {subscription.sessionsRemaining} sessions remaining this month
                  </span>
                ) : (
                  <span>
                    Current plan: {subscription?.planType || 'Free'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Session Status */}
      {activeConversation && sessionStarted && hasPremiumAccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
            <div>
              <h4 className="font-medium text-green-800">Active Session with Larry</h4>
              <p className="text-green-600 text-sm">
                Session started {sessionStartTime ? format(sessionStartTime, 'h:mm a') : 'recently'}
                {timeRemaining !== null && (
                  <span className="ml-2 font-medium">
                    • Time remaining: {formatTimeRemaining(timeRemaining)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="text-green-600 text-sm">
            Running in new tab
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('new')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
            activeTab === 'new' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>New Session</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
            activeTab === 'history' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'
          }`}
        >
          <History className="w-4 h-4" />
          <span>History ({conversationHistory.length})</span>
        </button>
      </div>

      {/* Connection Status */}
      {connectionStep && activeTab === 'new' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800">Status</h4>
            <p className="text-blue-600 text-sm">{connectionStep}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && activeTab === 'new' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-red-800">Connection Error</h4>
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {activeTab === 'new' ? (
        /* Talk to Your AI Coach Card */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
          {/* Header with Larry's Info */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 sm:p-8 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Larry's Avatar */}
              <div className="relative mx-auto sm:mx-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <div className="text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Talk to Your AI Coach – Larry</h3>
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                  Your personalized fitness coach, Larry, is ready to guide you. Click below to launch your video session in a new browser tab.
                </p>
              </div>
            </div>
          </div>

          {/* Main Action Area */}
          <div className="p-6 sm:p-8">
            <div className="text-center space-y-6">
              {/* Subscription Status Banner */}
              <div className={`p-4 rounded-lg ${
                subscription?.isWhitelisted 
                  ? 'bg-purple-100 border border-purple-200' 
                  : subscription?.planType === 'free' 
                    ? 'bg-blue-100 border border-blue-200'
                    : 'bg-green-100 border border-green-200'
              }`}>
                <div className="flex items-center justify-center space-x-2">
                  {subscription?.isWhitelisted ? (
                    <Crown className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  ) : subscription?.planType !== 'free' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                  
                  <span className="font-medium text-sm sm:text-base">
                    {subscription?.isWhitelisted 
                      ? 'Whitelisted Access: Unlimited AI sessions' 
                      : subscription?.planType !== 'free'
                        ? `${formatPlanName(subscription?.planType || 'free')}: Unlimited AI sessions`
                        : `${formatPlanName(subscription?.planType || 'free')}: ${subscription?.sessionsUsed || 0} of 3 AI sessions used this month (${subscription?.sessionsRemaining || 0} remaining)`}
                  </span>
                </div>
              </div>

              {/* Start Session Button */}
              <button
                onClick={startConversation}
                disabled={isConnecting || (activeConversation && sessionStarted) || !hasPremiumAccess}
                className="inline-flex items-center space-x-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-base sm:text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (activeConversation && sessionStarted) ? (
                  <>
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>Session Active</span>
                  </>
                ) : !hasPremiumAccess ? (
                  <>
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>Premium Required</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Start Session with Larry</span>
                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>

              {/* Info Message */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-600 text-xs sm:text-sm flex items-center justify-center space-x-2">
                  <Video className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span>This will open a new secure tab powered by Tavus. No downloads required.</span>
                </p>
              </div>

              {/* Session Timeout Info */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-yellow-800 text-xs sm:text-sm flex items-center justify-center space-x-2">
                  <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <span>All sessions automatically end after 3 minutes</span>
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Personalized Guidance</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">Get tailored workout advice based on your fitness level and goals</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Goal-Oriented Training</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">Receive specific recommendations to reach your fitness objectives</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Progress Tracking</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">Discuss your progress and get motivation to keep going</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Conversation History */
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <History className="w-5 h-5 text-gray-500" />
              <span>Conversation History</span>
            </h3>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500 hidden sm:inline">
                {conversationHistory.length} conversation{conversationHistory.length !== 1 ? 's' : ''}
              </span>
              
              {/* Subscription Status Badge */}
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                subscription?.isWhitelisted 
                  ? 'bg-purple-100 text-purple-800' 
                  : subscription?.planType !== 'free' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
              }`}>
                {subscription?.isWhitelisted 
                  ? 'Whitelisted' 
                  : subscription?.planType !== 'free'
                    ? formatPlanName(subscription?.planType || 'free')
                    : `${subscription?.sessionsRemaining || 0} of 3 sessions remaining`}
              </div>
            </div>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : conversationHistory.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h4>
              <p className="text-gray-600 mb-6">
                Start your first conversation with Larry to see your history here.
              </p>
              {hasPremiumAccess ? (
                <button
                  onClick={() => setActiveTab('new')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  Start First Session
                </button>
              ) : (
                <button
                  onClick={() => window.location.href = '/dashboard#premium'}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  Upgrade to Premium
                </button>
              )}
            </div>
          ) : (
            /* Conversation Cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {conversationHistory.map((conv) => (
                <div
                  key={conv.id}
                  className="relative bg-white border-2 border-gray-200 hover:border-gray-300 rounded-xl p-4 transition-all duration-200 hover:shadow-md"
                >
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(conv.status)}`}>
                      {getStatusIcon(conv.status)}
                      <span className="capitalize">{conv.status}</span>
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => setShowDeleteConfirm(conv.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>{format(new Date(conv.started_at), 'MMM d, yyyy')}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{format(new Date(conv.started_at), 'h:mm a')}</span>
                    {conv.ended_at && (
                      <span className="text-gray-400">
                        • {formatDuration(conv.duration_seconds)}
                      </span>
                    )}
                  </div>

                  {/* End Reason */}
                  {conv.end_reason && (
                    <div className="text-xs text-gray-500 italic mb-2 line-clamp-2">
                      "{conv.end_reason}"
                    </div>
                  )}

                  {/* Action Text */}
                  {conv.status === 'active' && (
                    <div className="text-sm text-green-600 font-medium">
                      Session may still be active
                    </div>
                  )}
                  
                  {conv.status === 'ended' && !conv.end_reason && (
                    <div className="text-sm text-gray-500">
                      Session completed
                    </div>
                  )}
                  
                  {conv.status === 'error' && (
                    <div className="text-sm text-red-600">
                      Session ended with error
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Conversation</h3>
                <p className="text-gray-600 text-sm">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this conversation from your history?
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="w-full sm:flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConversationFromHistory(showDeleteConfirm)}
                className="w-full sm:flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      {activeTab === 'new' && hasPremiumAccess && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-4 sm:p-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <Bot className="w-5 h-5 text-blue-600" />
            <span>Tips for your session with Larry</span>
          </h4>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Make sure your microphone and camera are enabled for the best experience</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Be ready with specific questions about your fitness goals and challenges</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Larry can help with workout tips, form checks, nutrition advice, and motivation</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Sessions open in a new tab for the best video calling experience</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Sessions automatically end after 3 minutes</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>No downloads or installations required - everything runs in your browser</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default AICoachSection