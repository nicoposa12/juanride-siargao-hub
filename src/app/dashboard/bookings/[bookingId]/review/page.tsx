import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

interface PageProps {
  params: {
    bookingId: string
  }
}

/*
  Long-term handler for legacy /dashboard/bookings/:bookingId/review links.
  1. Validate the booking exists and belongs to the signed-in renter.
  2. Fetch the associated vehicle_id.
  3. Redirect to that vehicle's #reviews section.

  This approach keeps the old deep-link stable while moving users to the
  canonical review UI living on the vehicle details page.
*/
export default async function Page({ params }: PageProps) {
  const { bookingId } = params
  const supabase = createServerClient()

  /* Get current user */
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id

  if (!userId) {
    redirect(`/login?redirect=/dashboard/bookings/${bookingId}/review`)
  }

  // Fetch booking row + vehicle id
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, renter_id, vehicle_id')
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    notFound()
  }

  // Only renters themselves can access this shortcut.
  if (userId && booking.renter_id !== userId) {
    // If different user, fall back to generic booking-confirmation page
    redirect(`/booking-confirmation/${bookingId}`)
  }

  // Send the renter to the review section of the related vehicle
  redirect(`/vehicles/${booking.vehicle_id}#reviews`)
}
