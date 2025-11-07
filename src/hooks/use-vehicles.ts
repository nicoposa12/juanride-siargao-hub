'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle } from '@/lib/supabase/queries/vehicles'
import type { VehicleFilters } from '@/types/vehicle.types'
import { useToast } from './use-toast'

export function useVehicles(filters?: VehicleFilters) {
  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => getVehicles(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes for vehicle listings (more real-time)
  })
}

// New hook for paginated vehicle search
export function useVehicleSearch(filters?: VehicleFilters, page: number = 1, limit: number = 12) {
  return useQuery({
    queryKey: ['vehicles', 'search', filters, page, limit],
    queryFn: async () => {
      const { searchVehicles } = await import('@/lib/supabase/queries/vehicles')
      return searchVehicles(filters, page, limit)
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for vehicle listings
  })
}

// Hook to manually invalidate vehicle cache (useful for admin actions)
export function useInvalidateVehicles() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    queryClient.invalidateQueries({ queryKey: ['vehicles', 'search'] })
  }
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => getVehicleById(id),
    enabled: !!id,
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      // Invalidate ALL vehicle-related queries
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles', 'search'] })
      toast({
        title: 'Success',
        description: 'Vehicle listed successfully. Awaiting admin approval.',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create vehicle listing.',
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updateVehicle(id, updates),
    onSuccess: (_data, variables) => {
      // Invalidate ALL vehicle-related queries
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles', 'search'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.id] })
      toast({
        title: 'Success',
        description: 'Vehicle updated successfully.',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update vehicle.',
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      // Invalidate ALL vehicle-related queries
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['vehicles', 'search'] })
      toast({
        title: 'Success',
        description: 'Vehicle deleted successfully.',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete vehicle.',
        variant: 'destructive',
      })
    },
  })
}

