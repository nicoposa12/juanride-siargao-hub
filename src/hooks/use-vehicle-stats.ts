'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface VehicleStats {
  totalAvailable: number
  byCategory: Record<string, number>
  loading: boolean
  error: string | null
}

export function useVehicleStats() {
  const [stats, setStats] = useState<VehicleStats>({
    totalAvailable: 0,
    byCategory: {},
    loading: true,
    error: null
  })

  useEffect(() => {
    fetchVehicleStats()
  }, [])

  const fetchVehicleStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }))
      
      const supabase = createClient()
      
      // Get total available vehicles
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('type')
        .eq('approval_status', 'approved')
        .eq('status', 'available')
      
      if (error) throw error
      
      // Calculate stats
      const totalAvailable = vehicles.length
      const byCategory: Record<string, number> = {}
      
      // Count by category
      vehicles.forEach(vehicle => {
        const type = vehicle.type || 'other'
        byCategory[type] = (byCategory[type] || 0) + 1
      })
      
      // Also count for 'all' category
      byCategory[''] = totalAvailable
      
      setStats({
        totalAvailable,
        byCategory,
        loading: false,
        error: null
      })
      
    } catch (error: any) {
      console.error('Error fetching vehicle stats:', error)
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch vehicle stats'
      }))
    }
  }

  return {
    ...stats,
    refresh: fetchVehicleStats
  }
}
