export interface SubscriptionDetails {
  planType: 'free' | 'monthly' | 'yearly'
  status: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
  isWhitelisted: boolean
  hasPremiumAccess: boolean
  sessionsUsed: number
  sessionsRemaining: number
}

export interface CancelMembershipResponse {
  success: boolean
  message?: string
  error?: string
  currentPeriodEnd?: string
}

export interface ReactivateMembershipResponse {
  success: boolean
  message?: string
  error?: string
}

export interface VerifySubscriptionResponse {
  success: boolean
  planType?: 'monthly' | 'yearly'
  status?: string
  error?: string
}