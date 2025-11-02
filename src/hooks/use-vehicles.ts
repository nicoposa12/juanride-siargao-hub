'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle } from '@/lib/supabase/queries/vehicles'
import type { VehicleFilters } from '@/types/vehicle.types'
import { useToast } from './use-toast'

export function useVehicles(filters?: VehicleFilters) {
  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => getVehicles(filters),
  })
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
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
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
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
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
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
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

