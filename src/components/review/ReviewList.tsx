'use client'

import { useState, useEffect } from 'react'
import { ReviewCard } from './ReviewCard'
import { ReviewForm } from './ReviewForm'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MessageSquare, Info } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'

interface ReviewListProps {
  vehicleId: string
  reviews: any[]
}

interface UserBooking {
  id: string
  status: string
}

export function ReviewList({ vehicleId, reviews }: ReviewListProps) {
  const { user } = useAuth()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [userBookings, setUserBookings] = useState<UserBooking[]>([])
  const [loading, setLoading] = useState(false)
  
  // Check if user has already reviewed this vehicle
  const userHasReviewed = user ? reviews.some(r => r.reviewer?.id === user.id) : false
  
  // Get completed bookings for this vehicle by the current user
  useEffect(() => {
    const getUserBookings = async () => {
      if (!user || !vehicleId) return
      
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('bookings')
          .select('id, status')
          .eq('renter_id', user.id)
          .eq('vehicle_id', vehicleId)
          .eq('status', 'completed')
          
        if (!error && data) {
          setUserBookings(data)
        }
      } catch (error) {
        console.error('Error fetching user bookings:', error)
      } finally {
        setLoading(false)
      }
    }
    
    getUserBookings()
  }, [user, vehicleId])
  
  // Find a booking that hasn't been reviewed yet
  const availableBookingForReview = userBookings.find(booking => 
    !reviews.some(review => review.booking_id === booking.id)
  )
  
  // Can user write a review?
  const canWriteReview = user && !userHasReviewed && availableBookingForReview
  
  if (reviews.length === 0 && !user) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p>No reviews yet.</p>
      </div>
    )
  }
  
  if (reviews.length === 0 && user) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground mb-4">No reviews yet.</p>
        
        {/* Show review form or info based on user's booking status */}
        {canWriteReview && !showReviewForm && (
          <Button onClick={() => setShowReviewForm(true)}>
            Write a Review
          </Button>
        )}
        
        {canWriteReview && showReviewForm && (
          <ReviewForm
            bookingId={availableBookingForReview!.id}
            vehicleId={vehicleId}
            onCancel={() => setShowReviewForm(false)}
            onSuccess={() => {
              setShowReviewForm(false)
              window.location.reload() // Refresh to show new review
            }}
          />
        )}
        
        {user && !canWriteReview && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {userHasReviewed 
                ? "You have already reviewed this vehicle." 
                : "You can only review vehicles after completing a rental."}
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Write Review Button */}
      {canWriteReview && !showReviewForm && (
        <Button onClick={() => setShowReviewForm(true)} className="w-full">
          Write a Review
        </Button>
      )}
      
      {/* Review Form */}
      {canWriteReview && showReviewForm && (
        <ReviewForm
          bookingId={availableBookingForReview!.id}
          vehicleId={vehicleId}
          onCancel={() => setShowReviewForm(false)}
          onSuccess={() => {
            setShowReviewForm(false)
            window.location.reload() // Refresh to show new review
          }}
        />
      )}
      
      {/* Info for users who can't review */}
      {user && !canWriteReview && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {userHasReviewed 
              ? "You have already reviewed this vehicle." 
              : "You can only review vehicles after completing a rental."}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}
