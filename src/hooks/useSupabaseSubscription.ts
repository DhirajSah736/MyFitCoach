import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useSupabaseSubscription<T>(
  table: string,
  filter?: { column: string; value: any }
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        let query = supabase.from(table).select('*')
        
        if (filter) {
          query = query.eq(filter.column, filter.value)
        }
        
        const { data: initialData, error } = await query
        
        if (error) throw error
        
        setData(initialData || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up real-time subscription
    const subscription = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter ? `${filter.column}=eq.${filter.value}` : undefined
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => [...prev, payload.new as T])
          } else if (payload.eventType === 'UPDATE') {
            setData(prev => prev.map(item => 
              (item as any).id === payload.new.id ? payload.new as T : item
            ))
          } else if (payload.eventType === 'DELETE') {
            setData(prev => prev.filter(item => (item as any).id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [table, filter?.column, filter?.value, user])

  return { data, loading, error, setData }
}