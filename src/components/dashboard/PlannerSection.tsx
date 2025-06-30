import React, { useState, useMemo } from 'react'
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Filter, 
  Search,
  Clock,
  CheckCircle,
  Circle,
  X,
  Edit3,
  Trash2,
  AlertCircle,
  Loader2,
  Tag,
  Bell,
  Repeat,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Apple,
  MessageSquare,
  AlertTriangle,
  List,
  Grid
} from 'lucide-react'
import { format, isToday, isTomorrow, isYesterday, parseISO, addDays, startOfWeek, endOfWeek } from 'date-fns'
import { usePlannerEntries } from '../../hooks/usePlannerEntries'
import { PlannerEntry, PlannerFormData, PlannerFilters } from '../../types/planner'
import CalendarView from './CalendarView'

const PlannerSection: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<PlannerEntry | null>(null)
  const [filters, setFilters] = useState<PlannerFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const { entries, loading, error, createEntry, updateEntry, deleteEntry, toggleStatus } = usePlannerEntries(filters)

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = !searchQuery || 
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      return matchesSearch
    })
  }, [entries, searchQuery])

  // Group entries by date for list view
  const groupedEntries = useMemo(() => {
    const groups: Record<string, PlannerEntry[]> = {}
    
    filteredEntries.forEach(entry => {
      const date = entry.scheduled_date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(entry)
    })

    // Sort entries within each group by time
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => {
        const timeA = a.scheduled_time || '00:00:00'
        const timeB = b.scheduled_time || '00:00:00'
        return timeA.localeCompare(timeB)
      })
    })

    return groups
  }, [filteredEntries])

  const getEntryIcon = (type: string) => {
    const icons = {
      workout: Dumbbell,
      meal: Apple,
      reminder: Bell,
      note: MessageSquare
    }
    return icons[type as keyof typeof icons] || Circle
  }

  const getEntryColor = (type: string, priority: string) => {
    const baseColors = {
      workout: 'purple',
      meal: 'green',
      reminder: 'blue',
      note: 'gray'
    }
    
    const intensities = {
      low: '400',
      medium: '500',
      high: '600'
    }

    const color = baseColors[type as keyof typeof baseColors] || 'gray'
    const intensity = intensities[priority as keyof typeof intensities] || '500'
    
    return `bg-${color}-${intensity}`
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'border-yellow-200 bg-yellow-50',
      completed: 'border-green-200 bg-green-50',
      cancelled: 'border-red-200 bg-red-50'
    }
    return colors[status as keyof typeof colors] || 'border-gray-200 bg-gray-50'
  }

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMM d')
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'All day'
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const handleCreateEntry = async (formData: PlannerFormData) => {
    try {
      // Clean the form data before sending to database
      const cleanedData = {
        ...formData,
        // Convert empty string to null for time field
        scheduled_time: formData.scheduled_time?.trim() || null,
        status: 'pending',
        is_recurring: formData.is_recurring || false,
        tags: formData.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      await createEntry(cleanedData)
      setShowAddModal(false)
    } catch (error) {
      console.error('Failed to create entry:', error)
      alert('Failed to create entry. Please try again.')
    }
  }

  const handleUpdateEntry = async (formData: PlannerFormData) => {
    if (!editingEntry) return

    try {
      // Clean the form data before sending to database
      const cleanedData = {
        ...formData,
        // Convert empty string to null for time field
        scheduled_time: formData.scheduled_time?.trim() || null
      }
      
      await updateEntry(editingEntry.id, cleanedData)
      setEditingEntry(null)
    } catch (error) {
      console.error('Failed to update entry:', error)
      alert('Failed to update entry. Please try again.')
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return

    try {
      await deleteEntry(id)
    } catch (error) {
      console.error('Failed to delete entry:', error)
      alert('Failed to delete entry. Please try again.')
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowAddModal(true)
  }

  const handleEntryClick = (entry: PlannerEntry) => {
    setEditingEntry(entry)
  }

  const handleEntryMove = async (entryId: string, newDate: string) => {
    try {
      await updateEntry(entryId, { scheduled_date: newDate })
    } catch (error) {
      console.error('Failed to move entry:', error)
      alert('Failed to move entry. Please try again.')
    }
  }

  const clearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.length > 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your planner...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-4">Failed to load planner entries</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <CalendarIcon className="w-7 h-7 text-blue-600" />
            <span>Planner</span>
          </h2>
          <p className="text-gray-600 mt-1">Organize your fitness journey and daily activities</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
                viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
              <span>List</span>
            </button>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search entries by title, description, or tags..."
          />
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filters.entry_type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, entry_type: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="workout">Workout</option>
                  <option value="meal">Meal</option>
                  <option value="reminder">Reminder</option>
                  <option value="note">Note</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setFilters(prev => ({ ...prev, date_range: undefined }))
                    } else if (value === 'today') {
                      const today = format(new Date(), 'yyyy-MM-dd')
                      setFilters(prev => ({ ...prev, date_range: { start: today, end: today } }))
                    } else if (value === 'week') {
                      const start = format(startOfWeek(new Date()), 'yyyy-MM-dd')
                      const end = format(endOfWeek(new Date()), 'yyyy-MM-dd')
                      setFilters(prev => ({ ...prev, date_range: { start, end } }))
                    } else if (value === 'upcoming') {
                      const today = format(new Date(), 'yyyy-MM-dd')
                      const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd')
                      setFilters(prev => ({ ...prev, date_range: { start: today, end: nextWeek } }))
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="upcoming">Next 7 Days</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-gray-600">
                  {filteredEntries.length} entries found
                </div>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      {viewMode === 'calendar' ? (
        <CalendarView
          entries={filteredEntries}
          onDateClick={handleDateClick}
          onEntryClick={handleEntryClick}
          onEntryMove={handleEntryMove}
          onToggleStatus={toggleStatus}
          selectedDate={selectedDate || undefined}
          loading={loading}
        />
      ) : (
        /* List View */
        <div className="space-y-6">
          {Object.keys(groupedEntries).length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No entries found</h3>
              <p className="text-gray-600 mb-4">
                {hasActiveFilters 
                  ? 'Try adjusting your filters or search terms'
                  : 'Start planning your day by adding your first entry'
                }
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Add Entry
              </button>
            </div>
          ) : (
            Object.entries(groupedEntries)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, dateEntries]) => (
                <div key={date} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">{formatDate(date)}</h3>
                    <p className="text-sm text-gray-600">{dateEntries.length} entries</p>
                  </div>
                  
                  <div className="p-4 sm:p-6">
                    <div className="space-y-4">
                      {dateEntries.map((entry) => {
                        const EntryIcon = getEntryIcon(entry.entry_type)
                        
                        return (
                          <div
                            key={entry.id}
                            className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${getStatusColor(entry.status)}`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="flex items-start space-x-3 flex-1">
                                <button
                                  onClick={() => toggleStatus(entry.id)}
                                  className="mt-1 flex-shrink-0"
                                >
                                  {entry.status === 'completed' ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-gray-400 hover:text-green-600 transition-colors duration-200" />
                                  )}
                                </button>
                                
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <div className={`w-3 h-3 rounded-full ${getEntryColor(entry.entry_type, entry.priority)}`}></div>
                                    <EntryIcon className="w-4 h-4 text-gray-600" />
                                    <h4 className={`font-semibold ${entry.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                      {entry.title}
                                    </h4>
                                    {entry.scheduled_time && (
                                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        <span>{formatTime(entry.scheduled_time)}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {entry.description && (
                                    <p className="text-gray-600 text-sm mb-2">{entry.description}</p>
                                  )}
                                  
                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className={`px-2 py-1 rounded-full font-medium ${
                                      entry.priority === 'high' ? 'bg-red-100 text-red-700' :
                                      entry.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {entry.priority} priority
                                    </span>
                                    
                                    {entry.tags.length > 0 && (
                                      <div className="flex items-center space-x-1">
                                        <Tag className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-500">
                                          {entry.tags.slice(0, 2).join(', ')}
                                          {entry.tags.length > 2 && ` +${entry.tags.length - 2}`}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {entry.is_recurring && (
                                      <div className="flex items-center space-x-1 text-blue-600">
                                        <Repeat className="w-3 h-3" />
                                        <span>{entry.recurrence_pattern}</span>
                                      </div>
                                    )}
                                    
                                    {entry.reminder_minutes && (
                                      <div className="flex items-center space-x-1 text-orange-600">
                                        <Bell className="w-3 h-3" />
                                        <span>{entry.reminder_minutes}m reminder</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2 ml-auto">
                                <button
                                  onClick={() => setEditingEntry(entry)}
                                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEntry(entry.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* Add/Edit Entry Modal */}
      {(showAddModal || editingEntry) && (
        <PlannerEntryModal
          entry={editingEntry}
          onSave={editingEntry ? handleUpdateEntry : handleCreateEntry}
          onClose={() => {
            setShowAddModal(false)
            setEditingEntry(null)
            setSelectedDate(null)
          }}
          defaultDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
        />
      )}
    </div>
  )
}

// Modal Component for Adding/Editing Entries
interface PlannerEntryModalProps {
  entry?: PlannerEntry | null
  onSave: (data: PlannerFormData) => void
  onClose: () => void
  defaultDate?: string
}

const PlannerEntryModal: React.FC<PlannerEntryModalProps> = ({ entry, onSave, onClose, defaultDate }) => {
  const [formData, setFormData] = useState<PlannerFormData>({
    title: entry?.title || '',
    description: entry?.description || '',
    entry_type: entry?.entry_type || 'reminder',
    scheduled_date: entry?.scheduled_date || defaultDate || format(new Date(), 'yyyy-MM-dd'),
    scheduled_time: entry?.scheduled_time || '',
    priority: entry?.priority || 'medium',
    tags: entry?.tags || [],
    metadata: entry?.metadata || {},
    reminder_minutes: entry?.reminder_minutes || undefined,
    is_recurring: entry?.is_recurring || false,
    recurrence_pattern: entry?.recurrence_pattern || undefined
  })
  
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setLoading(true)
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Failed to save entry:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {entry ? 'Edit Entry' : 'Add New Entry'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter entry title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter description (optional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={formData.entry_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, entry_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="workout">Workout</option>
                  <option value="meal">Meal</option>
                  <option value="reminder">Reminder</option>
                  <option value="note">Note</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time (optional)</label>
                <input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reminder (minutes before)</label>
                <input
                  type="number"
                  value={formData.reminder_minutes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, reminder_minutes: e.target.value ? parseInt(e.target.value) : undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 15"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recurring</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_recurring}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Repeat this entry</span>
                  </label>
                  
                  {formData.is_recurring && (
                    <select
                      value={formData.recurrence_pattern || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurrence_pattern: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select pattern</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a tag"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Add
                </button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="w-full sm:w-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{entry ? 'Update' : 'Create'} Entry</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PlannerSection