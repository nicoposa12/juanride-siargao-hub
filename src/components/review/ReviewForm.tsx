'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

interface ReviewFormProps {
  bookingId?: string
  vehicleId: string
  onCancel?: () => void
  onSuccess?: () => void
  onReviewSubmitted?: () => void
}

export default function ReviewForm({ bookingId, vehicleId, onCancel, onSuccess, onReviewSubmitted }: ReviewFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to leave a review.',
        variant: 'destructive',
      })
      return
    }

    if (!bookingId) {
      toast({
        title: 'Booking Required',
        description: 'You can only review vehicles after completing a rental.',
        variant: 'destructive',
      })
      return
    }

    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a star rating.',
        variant: 'destructive',
      })
      return
    }

    if (!comment.trim()) {
      toast({
        title: 'Comment Required',
        description: 'Please write a review comment.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // Check if user has already reviewed this vehicle
      if (bookingId) {
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('booking_id', bookingId)
          .eq('reviewer_id', user.id)
          .single()

        if (existingReview) {
          toast({
            title: 'Already Reviewed',
            description: 'You have already submitted a review for this booking.',
            variant: 'destructive',
          })
          setIsSubmitting(false)
          return
        }
      }

      // Get vehicle owner ID
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('owner_id')
        .eq('id', vehicleId)
        .single()

      if (!vehicleData) {
        throw new Error('Vehicle not found')
      }

      // Create review
      const { error } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          reviewer_id: user.id,
          vehicle_id: vehicleId,
          owner_id: vehicleData.owner_id,
          rating,
          comment: comment.trim(),
        })

      if (error) throw error

      toast({
        title: 'Review Submitted!',
        description: 'Thank you for your feedback.',
      })

      // Reset form
      setRating(0)
      setComment('')

      // Notify parent component
      if (onSuccess) {
        onSuccess()
      }
      if (onReviewSubmitted) {
        onReviewSubmitted()
      }
    } catch (error: any) {
      console.error('Error submitting review:', error)
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit review. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>
          Share your experience with this vehicle rental
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div>
            <Label className="mb-2 block">Rating *</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment">Your Review *</Label>
            <Textarea
              id="comment"
              placeholder="Tell us about your experience with this vehicle..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              className="mt-2"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/1000 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0 || !comment.trim()}
              className={onCancel ? 'flex-1' : 'w-full'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Named export for compatibility with ReviewList
export { ReviewForm }
