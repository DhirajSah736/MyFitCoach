import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { PlannerEntry, PlannerFilters } from '../types/planner'

export function usePlannerEntries(filters?: PlannerFilters) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<PlannerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch entries with filters
  const fetchEntries = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('planner_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })

      // Apply filters
      if (filters?.entry_type) {
        query = query.eq('entry_type', filters.entry_type)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters?.date_range) {
        query = query
          .gte('scheduled_date', filters.date_range.start)
          .lte('scheduled_date', filters.date_range.end)
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }

      const { data, error } = await query

      if (error) throw error

      setEntries(data || [])
    } catch (err) {
      console.error('Error fetching planner entries:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch entries')
    } finally {
      setLoading(false)
    }
  }, [user, filters])

  // Create new entry
  const createEntry = useCallback(async (entryData: Omit<PlannerEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('planner_entries')
        .insert([{
          ...entryData,
          user_id: user.id
        }])
        .select()
        .single()

      if (error) throw error

      setEntries(prev => [...prev, data].sort((a, b) => {
        const dateCompare = new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
        if (dateCompare !== 0) return dateCompare
        
        const timeA = a.scheduled_time || '00:00:00'
        const timeB = b.scheduled_time || '00:00:00'
        return timeA.localeCompare(timeB)
      }))

      return data
    } catch (err) {
      console.error('Error creating planner entry:', err)
      throw err
    }
  }, [user])

  // Update entry
  const updateEntry = useCallback(async (id: string, updates: Partial<PlannerEntry>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('planner_entries')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setEntries(prev => prev.map(entry => 
        entry.id === id ? { ...entry, ...data } : entry
      ))

      return data
    } catch (err) {
      console.error('Error updating planner entry:', err)
      throw err
    }
  }, [user])

  // Delete entry
  const deleteEntry = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { error } = await supabase
        .from('planner_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      setEntries(prev => prev.filter(entry => entry.id !== id))
    } catch (err) {
      console.error('Error deleting planner entry:', err)
      throw err
    }
  }, [user])

  // Toggle entry status
  const toggleStatus = useCallback(async (id: string) => {
    const entry = entries.find(e => e.id === id)
    if (!entry) return

    const newStatus = entry.status === 'completed' ? 'pending' : 'completed'
    await updateEntry(id, { status: newStatus })
  }, [entries, updateEntry])

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return

    fetchEntries()

    const subscription = supabase
      .channel('planner_entries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'planner_entries',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEntries(prev => {
              const newEntries = [...prev, payload.new as PlannerEntry]
              return newEntries.sort((a, b) => {
                const dateCompare = new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
                if (dateCompare !== 0) return dateCompare
                
                const timeA = a.scheduled_time || '00:00:00'
                const timeB = b.scheduled_time || '00:00:00'
                return timeA.localeCompare(timeB)
              })
            })
          } else if (payload.eventType === 'UPDATE') {
            setEntries(prev => prev.map(entry => 
              entry.id === payload.new.id ? payload.new as PlannerEntry : entry
            ))
          } else if (payload.eventType === 'DELETE') {
            setEntries(prev => prev.filter(entry => entry.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, fetchEntries])

  return {
    entries,
    loading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    toggleStatus,
    refetch: fetchEntries
  }
}