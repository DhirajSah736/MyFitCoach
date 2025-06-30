import React, { useState, useEffect } from 'react'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Target,
  TrendingUp,
  Filter,
  X
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns'

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
  created_at: string
}

const WorkoutCalendarSection: React.FC = () => {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [selectedDateWorkouts, setSelectedDateWorkouts] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'strength' | 'cardio' | 'flexibility'>('all')
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Fetch workout logs for the current month
  useEffect(() => {
    const fetchWorkoutLogs = async () => {
      if (!user) return

      setLoading(true)
      try {
        const startDate = format(monthStart, 'yyyy-MM-dd')
        const endDate = format(monthEnd, 'yyyy-MM-dd')

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
  }, [user, currentDate, monthStart, monthEnd])

  // Update selected date workouts when date or logs change
  useEffect(() => {
    if (selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd')
      const dayWorkouts = workoutLogs.filter(log => log.date === dateString)
      setSelectedDateWorkouts(dayWorkouts)
    }
  }, [selectedDate, workoutLogs])

  const getWorkoutsForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    const dayWorkouts = workoutLogs.filter(log => log.date === dateString)
    
    if (filterType === 'all') {
      return dayWorkouts
    }
    return dayWorkouts.filter(log => log.workout_type === filterType)
  }

  const getTotalCaloriesForDate = (date: Date) => {
    const workouts = getWorkoutsForDate(date)
    return workouts.reduce((total, workout) => total + (workout.calories_burned || 0), 0)
  }

  const getWorkoutTypeColor = (type: string) => {
    const colors = {
      strength: 'bg-purple-500',
      cardio: 'bg-red-500',
      flexibility: 'bg-green-500'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-500'
  }

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
    setSelectedDate(null)
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
    setSelectedDate(null)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const groupWorkoutsByType = (workouts: WorkoutLog[]) => {
    return workouts.reduce((groups, workout) => {
      const type = workout.workout_type
      if (!groups[type]) {
        groups[type] = []
      }
      groups[type].push(workout)
      return groups
    }, {} as Record<string, WorkoutLog[]>)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <CalendarIcon className="w-7 h-7 text-blue-600" />
            <span>Workout Calendar</span>
          </h2>
          <p className="text-gray-600 mt-1">Track your workout history and progress</p>
        </div>
        
        {/* Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['all', 'strength', 'cardio', 'flexibility'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 capitalize ${
                  filterType === type ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
        <button
          onClick={() => setViewMode('calendar')}
          className={`flex-1 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
            viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
          }`}
        >
          Calendar View
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`flex-1 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
            viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
          }`}
        >
          List View
        </button>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h3 className="text-base sm:text-xl font-semibold text-gray-900">
                  {format(currentDate, 'MMMM yyyy')}
                </h3>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <button
                onClick={() => {
                  setCurrentDate(new Date())
                  setSelectedDate(new Date())
                }}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              >
                Today
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-2 sm:p-6">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2 sm:mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-1 sm:p-3 text-center text-xs sm:text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((day) => {
                  const dayWorkouts = getWorkoutsForDate(day)
                  const totalCalories = getTotalCaloriesForDate(day)
                  const isToday = isSameDay(day, new Date())
                  const isSelected = selectedDate && isSameDay(day, selectedDate)
                  const hasWorkouts = dayWorkouts.length > 0

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDateClick(day)}
                      className={`min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
                        !isSameMonth(day, currentDate) ? 'text-gray-400 bg-gray-50' : ''
                      } ${isToday ? 'bg-blue-50 border-blue-200' : ''} ${
                        isSelected ? 'ring-2 ring-blue-500' : ''
                      } ${hasWorkouts ? 'bg-gradient-to-br from-green-50 to-blue-50' : ''}`}
                    >
                      <div className={`text-xs sm:text-sm font-medium mb-1 ${
                        isToday ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      
                      {hasWorkouts && (
                        <div className="space-y-1 overflow-y-auto max-h-[40px] sm:max-h-[80px] scrollbar-thin">
                          {/* Workout indicators */}
                          <div className="flex flex-wrap gap-1">
                            {Array.from(new Set(dayWorkouts.map(w => w.workout_type))).map((type) => (
                              <div
                                key={type}
                                className={`w-2 h-2 rounded-full ${getWorkoutTypeColor(type)}`}
                              ></div>
                            ))}
                          </div>
                          
                          {/* Calories - only show on larger screens */}
                          {totalCalories > 0 && (
                            <div className="hidden sm:flex text-xs text-gray-600 items-center space-x-1">
                              <Flame className="w-3 h-3 text-orange-500 flex-shrink-0" />
                              <span className="truncate">{totalCalories}</span>
                            </div>
                          )}
                          
                          {/* Exercise count */}
                          <div className="text-xs text-gray-500">
                            {dayWorkouts.length}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Workout Details Sidebar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
            </h3>
            
            {selectedDate ? (
              selectedDateWorkouts.length > 0 ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">{selectedDateWorkouts.length}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Exercises</div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-orange-600">
                          {selectedDateWorkouts.reduce((total, workout) => total + (workout.calories_burned || 0), 0)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Calories</div>
                      </div>
                    </div>
                  </div>

                  {/* Workouts by Type */}
                  <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin">
                    {Object.entries(groupWorkoutsByType(selectedDateWorkouts)).map(([type, workouts]) => (
                      <div key={type} className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getWorkoutTypeColor(type)}`}></div>
                          <h4 className="font-semibold text-gray-900 capitalize">{type}</h4>
                          <span className="text-sm text-gray-500">({workouts.length})</span>
                        </div>
                        
                        <div className="space-y-2 ml-5">
                          {workouts.map((workout) => (
                            <div key={workout.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="font-medium text-gray-900 mb-1 line-clamp-1">{workout.exercise_name}</div>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                {workout.sets && workout.reps && (
                                  <span className="flex items-center space-x-1">
                                    <Target className="w-3 h-3 flex-shrink-0" />
                                    <span>{workout.sets}×{workout.reps}</span>
                                  </span>
                                )}
                                {workout.duration_minutes && (
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3 flex-shrink-0" />
                                    <span>{workout.duration_minutes}m</span>
                                  </span>
                                )}
                                {workout.weight_kg && (
                                  <span>{workout.weight_kg}kg</span>
                                )}
                                {workout.calories_burned > 0 && (
                                  <span className="flex items-center space-x-1">
                                    <Flame className="w-3 h-3 text-orange-500 flex-shrink-0" />
                                    <span>{workout.calories_burned}</span>
                                  </span>
                                )}
                              </div>
                              {workout.notes && (
                                <div className="text-sm text-gray-500 mt-2 italic line-clamp-2">
                                  "{workout.notes}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No workouts logged for this date</p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Click on a date to view workout details</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {format(currentDate, 'MMMM yyyy')} Workouts
          </h3>
          
          {workoutLogs.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No workouts logged for this month</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group workouts by date */}
              {Array.from(new Set(workoutLogs.map(log => log.date)))
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                .map(date => {
                  const dateWorkouts = workoutLogs.filter(log => log.date === date);
                  if (filterType !== 'all') {
                    dateWorkouts.filter(log => log.workout_type === filterType);
                  }
                  
                  if (dateWorkouts.length === 0) return null;
                  
                  return (
                    <div key={date} className="border-l-4 border-blue-500 pl-4 py-2">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                      </h4>
                      <div className="space-y-3">
                        {dateWorkouts.map(workout => (
                          <div key={workout.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className={`w-3 h-3 rounded-full ${getWorkoutTypeColor(workout.workout_type)}`}></div>
                              <span className="text-sm font-medium text-gray-500 capitalize">{workout.workout_type}</span>
                            </div>
                            <div className="font-medium text-gray-900 mb-1">{workout.exercise_name}</div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                              {workout.sets && workout.reps && (
                                <span className="flex items-center space-x-1">
                                  <Target className="w-3 h-3 flex-shrink-0" />
                                  <span>{workout.sets}×{workout.reps}</span>
                                </span>
                              )}
                              {workout.duration_minutes && (
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3 flex-shrink-0" />
                                  <span>{workout.duration_minutes}m</span>
                                </span>
                              )}
                              {workout.weight_kg && (
                                <span>{workout.weight_kg}kg</span>
                              )}
                              {workout.calories_burned > 0 && (
                                <span className="flex items-center space-x-1">
                                  <Flame className="w-3 h-3 text-orange-500 flex-shrink-0" />
                                  <span>{workout.calories_burned}</span>
                                </span>
                              )}
                            </div>
                            {workout.notes && (
                              <div className="text-sm text-gray-500 mt-2 italic line-clamp-2">
                                "{workout.notes}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Monthly Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
          {format(currentDate, 'MMMM yyyy')} Summary
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">
              {workoutLogs.length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Total Exercises</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-2">
              {workoutLogs.reduce((total, log) => total + (log.calories_burned || 0), 0)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Calories Burned</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
              {new Set(workoutLogs.map(log => log.date)).size}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Active Days</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">
              {Math.round((new Set(workoutLogs.map(log => log.date)).size / monthDays.length) * 100)}%
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Consistency</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkoutCalendarSection