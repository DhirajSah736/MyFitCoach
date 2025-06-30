import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useOptimisticUpdate<T extends { id: string }>(
  table: string,
  initialData: T[] = []
) {
  const [data, setData] = useState<T[]>(initialData)
  const [loading, setLoading] = useState(false)

  const optimisticAdd = useCallback(async (newItem: Omit<T, 'id'>) => {
    const tempId = `temp_${Date.now()}`
    const optimisticItem = { ...newItem, id: tempId } as T
    
    // Optimistically update UI
    setData(prev => [...prev, optimisticItem])
    setLoading(true)

    try {
      const { data: insertedData, error } = await supabase
        .from(table)
        .insert([newItem])
        .select()
        .single()

      if (error) throw error

      // Replace optimistic item with real data
      setData(prev => prev.map(item => 
        item.id === tempId ? insertedData : item
      ))
    } catch (error) {
      // Revert optimistic update on error
      setData(prev => prev.filter(item => item.id !== tempId))
      throw error
    } finally {
      setLoading(false)
    }
  }, [table])

  const optimisticUpdate = useCallback(async (id: string, updates: Partial<T>) => {
    // Optimistically update UI
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))
    setLoading(true)

    try {
      const { error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      // Revert optimistic update on error
      setData(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ))
      throw error
    } finally {
      setLoading(false)
    }
  }, [table])

  const optimisticDelete = useCallback(async (id: string) => {
    const itemToDelete = data.find(item => item.id === id)
    
    // Optimistically update UI
    setData(prev => prev.filter(item => item.id !== id))
    setLoading(true)

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      // Revert optimistic update on error
      if (itemToDelete) {
        setData(prev => [...prev, itemToDelete])
      }
      throw error
    } finally {
      setLoading(false)
    }
  }, [table, data])

  return {
    data,
    setData,
    loading,
    optimisticAdd,
    optimisticUpdate,
    optimisticDelete
  }
}