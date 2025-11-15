import { useState } from 'react'
import { useAuth } from './use-auth'
import { createClient } from '@/lib/supabase/client'

export interface NotificationData {
  userEmail: string
  userName: string
  [key: string]: any
}

export const useNotifications = () => {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const sendEmailNotification = async (type: string, data: NotificationData) => {
    if (!user) {
      console.error('❌ Cannot send notification: User not authenticated')
      return { success: false, error: 'User not authenticated' }
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send notification')
      }

      console.log('✅ Email notification sent:', type)
      return { success: true, id: result.id }
    } catch (error: any) {
      console.error('❌ Failed to send email notification:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const sendWelcomeEmail = async (userData: {
    userEmail: string
    userName: string
    role: 'renter' | 'owner'
  }) => {
    return sendEmailNotification('welcome', userData)
  }

  const sendBookingConfirmation = async (bookingData: {
    userEmail: string
    userName: string
    bookingId: string
    vehicleName: string
    startDate: string
    endDate: string
    totalPrice: number
    location: string
  }) => {
    return sendEmailNotification('booking_confirmation', bookingData)
  }

  const sendPaymentConfirmation = async (paymentData: {
    userEmail: string
    userName: string
    bookingId: string
    amount: number
    paymentMethod: string
    vehicleName: string
  }) => {
    return sendEmailNotification('payment_confirmation', paymentData)
  }

  // In-app notifications
  const createInAppNotification = async (notificationData: {
    userId: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    actionUrl?: string
    metadata?: Record<string, any>
  }) => {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notificationData.userId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          link: notificationData.actionUrl,
          metadata: notificationData.metadata,
          is_read: false,
        })
        .select()
        .single()

      if (error) throw error

      console.log('✅ In-app notification created:', data.id)
      return { success: true, notification: data }
    } catch (error: any) {
      console.error('❌ Failed to create in-app notification:', error)
      return { success: false, error: error.message }
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error

      console.log('✅ Notification marked as read:', notificationId)
      return { success: true }
    } catch (error: any) {
      console.error('❌ Failed to mark notification as read:', error)
      return { success: false, error: error.message }
    }
  }

  const getUserNotifications = async (userId: string, limit = 20) => {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { success: true, notifications: data }
    } catch (error: any) {
      console.error('❌ Failed to fetch notifications:', error)
      return { success: false, error: error.message }
    }
  }

  return {
    loading,
    sendWelcomeEmail,
    sendBookingConfirmation,
    sendPaymentConfirmation,
    createInAppNotification,
    markNotificationAsRead,
    getUserNotifications,
  }
}
