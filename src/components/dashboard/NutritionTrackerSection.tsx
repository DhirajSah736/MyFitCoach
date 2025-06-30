import React, { useState, useEffect } from 'react'
import { 
  Apple, 
  Plus, 
  Clock, 
  Target, 
  TrendingUp,
  Coffee,
  Sun,
  Moon,
  Cookie,
  CheckCircle,
  Edit3,
  Trash2,
  Search,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Scale,
  Utensils,
  Filter
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, addDays, subDays } from 'date-fns'

interface NutritionLog {
  id: string
  user_id: string
  date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  food_name: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
  portion: string
  time: string
  created_at: string
}

interface FoodItem {
  id: string
  name: string
  brand?: string
  category: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  serving_size_g: number
  serving_description: string
}

interface UserProfile {
  calorie_goal: number
  protein_grams: number
  carbs_grams: number
  fat_grams: number
}

const NutritionTrackerSection: React.FC = () => {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search')
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [quantity, setQuantity] = useState(100)
  
  // Manual entry state
  const [manualEntry, setManualEntry] = useState({
    food_name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    portion: '',
    meal_type: 'breakfast' as const,
    time: format(new Date(), 'HH:mm')
  })

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

  // Fetch nutrition logs for selected date
  useEffect(() => {
    const fetchNutritionLogs = async () => {
      if (!user) return

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('nutrition_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', selectedDate)
          .order('time', { ascending: true })

        if (error) throw error
        setNutritionLogs(data || [])
      } catch (error) {
        console.error('Error fetching nutrition logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNutritionLogs()
  }, [user, selectedDate])

  // Search food database
  useEffect(() => {
    const searchFoods = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      setSearchLoading(true)
      try {
        const { data, error } = await supabase
          .from('food_database')
          .select('*')
          .or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`)
          .limit(20)

        if (error) throw error
        setSearchResults(data || [])
      } catch (error) {
        console.error('Error searching foods:', error)
      } finally {
        setSearchLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchFoods, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // Calculate daily totals
  const dailyTotals = nutritionLogs.reduce(
    (totals, log) => ({
      calories: totals.calories + log.calories,
      protein: totals.protein + (log.protein || 0),
      carbs: totals.carbs + (log.carbs || 0),
      fat: totals.fat + (log.fat || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const getMealIcon = (mealType: string) => {
    const icons = {
      breakfast: Coffee,
      lunch: Sun,
      dinner: Moon,
      snack: Cookie
    }
    return icons[mealType as keyof typeof icons] || Coffee
  }

  const getMealColor = (mealType: string) => {
    const colors = {
      breakfast: 'bg-orange-100 text-orange-600 border-orange-200',
      lunch: 'bg-yellow-100 text-yellow-600 border-yellow-200',
      dinner: 'bg-blue-100 text-blue-600 border-blue-200',
      snack: 'bg-green-100 text-green-600 border-green-200'
    }
    return colors[mealType as keyof typeof colors] || 'bg-gray-100 text-gray-600 border-gray-200'
  }

  const calculateNutrition = (food: FoodItem, grams: number) => {
    const factor = grams / 100
    return {
      calories: Math.round(food.calories_per_100g * factor),
      protein: Math.round(food.protein_per_100g * factor),
      carbs: Math.round(food.carbs_per_100g * factor),
      fat: Math.round(food.fat_per_100g * factor)
    }
  }

  const handleFoodSelect = (food: FoodItem) => {
    setSelectedFood(food)
    setQuantity(food.serving_size_g)
  }

  const handleAddFromSearch = async () => {
    if (!selectedFood || !user) return

    setSubmitLoading(true)
    try {
      const nutrition = calculateNutrition(selectedFood, quantity)
      
      const { error } = await supabase
        .from('nutrition_logs')
        .insert([{
          user_id: user.id,
          date: selectedDate,
          meal_type: manualEntry.meal_type,
          food_name: selectedFood.name,
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
          portion: `${quantity}g`,
          time: manualEntry.time
        }])

      if (error) throw error

      // Refresh logs
      const { data: newLogs } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', selectedDate)
        .order('time', { ascending: true })

      setNutritionLogs(newLogs || [])
      
      // Reset form
      setSelectedFood(null)
      setSearchQuery('')
      setQuantity(100)
      setShowAddMeal(false)
      
      // Dispatch event for dashboard update
      window.dispatchEvent(new CustomEvent('nutritionLogged'))
    } catch (error) {
      console.error('Error adding meal:', error)
      alert('Failed to add meal. Please try again.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleManualAdd = async () => {
    if (!manualEntry.food_name || !manualEntry.calories || !user) return

    setSubmitLoading(true)
    try {
      const { error } = await supabase
        .from('nutrition_logs')
        .insert([{
          user_id: user.id,
          date: selectedDate,
          meal_type: manualEntry.meal_type,
          food_name: manualEntry.food_name,
          calories: parseInt(manualEntry.calories),
          protein: manualEntry.protein ? Math.round(parseFloat(manualEntry.protein)) : undefined,
          carbs: manualEntry.carbs ? Math.round(parseFloat(manualEntry.carbs)) : undefined,
          fat: manualEntry.fat ? Math.round(parseFloat(manualEntry.fat)) : undefined,
          portion: manualEntry.portion || '1 serving',
          time: manualEntry.time
        }])

      if (error) throw error

      // Refresh logs
      const { data: newLogs } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', selectedDate)
        .order('time', { ascending: true })

      setNutritionLogs(newLogs || [])
      
      // Reset form
      setManualEntry({
        food_name: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        portion: '',
        meal_type: 'breakfast',
        time: format(new Date(), 'HH:mm')
      })
      setShowAddMeal(false)
      
      // Dispatch event for dashboard update
      window.dispatchEvent(new CustomEvent('nutritionLogged'))
    } catch (error) {
      console.error('Error adding meal:', error)
      alert('Failed to add meal. Please try again.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteMeal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('nutrition_logs')
        .delete()
        .eq('id', id)

      if (error) throw error

      setNutritionLogs(prev => prev.filter(log => log.id !== id))
      
      // Dispatch event for dashboard update
      window.dispatchEvent(new CustomEvent('nutritionLogged'))
    } catch (error) {
      console.error('Error deleting meal:', error)
      alert('Failed to delete meal. Please try again.')
    }
  }

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const mealsByType = nutritionLogs.reduce((acc, log) => {
    if (!acc[log.meal_type]) acc[log.meal_type] = []
    acc[log.meal_type].push(log)
    return acc
  }, {} as Record<string, NutritionLog[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Apple className="w-7 h-7 text-red-500" />
            <span>Nutrition Tracker</span>
          </h2>
          <p className="text-gray-600 mt-1">Track your daily nutrition and reach your goals</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Date Navigation */}
          <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
              className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-0 focus:ring-0 text-sm font-medium text-gray-900 bg-transparent w-full"
            />
            <button
              onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
              className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <button
            onClick={() => setShowAddMeal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Meal</span>
          </button>
        </div>
      </div>

      {/* Daily Progress Overview */}
      {userProfile && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Daily Progress</h3>
            <div className="text-sm text-gray-600">
              {format(new Date(selectedDate), 'MMMM d, yyyy')}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Calories */}
            <div className="text-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-red-500"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${Math.min((dailyTotals.calories / userProfile.calorie_goal) * 100, 100)}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-bold text-gray-900">
                    {Math.round((dailyTotals.calories / userProfile.calorie_goal) * 100)}%
                  </span>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900">{dailyTotals.calories}</div>
              <div className="text-xs text-gray-500">/ {userProfile.calorie_goal} cal</div>
            </div>

            {/* Protein */}
            <div className="text-center">
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className={`h-3 rounded-full ${getProgressColor(dailyTotals.protein, userProfile.protein_grams)}`}
                  style={{ width: `${Math.min((dailyTotals.protein / userProfile.protein_grams) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-sm font-medium text-gray-900">{dailyTotals.protein}g</div>
              <div className="text-xs text-gray-500">/ {userProfile.protein_grams}g protein</div>
            </div>

            {/* Carbs */}
            <div className="text-center">
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className={`h-3 rounded-full ${getProgressColor(dailyTotals.carbs, userProfile.carbs_grams)}`}
                  style={{ width: `${Math.min((dailyTotals.carbs / userProfile.carbs_grams) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-sm font-medium text-gray-900">{dailyTotals.carbs}g</div>
              <div className="text-xs text-gray-500">/ {userProfile.carbs_grams}g carbs</div>
            </div>

            {/* Fat */}
            <div className="text-center">
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className={`h-3 rounded-full ${getProgressColor(dailyTotals.fat, userProfile.fat_grams)}`}
                  style={{ width: `${Math.min((dailyTotals.fat / userProfile.fat_grams) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-sm font-medium text-gray-900">{dailyTotals.fat}g</div>
              <div className="text-xs text-gray-500">/ {userProfile.fat_grams}g fat</div>
            </div>
          </div>
        </div>
      )}

      {/* Meal Timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Today's Meals</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-red-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
              const meals = mealsByType[mealType] || []
              const MealIcon = getMealIcon(mealType)
              
              return (
                <div key={mealType} className="border-l-4 border-gray-200 pl-4 sm:pl-6 relative">
                  <div className="absolute -left-3 top-0 w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
                    <MealIcon className="w-3 h-3 text-gray-600" />
                  </div>
                  
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-900 capitalize">{mealType}</h4>
                    {meals.length === 0 && (
                      <p className="text-sm text-gray-500">No meals logged</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {meals.map((meal) => (
                      <div
                        key={meal.id}
                        className="bg-gray-50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h5 className="font-medium text-gray-900">{meal.food_name}</h5>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getMealColor(meal.meal_type)}`}>
                              {meal.calories} cal
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                            <span>{meal.portion}</span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{meal.time}</span>
                            </span>
                            {meal.protein && <span>{meal.protein}g protein</span>}
                            {meal.carbs && <span>{meal.carbs}g carbs</span>}
                            {meal.fat && <span>{meal.fat}g fat</span>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 self-end sm:self-center">
                          <button
                            onClick={() => handleDeleteMeal(meal.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Meal Modal */}
      {showAddMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Meal</h3>
              <button
                onClick={() => setShowAddMeal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 px-4 sm:px-6 py-3 text-sm font-medium ${
                  activeTab === 'search'
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Search Food Database
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex-1 px-4 sm:px-6 py-3 text-sm font-medium ${
                  activeTab === 'manual'
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Manual Entry
              </button>
            </div>

            {/* Content Area - Make it scrollable */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
              {activeTab === 'search' ? (
                <div className="space-y-6">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Search for foods..."
                    />
                  </div>

                  {/* Search Results */}
                  {searchLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {searchResults.map((food) => (
                        <button
                          key={food.id}
                          onClick={() => handleFoodSelect(food)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors duration-200 ${
                            selectedFood?.id === food.id
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-gray-900">{food.name}</div>
                          {food.brand && (
                            <div className="text-sm text-gray-500">{food.brand}</div>
                          )}
                          <div className="text-sm text-gray-600 mt-1">
                            {food.calories_per_100g} cal per 100g • {food.serving_description}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div className="text-center py-8 text-gray-500">
                      No foods found for "{searchQuery}"
                    </div>
                  ) : null}

                  {/* Selected Food Details */}
                  {selectedFood && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <h4 className="font-semibold text-gray-900">{selectedFood.name}</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity (grams)
                          </label>
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Meal Type
                          </label>
                          <select
                            value={manualEntry.meal_type}
                            onChange={(e) => setManualEntry(prev => ({ ...prev, meal_type: e.target.value as any }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          >
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                            <option value="snack">Snack</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                        <input
                          type="time"
                          value={manualEntry.time}
                          onChange={(e) => setManualEntry(prev => ({ ...prev, time: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      {/* Nutrition Preview */}
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-2">Nutrition ({quantity}g)</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-red-600">
                              {calculateNutrition(selectedFood, quantity).calories}
                            </div>
                            <div className="text-gray-600">Calories</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">
                              {calculateNutrition(selectedFood, quantity).protein}g
                            </div>
                            <div className="text-gray-600">Protein</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-orange-600">
                              {calculateNutrition(selectedFood, quantity).carbs}g
                            </div>
                            <div className="text-gray-600">Carbs</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-green-600">
                              {calculateNutrition(selectedFood, quantity).fat}g
                            </div>
                            <div className="text-gray-600">Fat</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Food Name *</label>
                    <input
                      type="text"
                      value={manualEntry.food_name}
                      onChange={(e) => setManualEntry(prev => ({ ...prev, food_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="e.g., Grilled Chicken Breast"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
                      <select
                        value={manualEntry.meal_type}
                        onChange={(e) => setManualEntry(prev => ({ ...prev, meal_type: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                      <input
                        type="time"
                        value={manualEntry.time}
                        onChange={(e) => setManualEntry(prev => ({ ...prev, time: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Portion</label>
                      <input
                        type="text"
                        value={manualEntry.portion}
                        onChange={(e) => setManualEntry(prev => ({ ...prev, portion: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="e.g., 1 cup, 100g"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Calories *</label>
                      <input
                        type="number"
                        value={manualEntry.calories}
                        onChange={(e) => setManualEntry(prev => ({ ...prev, calories: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Protein (g)</label>
                      <input
                        type="number"
                        value={manualEntry.protein}
                        onChange={(e) => setManualEntry(prev => ({ ...prev, protein: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Carbs (g)</label>
                      <input
                        type="number"
                        value={manualEntry.carbs}
                        onChange={(e) => setManualEntry(prev => ({ ...prev, carbs: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fat (g)</label>
                      <input
                        type="number"
                        value={manualEntry.fat}
                        onChange={(e) => setManualEntry(prev => ({ ...prev, fat: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with buttons - Fixed at bottom */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200 mt-auto">
              <button
                onClick={() => setShowAddMeal(false)}
                className="w-full sm:w-1/2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={activeTab === 'search' ? handleAddFromSearch : handleManualAdd}
                disabled={
                  submitLoading ||
                  (activeTab === 'search' ? !selectedFood : !manualEntry.food_name || !manualEntry.calories)
                }
                className="w-full sm:w-1/2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {submitLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <span>Add Meal</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NutritionTrackerSection