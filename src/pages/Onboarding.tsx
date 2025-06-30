import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, Loader2, ArrowLeft, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { OnboardingData, OnboardingStep } from '../types/onboarding'
import { processOnboardingData } from '../utils/calculations'
import {
  GenderStep,
  AgeStep,
  HeightStep,
  WeightStep,
  ActivityLevelStep,
  FitnessGoalStep,
  PreferredDietStep,
  HealthConditionsStep,
  WorkoutDaysStep
} from '../components/onboarding/OnboardingSteps'

const Onboarding: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<OnboardingData>({})
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [animating, setAnimating] = useState(false)

  const steps: OnboardingStep[] = [
    { id: 1, title: 'Gender', subtitle: 'Personal Information', component: GenderStep },
    { id: 2, title: 'Age', subtitle: 'Personal Information', component: AgeStep },
    { id: 3, title: 'Height', subtitle: 'Physical Measurements', component: HeightStep },
    { id: 4, title: 'Weight', subtitle: 'Physical Measurements', component: WeightStep },
    { id: 5, title: 'Activity Level', subtitle: 'Lifestyle', component: ActivityLevelStep },
    { id: 6, title: 'Fitness Goal', subtitle: 'Objectives', component: FitnessGoalStep },
    { id: 7, title: 'Diet Preference', subtitle: 'Nutrition', component: PreferredDietStep },
    { id: 8, title: 'Health Notes', subtitle: 'Safety', component: HealthConditionsStep },
    { id: 9, title: 'Workout Days', subtitle: 'Schedule', component: WorkoutDaysStep }
  ]

  // Check if user already has a profile
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) return

      const { data: profiles } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (profiles && profiles.length > 0) {
        navigate('/dashboard')
      }
    }

    checkExistingProfile()
  }, [user, navigate])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isStepValid(currentStep)) {
        handleNext()
      } else if (e.key === 'ArrowRight' && isStepValid(currentStep)) {
        handleNext()
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        handlePrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, data])

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    
    if (isLeftSwipe && isStepValid(currentStep) && !animating) {
      handleNext()
    } else if (isRightSwipe && currentStep > 0 && !animating) {
      handlePrev()
    }
    
    setTouchStart(null)
    setTouchEnd(null)
  }

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const isStepValid = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: return !!data.gender
      case 1: return !!data.age && data.age >= 13 && data.age <= 100
      case 2: return !!data.height_cm && data.height_cm >= 100 && data.height_cm <= 250
      case 3: return !!data.weight_kg && data.weight_kg >= 30 && data.weight_kg <= 300
      case 4: return !!data.activity_level
      case 5: return !!data.goal
      case 6: return !!data.preferred_diet
      case 7: return true // Health notes are optional
      case 8: return !!data.workout_days_per_week && data.workout_days_per_week >= 1 && data.workout_days_per_week <= 7
      default: return false
    }
  }

  const handleNext = () => {
    if (animating) return
    
    if (currentStep < steps.length - 1) {
      setAnimating(true)
      setTimeout(() => {
        setCurrentStep(prev => prev + 1)
        setAnimating(false)
      }, 300)
    } else {
      handleSubmit()
    }
  }

  const handlePrev = () => {
    if (animating) return
    
    if (currentStep > 0) {
      setAnimating(true)
      setTimeout(() => {
        setCurrentStep(prev => prev - 1)
        setAnimating(false)
      }, 300)
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    setLoading(true)
    try {
      const profileData = processOnboardingData(data, user.id)
      
      const { error } = await supabase
        .from('user_profile')
        .insert([profileData])

      if (error) throw error

      navigate('/dashboard')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStepData = () => {
    const fieldMap = [
      'gender', 'age', 'height_cm', 'weight_kg', 'activity_level',
      'goal', 'preferred_diet', 'health_notes', 'workout_days_per_week'
    ]
    return data[fieldMap[currentStep] as keyof OnboardingData]
  }

  const setCurrentStepData = (value: any) => {
    const fieldMap = [
      'gender', 'age', 'height_cm', 'weight_kg', 'activity_level',
      'goal', 'preferred_diet', 'health_notes', 'workout_days_per_week'
    ]
    updateData(fieldMap[currentStep] as keyof OnboardingData, value)
  }

  const CurrentStepComponent = steps[currentStep].component

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#4CAF50]" />
          <p className="text-[#757575]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-[#F5F5F5] flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#212121]">Welcome to MyFitCoach!</h1>
              <p className="text-[#757575] mt-1">Let's personalize your fitness journey</p>
            </div>
            <div className="step-indicator text-sm text-[#757575] bg-[#F5F5F5] px-4 py-2 rounded-full flex items-center justify-center">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm text-[#757575] mb-2">
                <span>{steps[currentStep].subtitle}</span>
                <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-[#E0E0E0] rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-[#4CAF50] transition-all duration-500 ease-in-out"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="max-w-[1200px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between min-w-max space-x-4 md:space-x-6">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center transition-all duration-300 ease-in-out ${
                  index === currentStep
                    ? 'scale-105'
                    : ''
                }`}
                role="button"
                tabIndex={0}
                aria-label={`Step ${index + 1}: ${step.title}`}
                onClick={() => {
                  if (index < currentStep || isStepValid(currentStep)) {
                    setCurrentStep(index)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if (index < currentStep || isStepValid(currentStep)) {
                      setCurrentStep(index)
                    }
                  }
                }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold mb-2 transition-all duration-300 ease-in-out ${
                  index === currentStep
                    ? 'bg-[#2196F3] text-white shadow-md'
                    : index < currentStep
                    ? 'bg-[#4CAF50] text-white'
                    : 'bg-[#E0E0E0] text-[#757575]'
                }`}>
                  {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap transition-all duration-300 ease-in-out ${
                  index === currentStep
                    ? 'text-[#2196F3]'
                    : index < currentStep
                    ? 'text-[#4CAF50]'
                    : 'text-[#757575]'
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Flex-grow to push footer down */}
      <div className="flex-grow flex flex-col">
        {/* Scrollable container with padding for footer */}
        <div className="flex-grow overflow-y-auto py-8 pb-32 md:pb-28">
          <div className="max-w-2xl mx-auto px-6">
            <div 
              className={`bg-white rounded-xl shadow-md border border-gray-200 p-8 transition-opacity duration-300 ease-in-out ${
                animating ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <CurrentStepComponent
                value={getCurrentStepData()}
                onChange={setCurrentStepData}
                onNext={handleNext}
                onPrev={handlePrev}
                isValid={isStepValid(currentStep)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation - Fixed at bottom */}
      <div className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
        <div className="max-w-[1200px] mx-auto px-6 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-4 py-3 md:px-6 md:py-3 text-[#757575] hover:text-[#212121] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:ring-opacity-50 rounded-lg touch-target"
              aria-label="Previous step"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="hidden md:flex items-center space-x-2 text-sm text-[#757575]">
              <span>Press <kbd className="px-2 py-1 bg-[#F5F5F5] rounded-md border border-gray-300 text-xs">Enter</kbd> to continue</span>
            </div>

            <button
              onClick={handleNext}
              disabled={!isStepValid(currentStep) || loading}
              className="flex items-center space-x-2 px-4 py-3 md:px-6 md:py-3 bg-[#2196F3] text-white rounded-lg hover:bg-[#1976D2] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-102 focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:ring-opacity-50 shadow-sm touch-target"
              aria-label={currentStep === steps.length - 1 ? "Complete setup" : "Next step"}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : currentStep === steps.length - 1 ? (
                <>
                  <span>Complete Setup</span>
                  <Check className="w-5 h-5" />
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Onboarding