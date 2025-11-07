'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getUserBookings, 
  getBookingById, 
  createBooking, 
  updateBookingStatus,
  cancelBooking,
  type CreateBookingData,
} from '@/lib/supabase/queries/bookings'
import type { BookingStatus } from '@/types/booking.types'
import { useToast } from './use-toast'
import { useAuth } from './use-auth'

export function useUserBookings() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: () => getUserBookings(user!.id),
    enabled: !!user?.id,
  })
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBookingById(id),
    enabled: !!id,
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (bookingData: CreateBookingData) => 
      createBooking(user!.id, bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast({
        title: 'Booking Created',
        description: 'Your booking has been created successfully.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Booking Failed',
        description: error.message || 'Failed to create booking.',
        variant: 'destructive',
      })
    },
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled.',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to cancel booking.',
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      updateBookingStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['booking', variables.id] })
      toast({
        title: 'Status Updated',
        description: 'Booking status has been updated.',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update booking status.',
        variant: 'destructive',
      })
    },
  })
}

