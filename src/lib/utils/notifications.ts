import { createClient } from '../supabase/client'

export type NotificationType = 
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'payment_received'
  | 'review_received'
  | 'message_received'
  | 'listing_approved'
  | 'listing_rejected'
  | 'maintenance_due'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: CreateNotificationParams) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      link,
      is_read: false,
    })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { success: false, error }
  }
}

// Helper functions for common notifications
export async function notifyBookingConfirmed(userId: string, bookingId: string, vehicleName: string) {
  return createNotification({
    userId,
    type: 'booking_confirmed',
    title: 'Booking Confirmed!',
    message: `Your booking for ${vehicleName} has been confirmed.`,
    link: `/booking-confirmation/${bookingId}`,
  })
}

export async function notifyNewBooking(ownerId: string, vehicleName: string, renterName: string) {
  return createNotification({
    userId: ownerId,
    type: 'booking_confirmed',
    title: 'New Booking Received',
    message: `${renterName} has booked your ${vehicleName}.`,
    link: '/owner/bookings',
  })
}

export async function notifyPaymentReceived(userId: string, amount: number) {
  return createNotification({
    userId,
    type: 'payment_received',
    title: 'Payment Received',
    message: `Payment of ₱${amount.toLocaleString('en-PH')} has been processed successfully.`,
  })
}

export async function notifyReviewReceived(ownerId: string, vehicleName: string) {
  return createNotification({
    userId: ownerId,
    type: 'review_received',
    title: 'New Review',
    message: `Your ${vehicleName} has received a new review.`,
    link: '/owner/vehicles',
  })
}

export async function notifyListingApproved(ownerId: string, vehicleName: string) {
  return createNotification({
    userId: ownerId,
    type: 'listing_approved',
    title: 'Listing Approved!',
    message: `Your ${vehicleName} listing has been approved and is now live.`,
    link: '/owner/vehicles',
  })
}

export async function notifyListingRejected(ownerId: string, vehicleName: string, reason: string) {
  return createNotification({
    userId: ownerId,
    type: 'listing_rejected',
    title: 'Listing Rejected',
    message: `Your ${vehicleName} listing was rejected. Reason: ${reason}`,
    link: '/owner/vehicles',
  })
}

export async function notifyNewMessage(userId: string, senderName: string, bookingId: string) {
  return createNotification({
    userId,
    type: 'message_received',
    title: 'New Message',
    message: `${senderName} sent you a message.`,
    link: `/messages/${bookingId}`,
  })
}

