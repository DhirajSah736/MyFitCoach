import React, { useState, useEffect } from 'react'
import { 
  Crown, 
  Check, 
  Video, 
  Zap, 
  Star, 
  Users, 
  Shield, 
  Clock,
  TrendingUp,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  XCircle
} from 'lucide-react'
import { useSubscription } from '../../hooks/useSubscription'
import { supabase } from '../../lib/supabase'

const PremiumSection: React.FC = () => {
  const { 
    subscription, 
    loading: subscriptionLoading, 
    verifySubscription, 
    cancelMembership, 
    reactivateMembership 
  } = useSubscription()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [showCouponInput, setShowCouponInput] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Check for successful payment on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const sessionId = urlParams.get('session_id')
    
    if (sessionId) {
      console.log('Found session ID in URL, verifying payment:', sessionId);
      handlePaymentSuccess(sessionId)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handlePaymentSuccess = async (sessionId: string) => {
    try {
      setLoading(true)
      console.log('Verifying payment with session ID:', sessionId);
      const result = await verifySubscription(sessionId)
      console.log('Payment verification result:', result);
      setSuccess('Payment successful! Your premium subscription is now active.')
    } catch (err) {
      console.error('Error verifying payment:', err)
      setError('Failed to verify payment. Please contact support.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planType: 'monthly' | 'yearly') => {
    try {
      setLoading(true)
      setError(null)

      // Price IDs - Replace with your actual Stripe price IDs
      const priceIds = {
        monthly: 'price_1RewqsPIF5sinMPIu2dMi4U4', // Replace with actual price ID
        yearly: 'price_1RewqtPIF5sinMPIAxZbYUzx'    // Replace with actual price ID
      }

      const priceId = priceIds[planType]

      const requestBody: any = { priceId }
      
      if (couponCode.trim()) {
        requestBody.couponCode = couponCode.trim().toUpperCase()
      }

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: requestBody
      })

      if (error) throw error

      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err) {
      console.error('Error creating checkout session:', err)
      setError(err instanceof Error ? err.message : 'Failed to start checkout process')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelMembership = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await cancelMembership()
      setSuccess(result.message)
      setShowCancelConfirm(false)
    } catch (err) {
      console.error('Error canceling membership:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel membership')
    } finally {
      setLoading(false)
    }
  }

  const handleReactivateMembership = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await reactivateMembership()
      setSuccess(result.message)
    } catch (err) {
      console.error('Error reactivating membership:', err)
      setError(err instanceof Error ? err.message : 'Failed to reactivate membership')
    } finally {
      setLoading(false)
    }
  }

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: '',
      description: 'Get started with basic AI coaching',
      color: subscription?.planType === 'free' 
        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' 
        : 'border-gray-200 bg-white',
      buttonColor: 'bg-gray-600 hover:bg-gray-700',
      buttonText: subscription?.planType === 'free' ? 'Current Plan' : 'Downgrade',
      popular: false,
      badge: subscription?.planType === 'free' ? 'Current' : null,
      aiVideoChat: '3 AI Video Chat sessions per month',
      disabled: subscription?.planType === 'free'
    },
    {
      id: 'monthly',
      name: 'Monthly',
      price: 10,
      period: '/month',
      description: 'Perfect for consistent training',
      color: subscription?.planType === 'monthly' 
        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
        : 'border-purple-500 bg-purple-50',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      buttonText: subscription?.planType === 'monthly' ? 'Current Plan' : 'Upgrade Now',
      popular: true,
      badge: subscription?.planType === 'monthly' ? 'Current' : 'Most Popular',
      aiVideoChat: 'Unlimited AI Video Chat with Larry',
      disabled: subscription?.planType === 'monthly'
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: 96,
      period: '/year',
      description: 'Best value for serious athletes',
      color: subscription?.planType === 'yearly'
        ? 'border-green-500 bg-green-50 ring-2 ring-green-500'
        : 'border-green-500 bg-green-50',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      buttonText: subscription?.planType === 'yearly' ? 'Current Plan' : 'Upgrade Now',
      popular: false,
      badge: subscription?.planType === 'yearly' ? 'Current' : 'Save 20%',
      aiVideoChat: 'Unlimited AI Video Chat with Larry',
      savings: 'Save $24/year compared to monthly',
      disabled: subscription?.planType === 'yearly'
    }
  ]

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full border border-purple-200">
          <Crown className="w-5 h-5 text-purple-600" />
          <span className="text-purple-700 font-medium text-sm">
            {subscription?.isWhitelisted ? 'Premium Access Granted' : 'Unlock AI-Powered Coaching'}
          </span>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Train with
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500 ml-3">
              Larry AI Coach
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get personalized fitness coaching through AI-powered video sessions. 
            Larry adapts to your goals and provides real-time guidance.
          </p>
        </div>

        {/* Current Subscription Status */}
        {subscription && (
          <div className="max-w-md mx-auto">
            <div className={`p-4 rounded-xl border-2 ${
              subscription.hasPremiumAccess 
                ? 'border-green-500 bg-green-50' 
                : 'border-yellow-500 bg-yellow-50'
            }`}>
              <div className="flex items-center justify-center space-x-2 mb-2">
                {subscription.hasPremiumAccess ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-600" />
                )}
                <span className={`font-semibold ${
                  subscription.hasPremiumAccess ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {subscription.isWhitelisted 
                    ? 'Premium Access (Whitelisted)' 
                    : `Current Plan: ${subscription.planType.charAt(0).toUpperCase() + subscription.planType.slice(1)}`
                  }
                </span>
              </div>
              {subscription.currentPeriodEnd && subscription.planType !== 'free' && (
                <p className="text-sm text-gray-600">
                  {subscription.cancelAtPeriodEnd ? 'Expires' : 'Renews'} on{' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
              {subscription.isWhitelisted && (
                <p className="text-sm text-green-700 mt-1">
                  You have unlimited access to all premium features
                </p>
              )}
              {subscription.planType === 'free' && !subscription.isWhitelisted && (
                <p className="text-sm text-gray-600 mt-1">
                  {subscription.sessionsRemaining} of 3 AI sessions remaining this month
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="max-w-md mx-auto p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-green-700 text-sm">{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-600 hover:text-green-700 text-xs underline mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="max-w-md mx-auto p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-700 text-xs underline mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Cancel Membership Section */}
      {subscription && subscription.planType !== 'free' && !subscription.isWhitelisted && (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Manage Subscription</h3>
            {subscription.cancelAtPeriodEnd ? (
              <div className="space-y-4">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    Your subscription will be canceled at the end of the current billing period.
                  </p>
                </div>
                <button
                  onClick={handleReactivateMembership}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'Processing...' : 'Reactivate Subscription'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={loading}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Membership</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Coupon Code Input */}
      {showCouponInput && (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Apply Coupon Code</h3>
              <button
                onClick={() => {
                  setShowCouponInput(false)
                  setCouponCode('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code (e.g., FREE100, HALFOFF, SAVE30)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="text-xs text-gray-500">
                Available codes: FREE100 (100% off), HALFOFF (50% off), SAVE30 (30% off)
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCouponInput(false)
                    setCouponCode('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedPlan) {
                      handleUpgrade(selectedPlan)
                    }
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'Processing...' : 'Apply & Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border-2 p-8 transition-all duration-300 hover:shadow-xl ${plan.color} ${
              plan.popular && !plan.disabled ? 'scale-105 shadow-lg' : 'hover:scale-105'
            } ${plan.disabled ? 'opacity-75' : ''}`}
          >
            {/* Badge */}
            {plan.badge && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className={`inline-flex items-center space-x-1 px-4 py-2 rounded-full text-sm font-medium shadow-lg ${
                  plan.disabled
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                    : plan.popular 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                }`}>
                  {plan.disabled ? <CheckCircle className="w-4 h-4" /> : plan.popular ? <Star className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  <span>{plan.badge}</span>
                </div>
              </div>
            )}

            {/* Plan Header */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-6">{plan.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-baseline justify-center space-x-1">
                  <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-500 text-lg">{plan.period}</span>
                  )}
                </div>
                
                {plan.savings && (
                  <div className="text-green-600 text-sm font-medium">
                    {plan.savings}
                  </div>
                )}
              </div>
            </div>

            {/* AI Video Chat Feature */}
            <div className="mb-8">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">AI Video Chat</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {plan.aiVideoChat}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                if (plan.id === 'monthly' || plan.id === 'yearly') {
                  setSelectedPlan(plan.id)
                  if (!showCouponInput) {
                    setShowCouponInput(true)
                  } else {
                    handleUpgrade(plan.id)
                  }
                }
              }}
              disabled={plan.disabled || loading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl ${plan.buttonColor} ${
                plan.disabled ? 'opacity-50 cursor-not-allowed' : ''
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading && selectedPlan === plan.id ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                plan.buttonText
              )}
            </button>

            {/* Additional Info for Free Plan */}
            {plan.id === 'free' && !plan.disabled && (
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  No credit card required
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Coupon Code Button */}
      {!showCouponInput && !subscription?.isWhitelisted && (
        <div className="text-center">
          <button
            onClick={() => setShowCouponInput(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
          >
            <Sparkles className="w-4 h-4" />
            <span>Have a coupon code?</span>
          </button>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cancel Membership</h3>
                <p className="text-gray-600 text-sm">Your subscription will remain active until the end of the current billing period.</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to cancel your membership? You'll lose access to unlimited AI coaching sessions.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelMembership}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'Processing...' : 'Cancel Membership'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Highlight */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 md:p-12 text-center text-white">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto">
            <Video className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Meet Larry, Your AI Fitness Coach
          </h2>
          <p className="text-xl text-purple-100 leading-relaxed">
            Experience personalized coaching through live video sessions. Larry provides real-time form corrections, 
            motivation, and adapts workouts to your fitness level and goals.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold mb-2">Real-time Guidance</h4>
              <p className="text-sm text-purple-100">Get instant feedback on your form and technique</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold mb-2">Personalized Plans</h4>
              <p className="text-sm text-purple-100">Workouts adapted to your goals and fitness level</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold mb-2">Progress Tracking</h4>
              <p className="text-sm text-purple-100">Monitor your improvements with detailed analytics</p>
            </div>
          </div>
          {!subscription?.hasPremiumAccess && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
              <button 
                onClick={() => setShowCouponInput(true)}
                className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Video className="w-6 h-6" />
                <span>Try Larry for Free</span>
              </button>
              <div className="flex items-center space-x-4 text-purple-100">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">3 free sessions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">No commitment</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-gray-50 rounded-2xl p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Trusted by Fitness Enthusiasts</h3>
          <p className="text-gray-600">Join thousands who have transformed their fitness with Larry</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-3">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="text-3xl font-bold text-gray-900">50,000+</h4>
            <p className="text-gray-600">Active Users</p>
          </div>
          <div className="space-y-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-3xl font-bold text-gray-900">95%</h4>
            <p className="text-gray-600">Success Rate</p>
          </div>
          <div className="space-y-3">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Star className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-3xl font-bold text-gray-900">4.9/5</h4>
            <p className="text-gray-600">User Rating</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PremiumSection