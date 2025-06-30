import React, { useState, useMemo, useCallback } from 'react'
import { 
  ChevronLeft, 
  ChevronRight,
  Plus,
  MoreHorizontal,
  Clock,
  CheckCircle,
  Circle,
  X,
  Calendar as CalendarIcon,
  Dumbbell,
  Apple,
  Bell,
  MessageSquare,
  AlertTriangle,
  List,
  Grid,
  Grip
} from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  isToday,
  parseISO,
  getDay,
  startOfDay,
  addWeeks,
  subWeeks
} from 'date-fns'
import { PlannerEntry } from '../../types/planner'

interface CalendarViewProps {
  entries: PlannerEntry[]
  onDateClick: (date: Date) => void
  onEntryClick: (entry: PlannerEntry) => void
  onEntryMove: (entryId: string, newDate: string) => void
  onToggleStatus: (entryId: string) => void
  selectedDate?: Date
  loading?: boolean
}

type ViewMode = 'month' | 'week' | 'day'

const CalendarView: React.FC<CalendarViewProps> = ({
  entries,
  onDateClick,
  onEntryClick,
  onEntryMove,
  onToggleStatus,
  selectedDate,
  loading = false
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [draggedEntry, setDraggedEntry] = useState<PlannerEntry | null>(null)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)

  // Calculate date ranges based on view mode
  const dateRange = useMemo(() => {
    switch (viewMode) {
      case 'month':
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const calendarStart = startOfWeek(monthStart)
        const calendarEnd = endOfWeek(monthEnd)
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
      
      case 'week':
        const weekStart = startOfWeek(currentDate)
        const weekEnd = endOfWeek(currentDate)
        return eachDayOfInterval({ start: weekStart, end: weekEnd })
      
      case 'day':
        return [currentDate]
      
      default:
        return []
    }
  }, [currentDate, viewMode])

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const grouped: Record<string, PlannerEntry[]> = {}
    
    entries.forEach(entry => {
      const dateKey = entry.scheduled_date
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(entry)
    })

    // Sort entries within each date by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        const timeA = a.scheduled_time || '00:00:00'
        const timeB = b.scheduled_time || '00:00:00'
        return timeA.localeCompare(timeB)
      })
    })

    return grouped
  }, [entries])

  // Navigation functions
  const navigatePrevious = useCallback(() => {
    switch (viewMode) {
      case 'month':
        setCurrentDate(prev => subMonths(prev, 1))
        break
      case 'week':
        setCurrentDate(prev => subWeeks(prev, 1))
        break
      case 'day':
        setCurrentDate(prev => subDays(prev, 1))
        break
    }
  }, [viewMode])

  const navigateNext = useCallback(() => {
    switch (viewMode) {
      case 'month':
        setCurrentDate(prev => addMonths(prev, 1))
        break
      case 'week':
        setCurrentDate(prev => addWeeks(prev, 1))
        break
      case 'day':
        setCurrentDate(prev => addDays(prev, 1))
        break
    }
  }, [viewMode])

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  // Get entry icon and color
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
    
    return {
      bg: `bg-${color}-${intensity}`,
      text: `text-${color}-${intensity}`,
      border: `border-${color}-${intensity}`,
      light: `bg-${color}-100`
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, entry: PlannerEntry) => {
    setDraggedEntry(entry)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', entry.id)
  }

  const handleDragOver = (e: React.DragEvent, date: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDate(date)
  }

  const handleDragLeave = () => {
    setDragOverDate(null)
  }

  const handleDrop = (e: React.DragEvent, date: string) => {
    e.preventDefault()
    setDragOverDate(null)
    
    if (draggedEntry && draggedEntry.scheduled_date !== date) {
      onEntryMove(draggedEntry.id, date)
    }
    
    setDraggedEntry(null)
  }

  // Format time for display
  const formatTime = (timeString?: string) => {
    if (!timeString) return ''
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Get header title based on view mode
  const getHeaderTitle = () => {
    switch (viewMode) {
      case 'month':
        return format(currentDate, 'MMMM yyyy')
      case 'week':
        const weekStart = startOfWeek(currentDate)
        const weekEnd = endOfWeek(currentDate)
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy')
      default:
        return ''
    }
  }

  // Render entry component
  const renderEntry = (entry: PlannerEntry, isCompact = false) => {
    const EntryIcon = getEntryIcon(entry.entry_type)
    const colors = getEntryColor(entry.entry_type, entry.priority)
    
    return (
      <div
        key={entry.id}
        draggable
        onDragStart={(e) => handleDragStart(e, entry)}
        onClick={() => onEntryClick(entry)}
        className={`
          group relative p-1.5 sm:p-2 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md
          ${entry.status === 'completed' ? 'opacity-75' : ''}
          ${colors.light} ${colors.border} border-opacity-30
          ${isCompact ? 'text-xs' : 'text-sm'}
        `}
      >
        <div className="flex items-center space-x-1 overflow-hidden">
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Grip className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleStatus(entry.id)
              }}
              className="flex-shrink-0"
            >
              {entry.status === 'completed' ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : (
                <Circle className="w-3 h-3 text-gray-400 hover:text-green-600 transition-colors" />
              )}
            </button>
            <EntryIcon className={`w-3 h-3 ${colors.text}`} />
          </div>
          
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className={`font-medium truncate ${entry.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {entry.title}
            </div>
            {entry.scheduled_time && !isCompact && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{formatTime(entry.scheduled_time)}</span>
              </div>
            )}
          </div>
          
          {entry.priority === 'high' && (
            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
          )}
        </div>
      </div>
    )
  }

  // Render month view
  const renderMonthView = () => {
    const weeks = []
    for (let i = 0; i < dateRange.length; i += 7) {
      weeks.push(dateRange.slice(i, i + 7))
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 sm:p-4 text-center text-xs sm:text-sm font-medium text-gray-500 bg-gray-50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {dateRange.map((date) => {
            const dateKey = format(date, 'yyyy-MM-dd')
            const dayEntries = entriesByDate[dateKey] || []
            const isCurrentMonth = isSameMonth(date, currentDate)
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const isDragOver = dragOverDate === dateKey

            return (
              <div
                key={dateKey}
                onClick={() => onDateClick(date)}
                onDragOver={(e) => handleDragOver(e, dateKey)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, dateKey)}
                className={`
                  min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border-r border-b border-gray-200 cursor-pointer transition-all duration-200
                  ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white hover:bg-gray-50'}
                  ${isToday(date) ? 'bg-blue-50 border-blue-200' : ''}
                  ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                  ${isDragOver ? 'bg-blue-100 border-blue-300' : ''}
                `}
              >
                <div className={`text-xs sm:text-sm font-medium mb-1 ${
                  isToday(date) ? 'text-blue-600' : 
                  !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {format(date, 'd')}
                </div>
                
                <div className="space-y-1 overflow-y-auto max-h-[60px] sm:max-h-[100px] scrollbar-thin">
                  {dayEntries.slice(0, 3).map((entry) => renderEntry(entry, true))}
                  {dayEntries.length > 3 && (
                    <div className="text-xs text-center py-1 bg-gray-100 rounded-md text-gray-500">
                      +{dayEntries.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render week view
  const renderWeekView = () => {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {dateRange.map((date) => (
            <div
              key={format(date, 'yyyy-MM-dd')}
              className={`p-2 sm:p-4 text-center border-r border-gray-200 last:border-r-0 ${
                isToday(date) ? 'bg-blue-50' : 'bg-gray-50'
              }`}
            >
              <div className="text-xs sm:text-sm font-medium text-gray-500">
                {format(date, 'EEE')}
              </div>
              <div className={`text-sm sm:text-lg font-bold ${
                isToday(date) ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {format(date, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7 min-h-[300px] sm:min-h-[400px]">
          {dateRange.map((date) => {
            const dateKey = format(date, 'yyyy-MM-dd')
            const dayEntries = entriesByDate[dateKey] || []
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const isDragOver = dragOverDate === dateKey

            return (
              <div
                key={dateKey}
                onClick={() => onDateClick(date)}
                onDragOver={(e) => handleDragOver(e, dateKey)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, dateKey)}
                className={`
                  p-2 sm:p-3 border-r border-gray-200 last:border-r-0 cursor-pointer transition-all duration-200
                  ${isToday(date) ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                  ${isDragOver ? 'bg-blue-100' : ''}
                `}
              >
                <div className="space-y-2 overflow-y-auto max-h-[300px] sm:max-h-[400px] scrollbar-thin">
                  {dayEntries.map((entry) => renderEntry(entry))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render day view
  const renderDayView = () => {
    const dateKey = format(currentDate, 'yyyy-MM-dd')
    const dayEntries = entriesByDate[dateKey] || []
    const isDragOver = dragOverDate === dateKey

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          <p className="text-gray-600">{dayEntries.length} entries</p>
        </div>

        <div
          onDragOver={(e) => handleDragOver(e, dateKey)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, dateKey)}
          className={`
            space-y-3 min-h-[300px] p-4 rounded-lg border-2 border-dashed transition-all duration-200
            ${isDragOver ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}
          `}
        >
          {dayEntries.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No entries for this day</p>
              <button
                onClick={() => onDateClick(currentDate)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Entry
              </button>
            </div>
          ) : (
            dayEntries.map((entry) => renderEntry(entry))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={navigatePrevious}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            disabled={loading}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <h3 className="text-base sm:text-xl font-semibold text-gray-900 min-w-[150px] sm:min-w-[200px] text-center">
            {getHeaderTitle()}
          </h3>
          
          <button
            onClick={navigateNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            disabled={loading}
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            disabled={loading}
          >
            Today
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 self-start sm:self-auto">
          {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 capitalize ${
                viewMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
              disabled={loading}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      ) : (
        <>
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </>
      )}

      {/* Drag feedback */}
      {draggedEntry && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Moving: {draggedEntry.title}
        </div>
      )}
    </div>
  )
}

export default CalendarView