import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Award, 
  Target, 
  Calendar,
  Flame,
  Activity,
  BarChart3,
  Trophy,
  Zap,
  CheckCircle,
  Loader2,
  Users,
  Clock,
  Apple,
  Dumbbell
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns'

interface WorkoutLog {
  id: string
  user_id: string
  workout_type: string
  exercise_name: string
  sets?: number
  reps?: number
  duration_minutes?: number
  weight_kg?: number
  calories_burned: number
  date: string
  created_at: string
}

interface NutritionLog {
  id: string
  user_id: string
  date: string
  meal_type: string
  food_name: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
}

interface UserProfile {
  calorie_goal: number
  protein_grams: number
  carbs_grams: number
  fat_grams: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: string
  category: 'workout' | 'nutrition' | 'streak' | 'goal'
}

const ProgressAnalyticsSection: React.FC = () => {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week')
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [progressStats, setProgressStats] = useState({
    totalWorkouts: 0,
    caloriesBurned: 0,
    avgWorkoutTime: 0,
    completionRate: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalNutritionLogs: 0,
    avgDailyCalories: 0
  })

  // Chart data states
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<any[]>([])
  const [dailyCalories, setDailyCalories] = useState<any[]>([])
  const [workoutTypeDistribution, setWorkoutTypeDistribution] = useState<any[]>([])
  const [weeklyProgress, setWeeklyProgress] = useState<any[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('user_profile')
          .select('calorie_goal, protein_grams, carbs_grams, fat_grams')
          .eq('user_id', user.id)
          .single()

        if (error) throw error
        setUserProfile(data)
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    fetchUserProfile()
  }, [user])

  // Fetch workout and nutrition data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Calculate date range based on selected timeRange
        const endDate = new Date()
        let startDate: Date
        
        switch (timeRange) {
          case 'week':
            startDate = subDays(endDate, 7)
            break
          case 'month':
            startDate = subDays(endDate, 30)
            break
          case 'year':
            startDate = subDays(endDate, 365)
            break
          default:
            startDate = subDays(endDate, 7)
        }

        // Fetch workout logs
        const { data: workoutData, error: workoutError } = await supabase
          .from('user_workout_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'))
          .order('date', { ascending: true })

        if (workoutError) throw workoutError

        // Fetch nutrition logs
        const { data: nutritionData, error: nutritionError } = await supabase
          .from('nutrition_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'))
          .order('date', { ascending: true })

        if (nutritionError) throw nutritionError

        setWorkoutLogs(workoutData || [])
        setNutritionLogs(nutritionData || [])

        // Process data for charts and stats
        processWorkoutData(workoutData || [])
        processNutritionData(nutritionData || [])
        calculateProgressStats(workoutData || [], nutritionData || [])
        generateAchievements(workoutData || [], nutritionData || [])

      } catch (error) {
        console.error('Error fetching progress data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, timeRange])

  const processWorkoutData = (workouts: WorkoutLog[]) => {
    // Weekly workout completion
    const weeklyData = []
    const weeks = Math.ceil(workouts.length / 7) || 4
    
    for (let i = 0; i < weeks; i++) {
      const weekStart = subDays(new Date(), (weeks - i - 1) * 7)
      const weekEnd = subDays(new Date(), (weeks - i - 2) * 7)
      const weekWorkouts = workouts.filter(w => {
        const workoutDate = new Date(w.date)
        return workoutDate >= weekStart && workoutDate <= weekEnd
      })
      
      weeklyData.push({
        week: `Week ${i + 1}`,
        completed: weekWorkouts.length,
        planned: 5, // Assuming 5 planned workouts per week
        calories: weekWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0)
      })
    }
    setWeeklyWorkouts(weeklyData)

    // Workout type distribution
    const typeDistribution = workouts.reduce((acc, workout) => {
      const type = workout.workout_type
      const existing = acc.find(item => item.name === type)
      if (existing) {
        existing.value += 1
      } else {
        acc.push({ name: type, value: 1 })
      }
      return acc
    }, [] as any[])
    setWorkoutTypeDistribution(typeDistribution)

    // Weekly progress (last 7 days)
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dayWorkouts = workouts.filter(w => w.date === format(date, 'yyyy-MM-dd'))
      last7Days.push({
        date: format(date, 'EEE'),
        workouts: dayWorkouts.length,
        calories: dayWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0),
        duration: dayWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0)
      })
    }
    setWeeklyProgress(last7Days)
  }

  const processNutritionData = (nutrition: NutritionLog[]) => {
    // Daily calories for the last 7 days
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dayNutrition = nutrition.filter(n => n.date === format(date, 'yyyy-MM-dd'))
      const totalCalories = dayNutrition.reduce((sum, n) => sum + (n.calories || 0), 0)
      
      last7Days.push({
        date: format(date, 'EEE'),
        calories: totalCalories,
        goal: userProfile?.calorie_goal || 2200,
        protein: dayNutrition.reduce((sum, n) => sum + (n.protein || 0), 0),
        carbs: dayNutrition.reduce((sum, n) => sum + (n.carbs || 0), 0),
        fat: dayNutrition.reduce((sum, n) => sum + (n.fat || 0), 0)
      })
    }
    setDailyCalories(last7Days)
  }

  const calculateProgressStats = (workouts: WorkoutLog[], nutrition: NutritionLog[]) => {
    const totalWorkouts = workouts.length
    const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0)
    const totalDuration = workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0)
    const avgWorkoutTime = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0

    // Calculate streak
    const uniqueWorkoutDates = [...new Set(workouts.map(w => w.date))].sort().reverse()
    let currentStreak = 0
    const today = new Date()
    
    for (let i = 0; i < uniqueWorkoutDates.length; i++) {
      const workoutDate = new Date(uniqueWorkoutDates[i])
      const daysDiff = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === i) {
        currentStreak++
      } else {
        break
      }
    }

    // Calculate completion rate (assuming 5 workouts per week target)
    const weeksInRange = timeRange === 'week' ? 1 : timeRange === 'month' ? 4 : 52
    const targetWorkouts = weeksInRange * 5
    const completionRate = targetWorkouts > 0 ? Math.round((totalWorkouts / targetWorkouts) * 100) : 0

    // Nutrition stats
    const totalNutritionLogs = nutrition.length
    const totalCaloriesConsumed = nutrition.reduce((sum, n) => sum + (n.calories || 0), 0)
    const avgDailyCalories = totalNutritionLogs > 0 ? Math.round(totalCaloriesConsumed / Math.max(1, new Set(nutrition.map(n => n.date)).size)) : 0

    setProgressStats({
      totalWorkouts,
      caloriesBurned: totalCaloriesBurned,
      avgWorkoutTime,
      completionRate: Math.min(completionRate, 100),
      currentStreak,
      longestStreak: currentStreak, // Simplified for now
      totalNutritionLogs,
      avgDailyCalories
    })
  }

  const generateAchievements = (workouts: WorkoutLog[], nutrition: NutritionLog[]) => {
    const achievements: Achievement[] = []

    // Workout achievements
    if (workouts.length >= 1) {
      achievements.push({
        id: '1',
        title: 'First Workout',
        description: 'Completed your first workout',
        icon: 'dumbbell',
        unlockedAt: workouts[0]?.created_at || new Date().toISOString(),
        category: 'workout'
      })
    }

    if (workouts.length >= 10) {
      achievements.push({
        id: '2',
        title: 'Workout Warrior',
        description: 'Completed 10 workouts',
        icon: 'trophy',
        unlockedAt: workouts[9]?.created_at || new Date().toISOString(),
        category: 'workout'
      })
    }

    if (progressStats.currentStreak >= 3) {
      achievements.push({
        id: '3',
        title: 'Streak Master',
        description: `Maintained a ${progressStats.currentStreak}-day workout streak`,
        icon: 'flame',
        unlockedAt: new Date().toISOString(),
        category: 'streak'
      })
    }

    // Nutrition achievements
    if (nutrition.length >= 1) {
      achievements.push({
        id: '4',
        title: 'Nutrition Tracker',
        description: 'Started tracking your nutrition',
        icon: 'apple',
        unlockedAt: nutrition[0]?.created_at || new Date().toISOString(),
        category: 'nutrition'
      })
    }

    const uniqueNutritionDays = new Set(nutrition.map(n => n.date)).size
    if (uniqueNutritionDays >= 7) {
      achievements.push({
        id: '5',
        title: 'Consistent Logger',
        description: 'Logged meals for 7 different days',
        icon: 'target',
        unlockedAt: new Date().toISOString(),
        category: 'nutrition'
      })
    }

    setAchievements(achievements)
  }

  const getAchievementIcon = (iconName: string) => {
    const icons = {
      trophy: Trophy,
      target: Target,
      flame: Flame,
      activity: Activity,
      zap: Zap,
      dumbbell: Dumbbell,
      apple: Apple
    }
    return icons[iconName as keyof typeof icons] || Trophy
  }

  const getAchievementColor = (category: string) => {
    const colors = {
      workout: 'bg-purple-100 text-purple-600 border-purple-200',
      nutrition: 'bg-green-100 text-green-600 border-green-200',
      streak: 'bg-orange-100 text-orange-600 border-orange-200',
      goal: 'bg-blue-100 text-blue-600 border-blue-200'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-600 border-gray-200'
  }

  const COLORS = ['#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#3b82f6']

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Loading your progress data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="w-7 h-7 text-green-600" />
            <span>Progress Analytics</span>
          </h2>
          <p className="text-gray-600 mt-1">Track your fitness journey and celebrate achievements</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1 self-start">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 capitalize ${
                timeRange === range ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{progressStats.totalWorkouts}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Total Workouts</h3>
          <p className="text-xs sm:text-sm text-gray-600">This {timeRange}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{progressStats.caloriesBurned.toLocaleString()}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Calories Burned</h3>
          <p className="text-xs sm:text-sm text-gray-600">This {timeRange}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{progressStats.avgWorkoutTime}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Avg Workout Time</h3>
          <p className="text-xs sm:text-sm text-gray-600">Minutes</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{progressStats.completionRate}%</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Completion Rate</h3>
          <p className="text-xs sm:text-sm text-gray-600">This {timeRange}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Workout Progress */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Weekly Progress</h3>
            <BarChart3 className="w-5 h-5 text-gray-500" />
          </div>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  stroke="#6b7280"
                  width={30}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="workouts" fill="#10b981" name="Workouts" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Calorie Intake */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Daily Calorie Intake</h3>
            <Activity className="w-5 h-5 text-gray-500" />
          </div>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyCalories}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  stroke="#6b7280"
                  width={30}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="calories" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="goal" 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Workout Type Distribution & Current Streak */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Workout Type Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Workout Types</h3>
            <Dumbbell className="w-5 h-5 text-gray-500" />
          </div>
          {workoutTypeDistribution.length > 0 ? (
            <div className="h-40 sm:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={workoutTypeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {workoutTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 sm:h-48 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Dumbbell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No workout data yet</p>
              </div>
            </div>
          )}
          {workoutTypeDistribution.length > 0 && (
            <div className="mt-4 space-y-2">
              {workoutTypeDistribution.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-xs sm:text-sm text-gray-700 capitalize">{entry.name}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">{entry.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Streak */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-200 p-4 sm:p-6">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{progressStats.currentStreak}</h3>
            <p className="text-base sm:text-lg font-semibold text-gray-700 mb-1">Day Streak</p>
            <p className="text-xs sm:text-sm text-gray-600">
              {progressStats.currentStreak > 0 ? "Keep it up! You're on fire!" : "Start your streak today!"}
            </p>
          </div>
        </div>

        {/* Nutrition Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Nutrition Summary</h3>
            <Apple className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
                {progressStats.totalNutritionLogs}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Meals Logged</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                {progressStats.avgDailyCalories}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Avg Daily Calories</div>
            </div>
            {userProfile && (
              <div className="text-center">
                <div className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                  {Math.round((progressStats.avgDailyCalories / userProfile.calorie_goal) * 100)}%
                </div>
                <div className="text-xs sm:text-sm text-gray-600">of Daily Goal</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Achievements</h3>
          <Award className="w-5 h-5 text-gray-500" />
        </div>
        {achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const AchievementIcon = getAchievementIcon(achievement.icon)
              return (
                <div
                  key={achievement.id}
                  className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border ${getAchievementColor(achievement.category)}`}>
                    <AchievementIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base truncate">{achievement.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{achievement.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Achievements Yet</h4>
            <p className="text-gray-600">Start working out and tracking nutrition to unlock achievements!</p>
          </div>
        )}
      </div>

      {/* Weekly Workout Completion Chart */}
      {weeklyWorkouts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Weekly Workout Completion</h3>
            <BarChart3 className="w-5 h-5 text-gray-500" />
          </div>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyWorkouts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  stroke="#6b7280"
                  width={30}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="planned" fill="#e5e7eb" name="Planned" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressAnalyticsSection