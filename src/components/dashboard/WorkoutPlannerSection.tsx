import React, { useState, useEffect } from 'react'
import { 
  Dumbbell, 
  Clock, 
  Target, 
  Filter, 
  X, 
  Play, 
  CheckCircle,
  TrendingUp,
  Users,
  Zap,
  Calendar,
  Award,
  Loader2,
  ChevronRight,
  Plus,
  Search,
  Edit3,
  Trash2,
  ArrowLeft,
  Timer,
  RotateCcw,
  Save
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns'

interface WorkoutTemplate {
  id: string
  name: string
  description: string
  category: string
  estimated_duration: number
  estimated_calories: number
  exercises: TemplateExercise[]
  is_predefined?: boolean
}

interface TemplateExercise {
  id: string
  exercise_name: string
  sets?: number
  reps?: number
  duration_minutes?: number
  rest_seconds: number
  order_index: number
  notes?: string
}

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
  notes?: string
  date: string
  template_used?: string
  created_at: string
}

interface ExerciseDatabase {
  id: string
  name: string
  category: string
  muscle_groups: string[]
  calories_per_minute: number
  equipment?: string
  instructions?: string
  difficulty: string
}

interface CustomExercise {
  id: string
  exercise_name: string
  type: 'strength' | 'cardio' | 'flexibility'
  sets?: number
  reps?: number
  weight_kg?: number
  duration_minutes?: number
  calories_burned: number
  notes?: string
  isFromDatabase: boolean
  databaseExercise?: ExerciseDatabase
}

