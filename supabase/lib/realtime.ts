/**
 * Supabase Realtime Utilities
 * Real-time subscriptions for messages, notifications, and booking updates
 */

import { supabase } from '@/supabase/config/supabaseClient'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { MessageWithSender } from '@/supabase/types'

/**
 * Subscribe to new messages for a specific booking
 */
export function subscribeToBookingMessages(
  bookingId: string,
  onMessage: (message: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`booking:${bookingId}:messages`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `booking_id=eq.${bookingId}`,
      },
      (payload) => {
        console.log('New message received:', payload.new)
        onMessage(payload.new)
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to booking status updates
 */
export function subscribeToBookingUpdates(
  bookingId: string,
  onUpdate: (booking: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`booking:${bookingId}:updates`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `id=eq.${bookingId}`,
      },
      (payload) => {
        console.log('Booking updated:', payload.new)
        onUpdate(payload.new)
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to user notifications
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`user:${userId}:notifications`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('New notification:', payload.new)
        onNotification(payload.new)
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to vehicle availability changes (for owners)
 */
export function subscribeToVehicleBookings(
  vehicleId: string,
  onBooking: (booking: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`vehicle:${vehicleId}:bookings`)
    .on(
      'postgres_changes',
      {
        event: '*', // All events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'bookings',
        filter: `vehicle_id=eq.${vehicleId}`,
      },
      (payload) => {
        console.log('Vehicle booking changed:', payload)
        onBooking(payload)
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to payment status updates
 */
export function subscribeToPaymentUpdates(
  bookingId: string,
  onPaymentUpdate: (payment: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`booking:${bookingId}:payment`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'payments',
        filter: `booking_id=eq.${bookingId}`,
      },
      (payload) => {
        console.log('Payment updated:', payload.new)
        onPaymentUpdate(payload.new)
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to all user messages (for inbox)
 */
export function subscribeToUserMessages(
  userId: string,
  onMessage: (message: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`user:${userId}:messages`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      },
      (payload) => {
        console.log('New message for user:', payload.new)
        onMessage(payload.new)
      }
    )
    .subscribe()

  return channel
}

/**
 * Unsubscribe from a channel
 */
export async function unsubscribeChannel(channel: RealtimeChannel) {
  await supabase.removeChannel(channel)
}

/**
 * Unsubscribe from all channels
 */
export async function unsubscribeAll() {
  await supabase.removeAllChannels()
}

/**
 * Send a message (mutation, but placed here for co-location with realtime)
 */
export async function sendMessage(
  bookingId: string,
  senderId: string,
  receiverId: string,
  content: string
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      booking_id: bookingId,
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim(),
      is_read: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    throw error
  }

  return data
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId)

  if (error) {
    console.error('Error marking message as read:', error)
    throw error
  }
}

/**
 * Mark all messages in a booking as read
 */
export async function markBookingMessagesAsRead(
  bookingId: string,
  userId: string
) {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('booking_id', bookingId)
    .eq('receiver_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking messages as read:', error)
    throw error
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    throw error
  }
}
