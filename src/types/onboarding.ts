export interface UserProfile {
  id?: string
  user_id: string
  gender: 'male' | 'female' | 'other'
  age: number
  height_cm: number
  weight_kg: number
  activity_level: 'sedentary' | 'lightly_active' | 'active' | 'very_active'
  goal: 'fat_loss' | 'muscle_gain' | 'maintenance' | 'strength_gain'
  preferred_diet: 'veg' | 'non_veg' | 'vegan' | 'keto' | 'paleo'
  health_notes?: string
  workout_days_per_week: number
  bmr: number
  tdee: number
  calorie_goal: number
  protein_grams: number
  carbs_grams: number
  fat_grams: number
  created_at?: string
  updated_at?: string
}

export interface OnboardingStep {
  id: number
  title: string
  subtitle: string
  component: React.ComponentType<OnboardingStepProps>
}

export interface OnboardingStepProps {
  value: any
  onChange: (value: any) => void
  onNext: () => void
  onPrev: () => void
  isValid: boolean
}

export interface OnboardingData {
  gender?: 'male' | 'female' | 'other'
  age?: number
  height_cm?: number
  weight_kg?: number
  activity_level?: 'sedentary' | 'lightly_active' | 'active' | 'very_active'
  goal?: 'fat_loss' | 'muscle_gain' | 'maintenance' | 'strength_gain'
  preferred_diet?: 'veg' | 'non_veg' | 'vegan' | 'keto' | 'paleo'
  health_notes?: string
  workout_days_per_week?: number
}