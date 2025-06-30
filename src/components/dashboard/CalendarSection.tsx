import React, { useState } from 'react'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Clock,
  Dumbbell,
  Apple,
  Bell
} from 'lucide-react'
import { CalendarEvent } from '../../types/dashboard'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'

const CalendarSection: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  // Mock events data
  const mockEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Upper Body Workout',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
      type: 'workout',
      status: 'scheduled',
      color: 'bg-purple-500'
    },
    {
      id: '2',
      title: 'Protein Smoothie',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '08:00',
      type: 'meal',
      status: 'completed',
      color: 'bg-green-500'
    },
    {
      id: '3',
      title: 'Cardio Session',
      date: format(addMonths(new Date(), 0), 'yyyy-MM-dd'),
      time: '18:00',
      type: 'workout',
      status: 'scheduled',
      color: 'bg-blue-500'
    }
  ]

  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents)
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    type: 'workout' as const,
    reminder: false
  })

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date))
  }

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setNewEvent(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }))
  }

  const handleAddEvent = () => {
    if (!newEvent.title) return

    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      date: newEvent.date,
      time: newEvent.time,
      type: newEvent.type,
      status: 'scheduled',
      color: newEvent.type === 'workout' ? 'bg-purple-500' : 'bg-green-500'
    }

    setEvents(prev => [...prev, event])
    setNewEvent({
      title: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
      type: 'workout',
      reminder: false
    })
    setShowEventModal(false)
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId))
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event)
    setNewEvent({
      title: event.title,
      date: event.date,
      time: event.time,
      type: event.type,
      reminder: false
    })
    setShowEventModal(true)
  }

  const getEventTypeIcon = (type: string) => {
    return type === 'workout' ? Dumbbell : Apple
  }

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'border-blue-200 bg-blue-50',
      completed: 'border-green-200 bg-green-50',
      missed: 'border-red-200 bg-red-50'
    }
    return colors[status as keyof typeof colors] || 'border-gray-200 bg-gray-50'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <CalendarIcon className="w-7 h-7 text-blue-600" />
            <span>Calendar</span>
          </h2>
          <p className="text-gray-600 mt-1">Schedule and track your workouts and meals</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                viewMode === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                viewMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Week
            </button>
          </div>
          <button
            onClick={() => setShowEventModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
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
            onClick={() => setCurrentDate(new Date())}
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
              const dayEvents = getEventsForDate(day)
              const isToday = isSameDay(day, new Date())
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  className={`min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                    !isSameMonth(day, currentDate) ? 'text-gray-400 bg-gray-50' : ''
                  } ${isToday ? 'bg-blue-50 border-blue-200' : ''} ${
                    isSelected ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className={`text-xs sm:text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => {
                      const EventIcon = getEventTypeIcon(event.type)
                      return (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded border ${getStatusColor(event.status)} flex items-center space-x-1 overflow-hidden`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditEvent(event)
                          }}
                        >
                          <EventIcon className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{event.title}</span>
                        </div>
                      )
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
        <div className="space-y-3">
          {getEventsForDate(new Date()).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No events scheduled for today</p>
          ) : (
            getEventsForDate(new Date()).map((event) => {
              const EventIcon = getEventTypeIcon(event.type)
              return (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border ${getStatusColor(event.status)} flex flex-wrap sm:flex-nowrap items-center justify-between gap-3`}
                >
                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <div className={`w-10 h-10 ${event.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <EventIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{event.time}</span>
                        <span className="capitalize">• {event.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-auto">
                    <button
                      onClick={() => handleEditEvent(event)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Add/Edit Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingEvent ? 'Edit Event' : 'Add Event'}
              </h3>
              <button
                onClick={() => {
                  setShowEventModal(false)
                  setEditingEvent(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Morning Workout"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="workout">Workout</option>
                  <option value="meal">Meal</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="reminder"
                  checked={newEvent.reminder}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, reminder: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="reminder" className="text-sm text-gray-700 flex items-center space-x-1">
                  <Bell className="w-4 h-4" />
                  <span>Set reminder</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEventModal(false)
                  setEditingEvent(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                disabled={!newEvent.title}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {editingEvent ? 'Update' : 'Add'} Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarSection