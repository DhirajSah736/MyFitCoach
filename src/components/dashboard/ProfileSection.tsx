import React, { useState } from 'react'
import { UserCircle, Calendar, Ruler, Weight, Activity, Target, Apple, Heart, Dumbbell, Trash2, AlertTriangle, Loader2, CheckCircle, X, Scale as Male, Scale as Female, Scale, Utensils, CalendarDays, Gauge, Flame } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

interface UserProfile {
  id: string
  user_id: string
  gender: string
  age: number
  height_cm: number
  weight_kg: number
  activity_level: string
  goal: string
  preferred_diet: string
  health_notes?: string
  workout_days_per_week: number
  bmr: number
  tdee: number
  calorie_goal: number
  protein_grams: number
  carbs_grams: number
  fat_grams: number
}

interface ProfileSectionProps {
  userProfile: UserProfile
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ userProfile }) => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  const formatActivityLevel = (level: string) => {
    return level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatGoal = (goal: string) => {
    return goal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatDiet = (diet: string) => {
    switch (diet) {
      case 'veg': return 'Vegetarian'
      case 'non_veg': return 'Non-Vegetarian'
      case 'vegan': return 'Vegan'
      case 'keto': return 'Keto'
      case 'paleo': return 'Paleo'
      default: return diet.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const getGenderIcon = (gender: string) => {
    switch (gender.toLowerCase()) {
      case 'male': return Male
      case 'female': return Female
      default: return UserCircle
    }
  }

  const handleDeleteProfile = async () => {
    if (deleteConfirmText !== 'DELETE MY PROFILE') {
      setDeleteError('Please type "DELETE MY PROFILE" to confirm')
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      // Delete user profile
      const { error: profileError } = await supabase
        .from('user_profile')
        .delete()
        .eq('user_id', user?.id)

      if (profileError) throw profileError

      // Delete user workout logs
      const { error: workoutError } = await supabase
        .from('user_workout_logs')
        .delete()
        .eq('user_id', user?.id)

      // Delete nutrition logs
      const { error: nutritionError } = await supabase
        .from('nutrition_logs')
        .delete()
        .eq('user_id', user?.id)

      // Delete planner entries
      const { error: plannerError } = await supabase
        .from('planner_entries')
        .delete()
        .eq('user_id', user?.id)

      // Delete user templates
      const { error: templatesError } = await supabase
        .from('user_templates')
        .delete()
        .eq('user_id', user?.id)

      // Delete user workout progress
      const { error: progressError } = await supabase
        .from('user_workout_progress')
        .delete()
        .eq('user_id', user?.id)

      // Delete AI conversation logs
      const { error: aiLogsError } = await supabase
        .from('ai_conversation_logs')
        .delete()
        .eq('user_id', user?.id)

      // Delete user subscriptions
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user?.id)

      // Delete AI session usage
      const { error: aiSessionError } = await supabase
        .from('ai_session_usage')
        .delete()
        .eq('user_id', user?.id)

      // Delete Stripe customers
      const { error: stripeCustomerError } = await supabase
        .from('stripe_customers')
        .delete()
        .eq('user_id', user?.id)

      // Delete the actual user account
      const { error: userDeletionError } = await supabase.auth.admin.deleteUser(user?.id || '')
      
      if (userDeletionError) {
        // If we can't delete the user through admin API, try to delete through standard API
        const { error: standardDeletionError } = await supabase.auth.deleteUser()
        if (standardDeletionError) throw standardDeletionError
      }

      // Show success message before signing out
      setDeleteSuccess(true)
      
      // Wait 2 seconds before signing out
      setTimeout(async () => {
        await signOut()
        navigate('/')
      }, 2000)
      
    } catch (error) {
      console.error('Error deleting profile:', error)
      setDeleteError('Failed to delete profile. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <UserCircle className="w-7 h-7 text-purple-600" />
            <span>Your Profile</span>
          </h2>
          <p className="text-gray-600 mt-1">View and manage your personal information</p>
        </div>
      </div>

      {/* Profile Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gender Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              {React.createElement(getGenderIcon(userProfile.gender), { className: "w-6 h-6 text-purple-600" })}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Gender</h3>
              <p className="text-lg font-semibold text-gray-900 capitalize">{userProfile.gender}</p>
            </div>
          </div>
        </div>

        {/* Age Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Age</h3>
              <p className="text-lg font-semibold text-gray-900">{userProfile.age} years</p>
            </div>
          </div>
        </div>

        {/* Height Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Ruler className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Height</h3>
              <p className="text-lg font-semibold text-gray-900">{userProfile.height_cm} cm</p>
            </div>
          </div>
        </div>

        {/* Weight Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Weight</h3>
              <p className="text-lg font-semibold text-gray-900">{userProfile.weight_kg} kg</p>
            </div>
          </div>
        </div>

        {/* Activity Level Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Activity Level</h3>
              <p className="text-lg font-semibold text-gray-900">{formatActivityLevel(userProfile.activity_level)}</p>
            </div>
          </div>
        </div>

        {/* Fitness Goal Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Fitness Goal</h3>
              <p className="text-lg font-semibold text-gray-900">{formatGoal(userProfile.goal)}</p>
            </div>
          </div>
        </div>

        {/* Diet Preference Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Utensils className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Diet Preference</h3>
              <p className="text-lg font-semibold text-gray-900">{formatDiet(userProfile.preferred_diet)}</p>
            </div>
          </div>
        </div>

        {/* Workout Days Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Workout Days/Week</h3>
              <p className="text-lg font-semibold text-gray-900">{userProfile.workout_days_per_week} days</p>
            </div>
          </div>
        </div>

        {/* Daily Calorie Goal Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Flame className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Daily Calorie Goal</h3>
              <p className="text-lg font-semibold text-gray-900">{userProfile.calorie_goal} calories</p>
            </div>
          </div>
        </div>

        {/* Macros Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 md:col-span-2 lg:col-span-1">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Gauge className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Macros (P/C/F)</h3>
              <p className="text-lg font-semibold text-gray-900">
                {userProfile.protein_grams}g / {userProfile.carbs_grams}g / {userProfile.fat_grams}g
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Protein</p>
              <p className="text-sm font-semibold text-blue-600">{userProfile.protein_grams}g</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Carbs</p>
              <p className="text-sm font-semibold text-orange-600">{userProfile.carbs_grams}g</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Fat</p>
              <p className="text-sm font-semibold text-green-600">{userProfile.fat_grams}g</p>
            </div>
          </div>
        </div>
      </div>

      {/* Health Notes Section */}
      {userProfile.health_notes && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Heart className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">Health Notes</h3>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <p className="text-gray-700">{userProfile.health_notes || 'No health notes provided.'}</p>
          </div>
        </div>
      )}

      {/* Metabolic Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Activity className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Metabolic Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-1">Basal Metabolic Rate (BMR)</p>
            <p className="text-2xl font-bold text-gray-900">{userProfile.bmr}</p>
            <p className="text-xs text-gray-500">calories/day</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-1">Total Daily Energy Expenditure</p>
            <p className="text-2xl font-bold text-gray-900">{userProfile.tdee}</p>
            <p className="text-xs text-gray-500">calories/day</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-center">
            <p className="text-sm text-gray-500 mb-1">Daily Calorie Target</p>
            <p className="text-2xl font-bold text-gray-900">{userProfile.calorie_goal}</p>
            <p className="text-xs text-gray-500">calories/day</p>
          </div>
        </div>
      </div>

      {/* Delete Profile Button */}
      <div className="flex justify-center pt-6">
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
        >
          <Trash2 className="w-5 h-5" />
          <span>Delete Profile</span>
        </button>
      </div>

      {/* Delete Profile Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            {deleteSuccess ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Profile Deleted Successfully</h3>
                <p className="text-gray-600 mb-4">You will be redirected to the homepage shortly.</p>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Delete Profile</h3>
                    <p className="text-gray-600 text-sm">This action cannot be undone</p>
                  </div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-4 mb-6 border border-red-200">
                  <p className="text-red-700 text-sm">
                    <strong>Warning:</strong> Deleting your profile will permanently remove all your data, including workout history, nutrition logs, and progress tracking. You will need to create a new profile to use MyFitCoach again.
                  </p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type "DELETE MY PROFILE" to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="DELETE MY PROFILE"
                  />
                  {deleteError && (
                    <p className="mt-2 text-sm text-red-600">{deleteError}</p>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProfile}
                    disabled={deleteConfirmText !== 'DELETE MY PROFILE' || isDeleting}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        <span>Delete Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileSection