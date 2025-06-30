import React from 'react'
import { User, Calendar, Ruler, Weight, Activity, Target, Apple, Heart, Dumbbell } from 'lucide-react'
import { OnboardingStepProps } from '../../types/onboarding'

// Step 1: Gender Selection
export const GenderStep: React.FC<OnboardingStepProps> = ({ value, onChange, onNext, isValid }) => {
  const genderOptions = [
    { value: 'male', label: 'Male', icon: User },
    { value: 'female', label: 'Female', icon: User },
    { value: 'other', label: 'Other', icon: User }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-[#4CAF50]" />
        </div>
        <h2 className="text-2xl font-semibold text-[#212121] mb-2">What's your gender?</h2>
        <p className="text-[#757575]">This helps us calculate your metabolic rate accurately</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {genderOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`p-4 md:p-6 rounded-xl border-2 transition-all duration-300 ease-in-out flex items-center space-x-4 focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:ring-opacity-50 touch-target ${
              value === option.value
                ? 'border-[#4CAF50] bg-[#E8F5E9] text-[#4CAF50] shadow-md transform scale-[1.02]'
                : 'border-gray-200 hover:border-gray-300 text-[#757575] hover:bg-gray-50'
            }`}
            aria-pressed={value === option.value}
          >
            <option.icon className="w-5 h-5 md:w-6 md:h-6" />
            <span className="font-medium text-base md:text-lg">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Step 2: Age Input
export const AgeStep: React.FC<OnboardingStepProps> = ({ value, onChange, onNext, isValid }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#E3F2FD] rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-[#2196F3]" />
        </div>
        <h2 className="text-2xl font-semibold text-[#212121] mb-2">How old are you?</h2>
        <p className="text-[#757575]">Age is important for calculating your daily calorie needs</p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseInt(e.target.value) || undefined)}
            placeholder="Enter your age"
            min="13"
            max="100"
            className="w-full px-6 py-4 text-xl text-center border-2 border-gray-200 rounded-xl focus:border-[#2196F3] focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:ring-opacity-50 transition-all duration-300 ease-in-out"
            aria-label="Your age in years"
          />
          <span className="absolute right-6 top-1/2 transform -translate-y-1/2 text-[#757575]">years</span>
        </div>
        <p className="text-sm text-[#757575] text-center">Must be between 13-100 years</p>
      </div>
    </div>
  )
}

// Step 3: Height Input
export const HeightStep: React.FC<OnboardingStepProps> = ({ value, onChange, onNext, isValid }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-4">
          <Ruler className="w-8 h-8 text-[#4CAF50]" />
        </div>
        <h2 className="text-2xl font-semibold text-[#212121] mb-2">What's your height?</h2>
        <p className="text-[#757575]">We'll use this to calculate your BMI and calorie needs</p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseInt(e.target.value) || undefined)}
            placeholder="Enter your height"
            min="100"
            max="250"
            className="w-full px-6 py-4 text-xl text-center border-2 border-gray-200 rounded-xl focus:border-[#4CAF50] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:ring-opacity-50 transition-all duration-300 ease-in-out"
            aria-label="Your height in centimeters"
          />
          <span className="absolute right-6 top-1/2 transform -translate-y-1/2 text-[#757575]">cm</span>
        </div>
        <p className="text-sm text-[#757575] text-center">Must be between 100-250 cm</p>
      </div>
    </div>
  )
}

// Step 4: Weight Input
export const WeightStep: React.FC<OnboardingStepProps> = ({ value, onChange, onNext, isValid }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#FFF3E0] rounded-full flex items-center justify-center mx-auto mb-4">
          <Weight className="w-8 h-8 text-[#FF9800]" />
        </div>
        <h2 className="text-2xl font-semibold text-[#212121] mb-2">What's your current weight?</h2>
        <p className="text-[#757575]">This helps us create your personalized nutrition plan</p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || undefined)}
            placeholder="Enter your weight"
            min="30"
            max="300"
            step="0.1"
            className="w-full px-6 py-4 text-xl text-center border-2 border-gray-200 rounded-xl focus:border-[#FF9800] focus:outline-none focus:ring-2 focus:ring-[#FF9800] focus:ring-opacity-50 transition-all duration-300 ease-in-out"
            aria-label="Your weight in kilograms"
          />
          <span className="absolute right-6 top-1/2 transform -translate-y-1/2 text-[#757575]">kg</span>
        </div>
        <p className="text-sm text-[#757575] text-center">Must be between 30-300 kg</p>
      </div>
    </div>
  )
}

