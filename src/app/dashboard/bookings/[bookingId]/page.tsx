import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

interface PageProps {
  params: { bookingId: string }
}

// Handles legacy /dashboard/bookings/:bookingId deep-links coming from notifications.
// It ensures the booking exists and the user is involved, then forwards the
// request to the canonical booking-confirmation page.
export default async function Page({ params }: PageProps) {
  const { bookingId } = params
  const supabase = createServerClient()

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id

  if (!userId) {
    redirect(`/login?redirect=/dashboard/bookings/${bookingId}`)
  }

  // Fetch booking and ensure current user is renter OR vehicle owner
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      renter_id,
      vehicle_id,
      vehicles!inner(owner_id)
    `)
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    console.error('Booking fetch error:', error)
    notFound()
  }

  const vehicleOwnerId = (booking as any).vehicles?.owner_id ?? (booking as any).vehicles?.[0]?.owner_id
  if (booking.renter_id !== userId && vehicleOwnerId !== userId) {
    // Not authorized – show 404 to prevent info leak
    console.error('User not authorized for booking:', { userId, renterId: booking.renter_id, vehicleOwnerId })
    notFound()
  }

  redirect(`/booking-confirmation/${bookingId}`)
}
