export interface WorkoutPlan {
  id: string
  title: string
  goal: 'weight_loss' | 'muscle_building' | 'endurance' | 'strength'
  duration: number // in weeks
  intensity: 'beginner' | 'intermediate' | 'advanced'
  exercises: Exercise[]
  description: string
  estimatedTime: number // in minutes
  equipment: string[]
  createdAt: string
}

export interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  restTime: number
  instructions: string
  muscleGroups: string[]
}

export interface UserActivePlan {
  id: string
  userId: string
  planId: string
  startDate: string
  completedDays: string[]
  currentWeek: number
  progress: number
}

export interface NutritionLog {
  id: string
  userId: string
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foodName: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
  portion: string
  time: string
  createdAt: string
}

export interface WorkoutLog {
  id: string
  userId: string
  planId?: string
  exerciseId?: string
  date: string
  duration: number
  caloriesBurned: number
  notes?: string
  completed: boolean
  createdAt: string
}

export interface UserScheduleEdit {
  id: string
  userId: string
  oldDate: string
  newDate: string
  type: 'workout' | 'meal'
  refId: string
  createdAt: string
}

export interface ProgressData {
  weeklyWorkouts: { week: string; completed: number; planned: number }[]
  dailyCalories: { date: string; calories: number; goal: number }[]
  weightTracking: { date: string; weight: number }[]
  currentStreak: number
  achievements: Achievement[]
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: string
  category: 'workout' | 'nutrition' | 'streak' | 'goal'
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  type: 'workout' | 'meal'
  status: 'scheduled' | 'completed' | 'missed'
  color: string
}

export interface DashboardFilters {
  goal?: string
  duration?: string
  intensity?: string
  dateRange?: { start: string; end: string }
}