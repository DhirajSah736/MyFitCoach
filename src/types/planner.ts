export interface PlannerEntry {
  id: string
  user_id: string
  title: string
  description?: string
  entry_type: 'workout' | 'meal' | 'reminder' | 'note'
  scheduled_date: string
  scheduled_time?: string
  status: 'pending' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  metadata?: Record<string, any>
  reminder_minutes?: number
  is_recurring: boolean
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly'
  created_at: string
  updated_at: string
}

export interface PlannerFilters {
  entry_type?: string
  status?: string
  priority?: string
  date_range?: {
    start: string
    end: string
  }
  tags?: string[]
}

export interface PlannerFormData {
  title: string
  description?: string
  entry_type: 'workout' | 'meal' | 'reminder' | 'note'
  scheduled_date: string
  scheduled_time?: string
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  metadata?: Record<string, any>
  reminder_minutes?: number
  is_recurring: boolean
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly'
}