const WorkoutPlannerSection: React.FC = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [customTemplates, setCustomTemplates] = useState<WorkoutTemplate[]>([])
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [exerciseDatabase, setExerciseDatabase] = useState<ExerciseDatabase[]>([])
  
  // UI State
  const [activeView, setActiveView] = useState<'templates' | 'session' | 'create'>('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set())
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCustomWorkoutModal, setShowCustomWorkoutModal] = useState(false)
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarDate, setCalendarDate] = useState(new Date())
  
  // Create template state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'strength',
    exercises: [] as TemplateExercise[]
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ExerciseDatabase[]>([])
  const [showExerciseSearch, setShowExerciseSearch] = useState(false)

  // Custom workout state
  const [customWorkout, setCustomWorkout] = useState<CustomExercise[]>([])
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('')
  const [exerciseSearchResults, setExerciseSearchResults] = useState<ExerciseDatabase[]>([])
  const [showExerciseSearchForCustom, setShowExerciseSearchForCustom] = useState(false)
  const [customWorkoutLoading, setCustomWorkoutLoading] = useState(false)

  // Mock premium status - in real app this would come from user subscription
  const isPremium = true

  // Fetch predefined templates
  useEffect(() => {
    const fetchPredefinedTemplates = async () => {
      try {
        // Fetch from user_templates where is_public = true (predefined templates)
        const { data: publicTemplates, error: publicError } = await supabase
          .from('user_templates')
          .select(`
            id,
            name,
            description,
            category,
            estimated_duration,
            estimated_calories,
            template_exercises (
              id,
              exercise_name,
              sets,
              reps,
              duration_minutes,
              rest_seconds,
              order_index,
              notes
            )
          `)
          .eq('is_public', true)
          .order('created_at')

        if (publicError) throw publicError

        const formattedTemplates = publicTemplates?.map(template => ({
          ...template,
          exercises: template.template_exercises || [],
          is_predefined: true
        })) || []

        setTemplates(formattedTemplates)
      } catch (error) {
        console.error('Error fetching predefined templates:', error)
      }
    }

    fetchPredefinedTemplates()
  }, [])

  // Fetch user's custom templates
  useEffect(() => {
    const fetchCustomTemplates = async () => {
      if (!user || !isPremium) return

      try {
        const { data: userTemplates, error } = await supabase
          .from('user_templates')
          .select(`
            id,
            name,
            description,
            category,
            estimated_duration,
            estimated_calories,
            template_exercises (
              id,
              exercise_name,
              sets,
              reps,
              duration_minutes,
              rest_seconds,
              order_index,
              notes
            )
          `)
          .eq('user_id', user.id)
          .eq('is_public', false)
          .order('created_at')

        if (error) throw error

        const formattedTemplates = userTemplates?.map(template => ({
          ...template,
          exercises: template.template_exercises || [],
          is_predefined: false
        })) || []

        setCustomTemplates(formattedTemplates)
      } catch (error) {
        console.error('Error fetching custom templates:', error)
      }
    }

    fetchCustomTemplates()
  }, [user, isPremium])

  // Fetch workout logs
  useEffect(() => {
    const fetchWorkoutLogs = async () => {
      if (!user) return

      try {
        const startDate = format(startOfMonth(calendarDate), 'yyyy-MM-dd')
        const endDate = format(endOfMonth(calendarDate), 'yyyy-MM-dd')

        const { data, error } = await supabase
          .from('user_workout_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('created_at', { ascending: false })

        if (error) throw error
        setWorkoutLogs(data || [])
      } catch (error) {
        console.error('Error fetching workout logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkoutLogs()
  }, [user, calendarDate])

  // Fetch exercise database
  useEffect(() => {
    const fetchExerciseDatabase = async () => {
      try {
        const { data, error } = await supabase
          .from('exercise_database')
          .select('*')
          .order('name')

        if (error) throw error
        setExerciseDatabase(data || [])
      } catch (error) {
        console.error('Error fetching exercise database:', error)
      }
    }

    fetchExerciseDatabase()
  }, [])

  // Search exercises for template creation
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const filtered = exerciseDatabase.filter(exercise =>
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10)

    setSearchResults(filtered)
  }, [searchQuery, exerciseDatabase])

  // Search exercises for custom workout
  useEffect(() => {
    if (!exerciseSearchQuery.trim()) {
      setExerciseSearchResults([])
      return
    }

    const filtered = exerciseDatabase.filter(exercise =>
      exercise.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()) ||
      exercise.category.toLowerCase().includes(exerciseSearchQuery.toLowerCase())
    ).slice(0, 10)

    setExerciseSearchResults(filtered)
  }, [exerciseSearchQuery, exerciseDatabase])

  const handleQuickStart = (template: WorkoutTemplate) => {
    setSelectedTemplate(template)
    setCurrentExerciseIndex(0)
    setCompletedExercises(new Set())
    setSessionStartTime(new Date())
    setActiveView('session')
  }

  const handleCompleteExercise = (index: number) => {
    setCompletedExercises(prev => new Set([...prev, index]))
  }

  const handleCompleteWorkout = async () => {
    if (!selectedTemplate || !user || !sessionStartTime) return

    try {
      const sessionDuration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / (1000 * 60))
      const totalCalories = selectedTemplate.estimated_calories || 0

      // Log each exercise separately
      const exerciseLogs = selectedTemplate.exercises.map(exercise => ({
        user_id: user.id,
        workout_type: selectedTemplate.category,
        exercise_name: exercise.exercise_name,
        sets: exercise.sets,
        reps: exercise.reps,
        duration_minutes: exercise.duration_minutes || sessionDuration,
        calories_burned: Math.round(totalCalories / selectedTemplate.exercises.length),
        date: format(new Date(), 'yyyy-MM-dd'),
        template_used: selectedTemplate.name,
        notes: `Completed via ${selectedTemplate.name} template`
      }))

      const { error } = await supabase
        .from('user_workout_logs')
        .insert(exerciseLogs)

      if (error) throw error

      // Refresh workout logs
      const { data: newLogs } = await supabase
        .from('user_workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', format(startOfMonth(calendarDate), 'yyyy-MM-dd'))
        .lte('date', format(endOfMonth(calendarDate), 'yyyy-MM-dd'))
        .order('created_at', { ascending: false })

      setWorkoutLogs(newLogs || [])
      
      // Dispatch event for dashboard update
      window.dispatchEvent(new CustomEvent('workoutLogged'))
      
      // Reset session
      setActiveView('templates')
      setSelectedTemplate(null)
      setSessionStartTime(null)
      setCompletedExercises(new Set())
      
      alert('Workout completed successfully!')
    } catch (error) {
      console.error('Error completing workout:', error)
      alert('Failed to log workout. Please try again.')
    }
  }

  const handleAbortWorkout = () => {
    setActiveView('templates')
    setSelectedTemplate(null)
    setSessionStartTime(null)
    setCompletedExercises(new Set())
  }

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return

    try {
      const { error } = await supabase
        .from('user_workout_logs')
        .delete()
        .eq('id', workoutId)

      if (error) throw error

      setWorkoutLogs(prev => prev.filter(log => log.id !== workoutId))
      
      // Dispatch event for dashboard update
      window.dispatchEvent(new CustomEvent('workoutLogged'))
      
      alert('Workout deleted successfully!')
    } catch (error) {
      console.error('Error deleting workout:', error)
      alert('Failed to delete workout. Please try again.')
    }
  }

  const handleCreateTemplate = async () => {
    if (!user || !newTemplate.name.trim() || newTemplate.exercises.length === 0) return

    try {
      const estimatedDuration = newTemplate.exercises.reduce((total, ex) => 
        total + (ex.duration_minutes || 0) + (ex.sets || 0) * 2, 0
      )
      const estimatedCalories = estimatedDuration * 8 // Rough estimate

      const { data: template, error: templateError } = await supabase
        .from('user_templates')
        .insert([{
          user_id: user.id,
          name: newTemplate.name,
          description: newTemplate.description,
          category: newTemplate.category,
          estimated_duration: estimatedDuration,
          estimated_calories: estimatedCalories,
          is_public: false
        }])
        .select()
        .single()

      if (templateError) throw templateError

      const exerciseInserts = newTemplate.exercises.map((exercise, index) => ({
        template_id: template.id,
        exercise_name: exercise.exercise_name,
        sets: exercise.sets,
        reps: exercise.reps,
        duration_minutes: exercise.duration_minutes,
        rest_seconds: exercise.rest_seconds,
        order_index: index,
        notes: exercise.notes
      }))

      const { error: exerciseError } = await supabase
        .from('template_exercises')
        .insert(exerciseInserts)

      if (exerciseError) throw exerciseError

      // Refresh custom templates
      const { data: userTemplates } = await supabase
        .from('user_templates')
        .select(`
          id,
          name,
          description,
          category,
          estimated_duration,
          estimated_calories,
          template_exercises (
            id,
            exercise_name,
            sets,
            reps,
            duration_minutes,
            rest_seconds,
            order_index,
            notes
          )
        `)
        .eq('user_id', user.id)
        .eq('is_public', false)
        .order('created_at')

      const formattedTemplates = userTemplates?.map(template => ({
        ...template,
        exercises: template.template_exercises || [],
        is_predefined: false
      })) || []

      setCustomTemplates(formattedTemplates)
      
      // Reset form
      setNewTemplate({
        name: '',
        description: '',
        category: 'strength',
        exercises: []
      })
      setShowCreateModal(false)
      
      alert('Template created successfully!')
    } catch (error) {
      console.error('Error creating template:', error)
      alert('Failed to create template. Please try again.')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const { error } = await supabase
        .from('user_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error

      setCustomTemplates(prev => prev.filter(template => template.id !== templateId))
      alert('Template deleted successfully!')
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template. Please try again.')
    }
  }

  const addExerciseToTemplate = (exercise: ExerciseDatabase) => {
    const newExercise: TemplateExercise = {
      id: Date.now().toString(),
      exercise_name: exercise.name,
      sets: exercise.category === 'strength' ? 3 : undefined,
      reps: exercise.category === 'strength' ? 10 : undefined,
      duration_minutes: exercise.category !== 'strength' ? 5 : undefined,
      rest_seconds: 60,
      order_index: newTemplate.exercises.length,
      notes: ''
    }

    setNewTemplate(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }))
    setShowExerciseSearch(false)
    setSearchQuery('')
  }

  const removeExerciseFromTemplate = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }))
  }

  const updateExerciseInTemplate = (index: number, field: string, value: any) => {
    setNewTemplate(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === index ? { ...exercise, [field]: value } : exercise
      )
    }))
  }

  // Custom workout functions
  const addExerciseToCustomWorkout = (exercise: ExerciseDatabase) => {
    const newExercise: CustomExercise = {
      id: Date.now().toString(),
      exercise_name: exercise.name,
      type: exercise.category as 'strength' | 'cardio' | 'flexibility',
      sets: exercise.category === 'strength' ? 3 : undefined,
      reps: exercise.category === 'strength' ? 10 : undefined,
      duration_minutes: exercise.category !== 'strength' ? 5 : undefined,
      calories_burned: exercise.category !== 'strength' ? exercise.calories_per_minute * 5 : 50,
      notes: '',
      isFromDatabase: true,
      databaseExercise: exercise
    }

    setCustomWorkout(prev => [...prev, newExercise])
    setShowExerciseSearchForCustom(false)
    setExerciseSearchQuery('')
  }

  const addManualExerciseToCustomWorkout = () => {
    const newExercise: CustomExercise = {
      id: Date.now().toString(),
      exercise_name: '',
      type: 'strength',
      sets: 3,
      reps: 10,
      calories_burned: 50,
      notes: '',
      isFromDatabase: false
    }

    setCustomWorkout(prev => [...prev, newExercise])
  }

  const removeExerciseFromCustomWorkout = (index: number) => {
    setCustomWorkout(prev => prev.filter((_, i) => i !== index))
  }

  const updateCustomWorkoutExercise = (index: number, field: string, value: any) => {
    setCustomWorkout(prev => prev.map((exercise, i) => {
      if (i !== index) return exercise

      const updatedExercise = { ...exercise, [field]: value }

      // Auto-calculate calories for database exercises
      if (exercise.isFromDatabase && exercise.databaseExercise && field === 'duration_minutes') {
        updatedExercise.calories_burned = exercise.databaseExercise.calories_per_minute * value
      }

      return updatedExercise
    }))
  }

  const handleLogCustomWorkout = async () => {
    if (!user || customWorkout.length === 0) return

    // Validate all exercises have required fields
    const isValid = customWorkout.every(exercise => {
      if (!exercise.exercise_name.trim()) return false
      if (exercise.type === 'strength' && (!exercise.sets || !exercise.reps)) return false
      if (exercise.type !== 'strength' && !exercise.duration_minutes) return false
      if (!exercise.calories_burned || exercise.calories_burned <= 0) return false
      return true
    })

    if (!isValid) {
      alert('Please fill in all required fields for each exercise.')
      return
    }

    setCustomWorkoutLoading(true)

    try {
      const exerciseLogs = customWorkout.map(exercise => ({
        user_id: user.id,
        workout_type: exercise.type,
        exercise_name: exercise.exercise_name,
        sets: exercise.sets,
        reps: exercise.reps,
        duration_minutes: exercise.duration_minutes,
        weight_kg: exercise.weight_kg,
        calories_burned: Math.round(exercise.calories_burned),
        notes: exercise.notes || 'Custom workout',
        date: format(new Date(), 'yyyy-MM-dd'),
        template_used: null
      }))

      const { error } = await supabase
        .from('user_workout_logs')
        .insert(exerciseLogs)

      if (error) throw error

      // Refresh workout logs
      const { data: newLogs } = await supabase
        .from('user_workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', format(startOfMonth(calendarDate), 'yyyy-MM-dd'))
        .lte('date', format(endOfMonth(calendarDate), 'yyyy-MM-dd'))
        .order('created_at', { ascending: false })

      setWorkoutLogs(newLogs || [])
      
      // Dispatch event for dashboard update
      window.dispatchEvent(new CustomEvent('workoutLogged'))
      
      // Reset form
      setCustomWorkout([])
      setShowCustomWorkoutModal(false)
      
      alert('Custom workout logged successfully!')
    } catch (error) {
      console.error('Error logging custom workout:', error)
      alert('Failed to log workout. Please try again.')
    } finally {
      setCustomWorkoutLoading(false)
    }
  }

  const getWorkoutsForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    return workoutLogs.filter(log => log.date === dateString)
  }

  const monthStart = startOfMonth(calendarDate)
  const monthEnd = endOfMonth(calendarDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  // Workout Session View
  if (activeView === 'session' && selectedTemplate) {
    const currentExercise = selectedTemplate.exercises[currentExerciseIndex]
    const isCompleted = completedExercises.has(currentExerciseIndex)
    const allCompleted = completedExercises.size === selectedTemplate.exercises.length

    return (
      <div className="space-y-6">
        {/* Session Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleAbortWorkout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Templates</span>
            </button>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Timer className="w-4 h-4" />
                <span>{sessionStartTime ? Math.round((new Date().getTime() - sessionStartTime.getTime()) / (1000 * 60)) : 0} min</span>
              </div>
              <div className="text-sm text-gray-600">
                {completedExercises.size} / {selectedTemplate.exercises.length} exercises
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTemplate.name}</h2>
          <p className="text-gray-600">{selectedTemplate.description}</p>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                style={{ width: `${(completedExercises.size / selectedTemplate.exercises.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Exercises</h3>
          <div className="space-y-4">
            {selectedTemplate.exercises.map((exercise, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  completedExercises.has(index)
                    ? 'border-green-500 bg-green-50'
                    : index === currentExerciseIndex
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{exercise.exercise_name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {exercise.sets && exercise.reps && (
                        <span>{exercise.sets} sets × {exercise.reps} reps</span>
                      )}
                      {exercise.duration_minutes && (
                        <span>{exercise.duration_minutes} minutes</span>
                      )}
                      <span>Rest: {exercise.rest_seconds}s</span>
                    </div>
                    {exercise.notes && (
                      <p className="text-sm text-gray-500 mt-2">{exercise.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {completedExercises.has(index) ? (
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    ) : (
                      <button
                        onClick={() => handleCompleteExercise(index)}
                        className="w-8 h-8 border-2 border-gray-300 rounded-full hover:border-green-500 hover:bg-green-50 transition-colors duration-200"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session Actions */}
        <div className="flex space-x-4">
          <button
            onClick={handleAbortWorkout}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
          >
            Abort Workout
          </button>
          <button
            onClick={handleCompleteWorkout}
            disabled={!allCompleted}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Complete Workout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Dumbbell className="w-7 h-7 text-purple-600" />
            <span>Workout Planner</span>
          </h2>
          <p className="text-gray-600 mt-1">Choose a template or create your own workout</p>
        </div>
      </div>

      {/* Choose Template Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Choose Template</h3>
          {isPremium && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Template</span>
            </button>
          )}
        </div>

        {/* Predefined Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <h4 className="font-semibold text-gray-900 mb-2">{template.name}</h4>
              <p className="text-gray-600 text-sm mb-4">{template.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{template.estimated_duration} min</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4" />
                  <span>{template.estimated_calories} cal</span>
                </div>
              </div>

              <button
                onClick={() => handleQuickStart(template)}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Quick Start</span>
              </button>
            </div>
          ))}
        </div>

        {/* Custom Templates */}
        {isPremium && customTemplates.length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Your Custom Templates</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-blue-50 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{template.estimated_duration} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="w-4 h-4" />
                      <span>{template.estimated_calories} cal</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickStart(template)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Quick Start</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Log Workout Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Log Workout</h3>
        <p className="text-gray-600 mb-4">Manually log a workout without using a template</p>
        <button 
          onClick={() => setShowCustomWorkoutModal(true)}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
        >
          Log Custom Workout
        </button>
      </div>

      {/* Workout History Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Workout History</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCalendarDate(subDays(calendarDate, 30))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <span className="text-sm font-medium text-gray-900">
              {format(calendarDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCalendarDate(addDays(calendarDate, 30))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day) => {
            const dayWorkouts = getWorkoutsForDate(day)
            const isToday = isSameDay(day, new Date())
            const isSelected = isSameDay(day, selectedDate)

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`min-h-[80px] p-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                  !isSameMonth(day, calendarDate) ? 'text-gray-400 bg-gray-50' : ''
                } ${isToday ? 'bg-blue-50 border-blue-200' : ''} ${
                  isSelected ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </div>
                {dayWorkouts.length > 0 && (
                  <div className="space-y-1">
                    {dayWorkouts.slice(0, 2).map((workout) => (
                      <div
                        key={workout.id}
                        className="text-xs p-1 bg-green-100 text-green-700 rounded border border-green-200 flex items-center justify-between"
                      >
                        <span className="truncate">{workout.exercise_name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteWorkout(workout.id)
                          }}
                          className="text-red-500 hover:text-red-700 ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {dayWorkouts.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayWorkouts.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">
              {format(selectedDate, 'MMMM d, yyyy')}
            </h4>
            {getWorkoutsForDate(selectedDate).length > 0 ? (
              <div className="space-y-2">
                {getWorkoutsForDate(selectedDate).map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div>
                      <div className="font-medium text-gray-900">{workout.exercise_name}</div>
                      <div className="text-sm text-gray-600">
                        {workout.template_used && `Template: ${workout.template_used}`}
                        {workout.sets && workout.reps && ` • ${workout.sets}×${workout.reps}`}
                        {workout.duration_minutes && ` • ${workout.duration_minutes} min`}
                        {workout.calories_burned && ` • ${workout.calories_burned} cal`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteWorkout(workout.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No workouts logged for this date</p>
            )}
          </div>
        )}
      </div>

      {/* Custom Workout Modal */}
      {showCustomWorkoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Log Custom Workout</h3>
              <button
                onClick={() => setShowCustomWorkoutModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Add Exercise Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowExerciseSearchForCustom(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search Exercise Database</span>
                  </button>
                  <button
                    onClick={addManualExerciseToCustomWorkout}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Manual Exercise</span>
                  </button>
                </div>

                {/* Exercise List */}
                {customWorkout.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Dumbbell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No exercises added yet</h4>
                    <p>Add exercises from our database or create manual entries</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customWorkout.map((exercise, index) => (
                      <div key={exercise.id} className="p-6 border border-gray-200 rounded-xl bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </span>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {exercise.isFromDatabase ? exercise.exercise_name : 'Manual Exercise'}
                              </h4>
                              {exercise.isFromDatabase && (
                                <p className="text-sm text-gray-600 capitalize">{exercise.type}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeExerciseFromCustomWorkout(index)}
                            className="text-red-500 hover:text-red-700 p-2"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Exercise Name (for manual entries) */}
                          {!exercise.isFromDatabase && (
                            <div className="lg:col-span-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Exercise Name *</label>
                              <input
                                type="text"
                                value={exercise.exercise_name}
                                onChange={(e) => updateCustomWorkoutExercise(index, 'exercise_name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="e.g., Push-ups"
                              />
                            </div>
                          )}

                          {/* Type (for manual entries) */}
                          {!exercise.isFromDatabase && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                              <select
                                value={exercise.type}
                                onChange={(e) => updateCustomWorkoutExercise(index, 'type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              >
                                <option value="strength">Strength</option>
                                <option value="cardio">Cardio</option>
                                <option value="flexibility">Flexibility</option>
                              </select>
                            </div>
                          )}

                          {/* Sets (for strength exercises) */}
                          {exercise.type === 'strength' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Sets *</label>
                              <input
                                type="number"
                                value={exercise.sets || ''}
                                onChange={(e) => updateCustomWorkoutExercise(index, 'sets', parseInt(e.target.value) || undefined)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                min="1"
                                placeholder="3"
                              />
                            </div>
                          )}

                          {/* Reps (for strength exercises) */}
                          {exercise.type === 'strength' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Reps *</label>
                              <input
                                type="number"
                                value={exercise.reps || ''}
                                onChange={(e) => updateCustomWorkoutExercise(index, 'reps', parseInt(e.target.value) || undefined)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                min="1"
                                placeholder="10"
                              />
                            </div>
                          )}

                          {/* Weight (optional for strength exercises) */}
                          {exercise.type === 'strength' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                              <input
                                type="number"
                                value={exercise.weight_kg || ''}
                                onChange={(e) => updateCustomWorkoutExercise(index, 'weight_kg', parseFloat(e.target.value) || undefined)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                min="0"
                                step="0.5"
                                placeholder="20"
                              />
                            </div>
                          )}

                          {/* Duration (for cardio/flexibility) */}
                          {exercise.type !== 'strength' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
                              <input
                                type="number"
                                value={exercise.duration_minutes || ''}
                                onChange={(e) => updateCustomWorkoutExercise(index, 'duration_minutes', parseInt(e.target.value) || undefined)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                min="1"
                                placeholder="30"
                              />
                            </div>
                          )}

                          {/* Calories */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Calories Burned *
                              {exercise.isFromDatabase && exercise.databaseExercise && (
                                <span className="text-xs text-gray-500 ml-1">(Auto-calculated)</span>
                              )}
                            </label>
                            <input
                              type="number"
                              value={exercise.calories_burned}
                              onChange={(e) => updateCustomWorkoutExercise(index, 'calories_burned', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              min="1"
                              placeholder="50"
                              disabled={exercise.isFromDatabase && exercise.databaseExercise && exercise.type !== 'strength'}
                            />
                          </div>

                          {/* Notes */}
                          <div className="lg:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                            <input
                              type="text"
                              value={exercise.notes || ''}
                              onChange={(e) => updateCustomWorkoutExercise(index, 'notes', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Optional notes about this exercise..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total Calories */}
                {customWorkout.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Total Estimated Calories:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {customWorkout.reduce((total, exercise) => total + exercise.calories_burned, 0)} cal
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCustomWorkoutModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogCustomWorkout}
                disabled={customWorkout.length === 0 || customWorkoutLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {customWorkoutLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Log Workout</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Search Modal for Custom Workout */}
      {showExerciseSearchForCustom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Search Exercise Database</h3>
              <button
                onClick={() => setShowExerciseSearchForCustom(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={exerciseSearchQuery}
                  onChange={(e) => setExerciseSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Search exercises..."
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {exerciseSearchResults.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => addExerciseToCustomWorkout(exercise)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors duration-200"
                  >
                    <div className="font-medium text-gray-900">{exercise.name}</div>
                    <div className="text-sm text-gray-600 capitalize">{exercise.category}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {exercise.calories_per_minute} cal/min • {exercise.difficulty}
                    </div>
                  </button>
                ))}
                {exerciseSearchQuery && exerciseSearchResults.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No exercises found for "{exerciseSearchQuery}"
                  </div>
                )}
                {!exerciseSearchQuery && (
                  <div className="text-center py-8 text-gray-500">
                    Start typing to search exercises...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Template Modal */}
      {showCreateModal && isPremium && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Custom Template</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Template Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                    <input
                      type="text"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., My Upper Body Workout"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="strength">Strength</option>
                      <option value="cardio">Cardio</option>
                      <option value="flexibility">Flexibility</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe your workout template..."
                  />
                </div>

                {/* Exercises */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">Exercises</label>
                    <button
                      onClick={() => setShowExerciseSearch(true)}
                      className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Exercise</span>
                    </button>
                  </div>

                  {newTemplate.exercises.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Dumbbell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No exercises added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {newTemplate.exercises.map((exercise, index) => (
                        <div key={exercise.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">{exercise.exercise_name}</h4>
                            <button
                              onClick={() => removeExerciseFromTemplate(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {exercise.sets !== undefined && (
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Sets</label>
                                <input
                                  type="number"
                                  value={exercise.sets}
                                  onChange={(e) => updateExerciseInTemplate(index, 'sets', parseInt(e.target.value))}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  min="1"
                                />
                              </div>
                            )}
                            {exercise.reps !== undefined && (
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Reps</label>
                                <input
                                  type="number"
                                  value={exercise.reps}
                                  onChange={(e) => updateExerciseInTemplate(index, 'reps', parseInt(e.target.value))}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  min="1"
                                />
                              </div>
                            )}
                            {exercise.duration_minutes !== undefined && (
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Duration (min)</label>
                                <input
                                  type="number"
                                  value={exercise.duration_minutes}
                                  onChange={(e) => updateExerciseInTemplate(index, 'duration_minutes', parseInt(e.target.value))}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  min="1"
                                />
                              </div>
                            )}
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Rest (sec)</label>
                              <input
                                type="number"
                                value={exercise.rest_seconds}
                                onChange={(e) => updateExerciseInTemplate(index, 'rest_seconds', parseInt(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={!newTemplate.name.trim() || newTemplate.exercises.length === 0}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Search Modal for Template Creation */}
      {showExerciseSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Exercise</h3>
              <button
                onClick={() => setShowExerciseSearch(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Search exercises..."
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => addExerciseToTemplate(exercise)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-colors duration-200"
                  >
                    <div className="font-medium text-gray-900">{exercise.name}</div>
                    <div className="text-sm text-gray-600 capitalize">{exercise.category}</div>
                  </button>
                ))}
                {searchQuery && searchResults.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No exercises found for "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutPlannerSection