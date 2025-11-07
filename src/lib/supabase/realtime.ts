/**
 * Supabase Realtime helpers for messaging and notifications
 */

import { createClient } from './client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Message {
  id: string
  booking_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: {
    id: string
    full_name: string | null
    email: string
  }
}

/**
 * Subscribe to messages for a specific booking
 */
export function subscribeToBookingMessages(
  bookingId: string,
  onMessage: (message: Message) => void
): RealtimeChannel {
  const supabase = createClient()

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
        console.log('New message:', payload.new)
        onMessage(payload.new as Message)
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to booking status changes
 */
export function subscribeToBookingUpdates(
  bookingId: string,
  onUpdate: (booking: any) => void
): RealtimeChannel {
  const supabase = createClient()

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
 * Unsubscribe from a realtime channel
 */
export async function unsubscribeChannel(channel: RealtimeChannel) {
  const supabase = createClient()
  await supabase.removeChannel(channel)
}

/**
 * Send a message to a booking
 */
export async function sendMessage(
  bookingId: string,
  senderId: string,
  receiverId: string,
  content: string
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('messages')
    .insert({
      booking_id: bookingId,
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim(),
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
 * Fetch all messages for a booking
 */
export async function getBookingMessages(bookingId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      booking_id,
      sender_id,
      content,
      created_at,
      sender:users!sender_id (
        id,
        full_name,
        email
      )
    `)
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    throw error
  }

  const normalizedMessages: Message[] = (data || []).map((message: any) => {
    const senderInfo = Array.isArray(message.sender)
      ? message.sender[0]
      : message.sender
    return {
      ...message,
      sender: senderInfo
        ? {
            id: senderInfo.id,
            full_name: senderInfo.full_name,
            email: senderInfo.email,
          }
        : undefined,
    }
  })

  return normalizedMessages
}