// Step 5: Activity Level
export const ActivityLevelStep: React.FC<OnboardingStepProps> = ({ value, onChange, onNext, isValid }) => {
  const activityOptions = [
    {
      value: 'sedentary',
      label: 'Sedentary',
      description: 'Little to no exercise, desk job',
      multiplier: '1.2x'
    },
    {
      value: 'lightly_active',
      label: 'Lightly Active',
      description: 'Light exercise 1-3 days/week',
      multiplier: '1.375x'
    },
    {
      value: 'active',
      label: 'Active',
      description: 'Moderate exercise 3-5 days/week',
      multiplier: '1.55x'
    },
    {
      value: 'very_active',
      label: 'Very Active',
      description: 'Heavy exercise 6-7 days/week',
      multiplier: '1.725x'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#FFEBEE] rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-[#F44336]" />
        </div>
        <h2 className="text-2xl font-semibold text-[#212121] mb-2">What's your activity level?</h2>
        <p className="text-[#757575]">This determines your daily calorie expenditure</p>
      </div>

      <div className="space-y-3">
        {activityOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full p-4 md:p-6 rounded-xl border-2 transition-all duration-300 ease-in-out text-left focus:outline-none focus:ring-2 focus:ring-[#F44336] focus:ring-opacity-50 touch-target ${
              value === option.value
                ? 'border-[#F44336] bg-[#FFEBEE] shadow-md transform scale-[1.02]'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            aria-pressed={value === option.value}
          >
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <h3 className="font-semibold text-base md:text-lg text-[#212121]">{option.label}</h3>
              <span className="text-xs md:text-sm font-medium text-[#F44336] bg-[#FFEBEE] px-2 py-1 rounded-full">{option.multiplier}</span>
            </div>
            <p className="text-[#757575] text-sm">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// Step 6: Fitness Goal
export const FitnessGoalStep: React.FC<OnboardingStepProps> = ({ value, onChange, onNext, isValid }) => {
  const goalOptions = [
    {
      value: 'fat_loss',
      label: 'Fat Loss',
      description: 'Lose weight and reduce body fat',
      icon: Target,
      color: 'text-[#F44336] bg-[#FFEBEE]'
    },
    {
      value: 'muscle_gain',
      label: 'Muscle Gain',
      description: 'Build lean muscle mass',
      icon: Dumbbell,
      color: 'text-[#673AB7] bg-[#EDE7F6]'
    },
    {
      value: 'maintenance',
      label: 'Maintenance',
      description: 'Maintain current weight and fitness',
      icon: Target,
      color: 'text-[#2196F3] bg-[#E3F2FD]'
    },
    {
      value: 'strength_gain',
      label: 'Strength Gain',
      description: 'Increase overall strength and power',
      icon: Dumbbell,
      color: 'text-[#FF9800] bg-[#FFF3E0]'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#EDE7F6] rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-[#673AB7]" />
        </div>
        <h2 className="text-2xl font-semibold text-[#212121] mb-2">What's your fitness goal?</h2>
        <p className="text-[#757575]">This will determine your calorie and macro targets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {goalOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`p-4 md:p-6 rounded-xl border-2 transition-all duration-300 ease-in-out text-left focus:outline-none focus:ring-2 focus:ring-[#673AB7] focus:ring-opacity-50 touch-target ${
              value === option.value
                ? 'border-[#673AB7] bg-[#EDE7F6] shadow-md transform scale-[1.02]'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            aria-pressed={value === option.value}
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-3 md:mb-4 ${option.color}`}>
              <option.icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h3 className="font-semibold text-base md:text-lg text-[#212121] mb-1 md:mb-2">{option.label}</h3>
            <p className="text-[#757575] text-xs md:text-sm">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// Step 7: Preferred Diet
export const PreferredDietStep: React.FC<OnboardingStepProps> = ({ value, onChange, onNext, isValid }) => {
  const dietOptions = [
    { value: 'veg', label: 'Vegetarian', description: 'Plant-based with dairy and eggs' },
    { value: 'non_veg', label: 'Non-Vegetarian', description: 'Includes all food types' },
    { value: 'vegan', label: 'Vegan', description: 'Strictly plant-based' },
    { value: 'keto', label: 'Keto', description: 'High fat, low carb diet' },
    { value: 'paleo', label: 'Paleo', description: 'Whole foods, no processed items' }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-4">
          <Apple className="w-8 h-8 text-[#4CAF50]" />
        </div>
        <h2 className="text-2xl font-semibold text-[#212121] mb-2">What's your preferred diet?</h2>
        <p className="text-[#757575]">This helps us suggest appropriate meal plans</p>
      </div>

      <div className="space-y-3">
        {dietOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full p-4 md:p-6 rounded-xl border-2 transition-all duration-300 ease-in-out text-left focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:ring-opacity-50 touch-target ${
              value === option.value
                ? 'border-[#4CAF50] bg-[#E8F5E9] shadow-md transform scale-[1.02]'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            aria-pressed={value === option.value}
          >
            <h3 className="font-semibold text-base md:text-lg text-[#212121] mb-1">{option.label}</h3>
            <p className="text-[#757575] text-xs md:text-sm">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// Step 8: Health Conditions
export const HealthConditionsStep: React.FC<OnboardingStepProps> = ({ value, onChange, onNext }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#FFEBEE] rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-[#F44336]" />
        </div>
        <h2 className="text-2xl font-semibold text-[#212121] mb-2">Any health conditions or injuries?</h2>
        <p className="text-[#757575]">This is optional but helps us provide safer recommendations</p>
      </div>

      <div className="space-y-3">
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., Lower back pain, knee injury, diabetes, etc. (Optional)"
          rows={4}
          className="w-full px-4 py-3 md:px-6 md:py-4 border-2 border-gray-200 rounded-xl focus:border-[#F44336] focus:outline-none focus:ring-2 focus:ring-[#F44336] focus:ring-opacity-50 transition-all duration-300 ease-in-out resize-none"
          aria-label="Health conditions or injuries (optional)"
        />
        <p className="text-sm text-[#757575]">Leave blank if you have no health concerns</p>
      </div>
    </div>
  )
}

// Step 9: Workout Days
export const WorkoutDaysStep: React.FC<OnboardingStepProps> = ({ value, onChange, onNext, isValid }) => {
  const dayOptions = [1, 2, 3, 4, 5, 6, 7]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#E3F2FD] rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-[#2196F3]" />
        </div>
        <h2 className="text-2xl font-semibold text-[#212121] mb-2">How many days per week can you workout?</h2>
        <p className="text-[#757575]">Be realistic - consistency is more important than frequency</p>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3">
        {dayOptions.map((days) => (
          <button
            key={days}
            onClick={() => onChange(days)}
            className={`aspect-square p-2 md:p-4 rounded-xl border-2 transition-all duration-300 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#2196F3] focus:ring-opacity-50 touch-target ${
              value === days
                ? 'border-[#2196F3] bg-[#E3F2FD] text-[#2196F3] shadow-md transform scale-[1.02]'
                : 'border-gray-200 hover:border-gray-300 text-[#757575] hover:bg-gray-50'
            }`}
            aria-pressed={value === days}
            aria-label={`${days} day${days !== 1 ? 's' : ''} per week`}
          >
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold">{days}</div>
              <div className="text-xs">{days === 1 ? 'day' : 'days'}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}