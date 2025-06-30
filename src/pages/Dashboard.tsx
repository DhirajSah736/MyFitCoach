import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  Calendar,
  TrendingUp,
  Bot,
  Crown,
  User,
  LogOut,
  Menu,
  X,
  Play,
  Plus,
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  Flame,
  Activity,
  Zap,
  Loader2,
  ClipboardList,
  AlertTriangle,
  Trash2,
  UserCircle,
  Heart,
  Scale,
  Utensils,
  CalendarDays,
  Ruler,
  Gauge
} from 'lucide-react'
import NutritionTrackerSection from '../components/dashboard/NutritionTrackerSection'
import CalendarSection from '../components/dashboard/CalendarSection'
import ProgressAnalyticsSection from '../components/dashboard/ProgressAnalyticsSection'
import WorkoutPlannerSection from '../components/dashboard/WorkoutPlannerSection'
import PlannerSection from '../components/dashboard/PlannerSection'
import AICoachSection from '../components/dashboard/AICoachSection'
import PremiumSection from '../components/dashboard/PremiumSection'
import ProfileSection from '../components/dashboard/ProfileSection'
import DashboardFooter from '../components/dashboard/DashboardFooter'
import TimeBasedGreeting from '../components/dashboard/TimeBasedGreeting'

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('Dashboard')
  const [profileLoading, setProfileLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [firstName, setFirstName] = useState<string>('')
  const [todayMacros, setTodayMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  })
  const [todayWorkouts, setTodayWorkouts] = useState<any[]>([])
  const [workoutStats, setWorkoutStats] = useState({
    totalWorkouts: 0,
    currentStreak: 0,
    caloriesBurned: 0,
    weeklyGoal: 0
  })

  // Check if user has completed onboarding
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!user) return

      try {
        const { data: profile, error } = await supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', user.id)

        if (error) {
          console.error('Error fetching profile:', error)
        }

        if (!profile || profile.length === 0) {
          // User hasn't completed onboarding, redirect to onboarding
          navigate('/onboarding')
          return
        }

        setUserProfile(profile[0])
      } catch (error) {
        console.error('Error checking profile:', error)
      } finally {
        setProfileLoading(false)
      }
    }

    checkUserProfile()
  }, [user, navigate])

  // Fetch user's first name from metadata
  useEffect(() => {
    if (user && user.user_metadata && user.user_metadata.first_name) {
      setFirstName(user.user_metadata.first_name)
    }
  }, [user])

  // Fetch today's nutrition data
  useEffect(() => {
    const fetchTodayMacros = async () => {
      if (!user) return

      try {
        const today = new Date().toISOString().split('T')[0]
        
        const { data: nutritionLogs, error } = await supabase
          .from('nutrition_logs')
          .select('calories, protein, carbs, fat')
          .eq('user_id', user.id)
          .eq('date', today)

        if (error) {
          console.error('Error fetching nutrition logs:', error)
          return
        }

        // Sum up today's macros
        const totals = nutritionLogs?.reduce(
          (acc, log) => ({
            calories: acc.calories + (log.calories || 0),
            protein: acc.protein + (log.protein || 0),
            carbs: acc.carbs + (log.carbs || 0),
            fat: acc.fat + (log.fat || 0)
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        ) || { calories: 0, protein: 0, carbs: 0, fat: 0 }

        setTodayMacros(totals)
      } catch (error) {
        console.error('Error calculating today\'s macros:', error)
      }
    }

    if (userProfile) {
      fetchTodayMacros()
    }
  }, [user, userProfile])

  // Fetch today's workouts and stats
  useEffect(() => {
    const fetchWorkoutData = async () => {
      if (!user) return

      try {
        const today = new Date().toISOString().split('T')[0]
        
        // Fetch today's workouts
        const { data: workoutLogs, error: workoutError } = await supabase
          .from('user_workout_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .order('created_at', { ascending: false })

        if (workoutError) {
          console.error('Error fetching workout logs:', workoutError)
        } else {
          setTodayWorkouts(workoutLogs || [])
        }

        // Fetch workout stats
        const { data: allWorkouts, error: statsError } = await supabase
          .from('user_workout_logs')
          .select('date, calories_burned')
          .eq('user_id', user.id)
          .order('date', { ascending: false })

        if (statsError) {
          console.error('Error fetching workout stats:', statsError)
        } else if (allWorkouts) {
          const totalWorkouts = allWorkouts.length
          const totalCalories = allWorkouts.reduce((sum, workout) => sum + (workout.calories_burned || 0), 0)
          
          // Calculate streak
          const uniqueDates = [...new Set(allWorkouts.map(w => w.date))].sort().reverse()
          let streak = 0
          const todayDate = new Date()
          
          for (let i = 0; i < uniqueDates.length; i++) {
            const workoutDate = new Date(uniqueDates[i])
            const daysDiff = Math.floor((todayDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24))
            
            if (daysDiff === i) {
              streak++
            } else {
              break
            }
          }

          // Calculate weekly goal progress (assuming 5 workouts per week)
          const thisWeekStart = new Date(todayDate)
          thisWeekStart.setDate(todayDate.getDate() - todayDate.getDay())
          const thisWeekWorkouts = allWorkouts.filter(w => new Date(w.date) >= thisWeekStart).length
          const weeklyGoal = Math.min((thisWeekWorkouts / 5) * 100, 100)

          setWorkoutStats({
            totalWorkouts,
            currentStreak: streak,
            caloriesBurned: totalCalories,
            weeklyGoal: Math.round(weeklyGoal)
          })
        }
      } catch (error) {
        console.error('Error fetching workout data:', error)
      }
    }

    if (userProfile) {
      fetchWorkoutData()
    }
  }, [user, userProfile])

  // Listen for nutrition logged events to refresh data
  useEffect(() => {
    const handleNutritionLogged = () => {
      // Refresh nutrition data when a new meal is logged
      if (user && userProfile) {
        const fetchData = async () => {
          const today = new Date().toISOString().split('T')[0]
          
          const { data: nutritionLogs } = await supabase
            .from('nutrition_logs')
            .select('calories, protein, carbs, fat')
            .eq('user_id', user.id)
            .eq('date', today)

          const totals = nutritionLogs?.reduce(
            (acc, log) => ({
              calories: acc.calories + (log.calories || 0),
              protein: acc.protein + (log.protein || 0),
              carbs: acc.carbs + (log.carbs || 0),
              fat: acc.fat + (log.fat || 0)
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          ) || { calories: 0, protein: 0, carbs: 0, fat: 0 }

          setTodayMacros(totals)
        }
        
        fetchData()
      }
    }

    window.addEventListener('nutritionLogged', handleNutritionLogged)
    return () => window.removeEventListener('nutritionLogged', handleNutritionLogged)
  }, [user, userProfile])

  // Listen for workout logged events to refresh data
  useEffect(() => {
    const handleWorkoutLogged = () => {
      // Refresh workout data when a new workout is logged
      if (user && userProfile) {
        const fetchData = async () => {
          const today = new Date().toISOString().split('T')[0]
          
          const { data: workoutLogs } = await supabase
            .from('user_workout_logs')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .order('created_at', { ascending: false })

          setTodayWorkouts(workoutLogs || [])

          // Refresh stats
          const { data: allWorkouts } = await supabase
            .from('user_workout_logs')
            .select('date, calories_burned')
            .eq('user_id', user.id)
            .order('date', { ascending: false })

          if (allWorkouts) {
            const totalWorkouts = allWorkouts.length
            const totalCalories = allWorkouts.reduce((sum, workout) => sum + (workout.calories_burned || 0), 0)
            
            const uniqueDates = [...new Set(allWorkouts.map(w => w.date))].sort().reverse()
            let streak = 0
            const todayDate = new Date()
            
            for (let i = 0; i < uniqueDates.length; i++) {
              const workoutDate = new Date(uniqueDates[i])
              const daysDiff = Math.floor((todayDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24))
              
              if (daysDiff === i) {
                streak++
              } else {
                break
              }
            }

            const thisWeekStart = new Date(todayDate)
            thisWeekStart.setDate(todayDate.getDate() - todayDate.getDay())
            const thisWeekWorkouts = allWorkouts.filter(w => new Date(w.date) >= thisWeekStart).length
            const weeklyGoal = Math.min((thisWeekWorkouts / 5) * 100, 100)

            setWorkoutStats({
              totalWorkouts,
              currentStreak: streak,
              caloriesBurned: totalCalories,
              weeklyGoal: Math.round(weeklyGoal)
            })
          }
        }
        
        fetchData()
      }
    }

    window.addEventListener('workoutLogged', handleWorkoutLogged)
    return () => window.removeEventListener('workoutLogged', handleWorkoutLogged)
  }, [user, userProfile])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const sidebarItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Workout Planner', icon: ClipboardList },
    { name: 'Nutrition Tracker', icon: Apple },
    { name: 'Planner', icon: Calendar },
    { name: 'Progress Tracker', icon: TrendingUp },
    { name: 'AI Coach', icon: Bot },
    { name: 'Premium', icon: Crown },
    { name: 'Profile', icon: User },
  ]

  const todayWorkout = {
    name: "Upper Body Strength",
    duration: "45 min",
    exercises: 8,
    completed: false
  }

  const todayMeals = [
    { name: "Protein Smoothie", time: "8:00 AM", completed: true },
    { name: "Grilled Chicken Salad", time: "12:30 PM", completed: true },
    { name: "Greek Yogurt", time: "3:00 PM", completed: false },
    { name: "Salmon & Vegetables", time: "7:00 PM", completed: false }
  ]

  const quickActions = [
    { name: "Start Workout", icon: Play, color: "bg-purple-600", description: "Begin today's session" },
    { name: "Log Meal", icon: Plus, color: "bg-green-600", description: "Track your nutrition" },
    { name: "View Stats", icon: BarChart3, color: "bg-blue-600", description: "Check your progress" }
  ]

  // Show loading while checking profile
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'Workout Planner':
        return <WorkoutPlannerSection />
      case 'Nutrition Tracker':
        return <NutritionTrackerSection />
      case 'Planner':
        return <PlannerSection />
      case 'Progress Tracker':
        return <ProgressAnalyticsSection />
      case 'AI Coach':
        return <AICoachSection />
      case 'Premium':
        return <PremiumSection />
      case 'Profile':
        return <ProfileSection userProfile={userProfile} />
      default:
        return (
          <div className="space-y-8">
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {firstName || user?.email?.split('@')[0] || 'User'}! 👋
              </h1>
              <p className="text-gray-600">Ready to crush your fitness goals today?</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Streak</p>
                    <p className="text-3xl font-bold text-gray-900">{workoutStats.currentStreak}</p>
                    <p className="text-sm text-green-600 font-medium">days</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Flame className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Workouts</p>
                    <p className="text-3xl font-bold text-gray-900">{workoutStats.totalWorkouts}</p>
                    <p className="text-sm text-blue-600 font-medium">completed</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Calories Burned</p>
                    <p className="text-3xl font-bold text-gray-900">{workoutStats.caloriesBurned.toLocaleString()}</p>
                    <p className="text-sm text-red-600 font-medium">total</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Daily Calorie Goal</p>
                    <p className="text-3xl font-bold text-gray-900">{userProfile?.calorie_goal || 2200}</p>
                    <p className="text-sm text-green-600 font-medium">calories</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Macros Progress Card */}
            {userProfile && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Today's Macros Progress</h3>
                  <Apple className="w-5 h-5 text-gray-500" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Calories */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Calories</span>
                      <span className="text-sm font-bold text-red-600">
                        {todayMacros.calories}/{userProfile.calorie_goal}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
                        style={{ 
                          width: `${Math.min((todayMacros.calories / userProfile.calorie_goal) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      ({todayMacros.calories}/{userProfile.calorie_goal} cal)
                    </p>
                  </div>

                  {/* Protein */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Protein</span>
                      <span className="text-sm font-bold text-blue-600">
                        {todayMacros.protein}/{userProfile.protein_grams}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                        style={{ 
                          width: `${Math.min((todayMacros.protein / userProfile.protein_grams) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      ({todayMacros.protein}/{userProfile.protein_grams} g)
                    </p>
                  </div>

                  {/* Carbs */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Carbs</span>
                      <span className="text-sm font-bold text-orange-600">
                        {todayMacros.carbs}/{userProfile.carbs_grams}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                        style={{ 
                          width: `${Math.min((todayMacros.carbs / userProfile.carbs_grams) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      ({todayMacros.carbs}/{userProfile.carbs_grams} g)
                    </p>
                  </div>

                  {/* Fats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Fats</span>
                      <span className="text-sm font-bold text-green-600">
                        {todayMacros.fat}/{userProfile.fat_grams}g
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                        style={{ 
                          width: `${Math.min((todayMacros.fat / userProfile.fat_grams) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      ({todayMacros.fat}/{userProfile.fat_grams} g)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Dashboard Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Daily Planner */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Today's Plan</h3>
                      <Calendar className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {/* Today's Workout */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-600 mb-3">Workouts</h4>
                      {todayWorkouts.length > 0 ? (
                        <div className="space-y-3">
                          {todayWorkouts.slice(0, 3).map((workout, index) => (
                            <div key={index} className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold text-gray-900">{workout.exercise_name}</h5>
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              </div>
                              <div className="text-sm text-gray-600">
                                {workout.sets && workout.reps && `${workout.sets} sets × ${workout.reps} reps`}
                                {workout.duration_minutes && `${workout.duration_minutes} minutes`}
                                {workout.calories_burned && ` • ${workout.calories_burned} cal`}
                              </div>
                            </div>
                          ))}
                          {todayWorkouts.length > 3 && (
                            <div className="text-sm text-gray-500 text-center">
                              +{todayWorkouts.length - 3} more exercises
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-gray-900">{todayWorkout.name}</h5>
                            <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                              {todayWorkout.duration}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{todayWorkout.exercises} exercises</p>
                          <button 
                            onClick={() => setActiveSection('Workout Planner')}
                            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                          >
                            <Play className="w-4 h-4" />
                            <span>Start Workout</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Meal Checklist */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-3">Meals</h4>
                      <div className="space-y-3">
                        {todayMeals.map((meal, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                meal.completed 
                                  ? 'bg-green-500 border-green-500' 
                                  : 'border-gray-300'
                              }`}>
                                {meal.completed && <CheckCircle className="w-3 h-3 text-white" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{meal.name}</p>
                                <p className="text-xs text-gray-500">{meal.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Overview */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Progress Overview</h3>
                      <TrendingUp className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {/* Mock Progress Chart */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-600 mb-3">Weekly Activity</h4>
                      <div className="flex items-end justify-between h-32 bg-gray-50 rounded-lg p-4">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                          <div key={day} className="flex flex-col items-center space-y-2">
                            <div 
                              className="w-6 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                              style={{ height: `${Math.random() * 80 + 20}%` }}
                            ></div>
                            <span className="text-xs text-gray-500">{day}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Progress Metrics */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Weekly Goal</span>
                          <span className="font-medium text-gray-900">{workoutStats.weeklyGoal}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                            style={{ width: `${workoutStats.weeklyGoal}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Nutrition Target</span>
                          <span className="font-medium text-gray-900">
                            {userProfile ? Math.round((todayMacros.calories / userProfile.calorie_goal) * 100) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                            style={{ 
                              width: `${userProfile ? Math.min((todayMacros.calories / userProfile.calorie_goal) * 100, 100) : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                      <Zap className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {quickActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            if (action.name === 'Start Workout') setActiveSection('Workout Planner')
                            if (action.name === 'Log Meal') setActiveSection('Nutrition Tracker')
                            if (action.name === 'View Stats') setActiveSection('Progress Tracker')
                          }}
                          className="w-full p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left group"
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                              <action.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-200">
                                {action.name}
                              </h4>
                              <p className="text-sm text-gray-500">{action.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* AI Coach Suggestion */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">AI Coach Tip</h4>
                          <p className="text-sm text-gray-600">
                            {workoutStats.currentStreak > 0 
                              ? `Great job maintaining your ${workoutStats.currentStreak}-day streak! Ready to chat with Larry about your next workout?`
                              : "Ready to start your fitness journey? Chat with Larry, your AI fitness coach, for personalized guidance!"
                            }
                          </p>
                          <button
                            onClick={() => setActiveSection('AI Coach')}
                            className="mt-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                          >
                            Chat with Larry →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Fixed Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                MyFitCoach
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setActiveSection(item.name)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                    activeSection === item.name
                      ? 'text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  style={{
                    backgroundColor: activeSection === item.name ? '#FF6347' : 'transparent'
                  }}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${
                    activeSection === item.name ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  <span className="flex-1 text-left">{item.name}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* User Info & Logout Section */}
          <div className="border-t border-gray-200 bg-gray-50">
            {/* User Email */}
            <div className="px-4 py-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Welcome back!
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="px-4 pb-4">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200 group"
              >
                <LogOut className="w-5 h-5 mr-3 text-red-500 group-hover:text-red-600" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between min-h-[4rem] px-4 sm:px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="max-w-[calc(100vw-120px)] sm:max-w-none">
                {activeSection === 'Dashboard' ? (
                  <TimeBasedGreeting />
                ) : (
                  <>
                    <h1 className="text-xl font-semibold text-gray-900 truncate">
                      {activeSection}
                    </h1>
                    <p className="text-sm text-gray-500 line-clamp-2 sm:line-clamp-1">
                      {`Manage your ${activeSection.toLowerCase()}`}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.email?.split('@')[0] || 'User'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 flex-grow">
          <div className="max-w-7xl mx-auto">
            {renderActiveSection()}
          </div>
        </main>

        {/* Footer */}
        <DashboardFooter />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  )
}

export default Dashboard