import { OnboardingData, UserProfile } from '../types/onboarding'

export function calculateBMR(gender: string, weight: number, height: number, age: number): number {
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    // For female and other
    return 10 * weight + 6.25 * height - 5 * age - 161
  }
}

export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    active: 1.55,
    very_active: 1.725
  }
  
  return bmr * (multipliers[activityLevel as keyof typeof multipliers] || 1.2)
}

export function calculateCalorieGoal(tdee: number, goal: string): number {
  switch (goal) {
    case 'fat_loss':
      return tdee - 500
    case 'muscle_gain':
    case 'strength_gain':
      return tdee + 250
    case 'maintenance':
    default:
      return tdee
  }
}

export function calculateMacros(calorieGoal: number, goal: string) {
  let proteinPercent: number
  let carbsPercent: number
  let fatPercent: number

  switch (goal) {
    case 'fat_loss':
      proteinPercent = 0.40
      carbsPercent = 0.30
      fatPercent = 0.30
      break
    case 'muscle_gain':
      proteinPercent = 0.30
      carbsPercent = 0.40
      fatPercent = 0.30
      break
    case 'strength_gain':
      proteinPercent = 0.35
      carbsPercent = 0.35
      fatPercent = 0.30
      break
    case 'maintenance':
    default:
      proteinPercent = 0.30
      carbsPercent = 0.40
      fatPercent = 0.30
      break
  }

  const proteinCalories = calorieGoal * proteinPercent
  const carbsCalories = calorieGoal * carbsPercent
  const fatCalories = calorieGoal * fatPercent

  return {
    protein_grams: Math.round(proteinCalories / 4), // 4 calories per gram
    carbs_grams: Math.round(carbsCalories / 4), // 4 calories per gram
    fat_grams: Math.round(fatCalories / 9) // 9 calories per gram
  }
}

export function processOnboardingData(data: OnboardingData, userId: string): UserProfile {
  if (!data.gender || !data.age || !data.height_cm || !data.weight_kg || 
      !data.activity_level || !data.goal || !data.preferred_diet || 
      data.workout_days_per_week === undefined) {
    throw new Error('Missing required onboarding data')
  }

  const bmr = calculateBMR(data.gender, data.weight_kg, data.height_cm, data.age)
  const tdee = calculateTDEE(bmr, data.activity_level)
  const calorieGoal = calculateCalorieGoal(tdee, data.goal)
  const macros = calculateMacros(calorieGoal, data.goal)

  return {
    user_id: userId,
    gender: data.gender,
    age: data.age,
    height_cm: data.height_cm,
    weight_kg: data.weight_kg,
    activity_level: data.activity_level,
    goal: data.goal,
    preferred_diet: data.preferred_diet,
    health_notes: data.health_notes || '',
    workout_days_per_week: data.workout_days_per_week,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorie_goal: Math.round(calorieGoal),
    protein_grams: macros.protein_grams,
    carbs_grams: macros.carbs_grams,
    fat_grams: macros.fat_grams
  }
}