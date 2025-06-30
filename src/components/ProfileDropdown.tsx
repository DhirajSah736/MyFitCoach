import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ProfileDropdown: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleDashboardClick = () => {
    navigate('/dashboard')
    setIsOpen(false)
  }

  const handleSignOut = async () => {
    setLoading(true)
    
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="relative group" ref={dropdownRef}>
      {/* Profile Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 transition-all duration-200 hover:bg-gray-100"
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[150px] truncate">
            {user.email}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      <div 
        className={`absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 transition-all duration-200 ${
          isOpen 
            ? 'opacity-100 visible transform translate-y-0' 
            : 'opacity-0 invisible transform translate-y-1 pointer-events-none'
        }`}
      >
        {/* Menu Items */}
        <div className="py-1">
          {/* Dashboard Link */}
          <button
            onClick={handleDashboardClick}
            className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200"
          >
            <LayoutDashboard className="w-4 h-4 mr-3 text-gray-500" />
            <span className="font-medium">Dashboard</span>
          </button>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4 mr-3 text-red-500" />
            <span className="font-medium">
              {loading ? 'Signing out...' : 'Sign Out'}
            </span>
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              <span className="text-gray-700 font-medium">Signing out...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileDropdown