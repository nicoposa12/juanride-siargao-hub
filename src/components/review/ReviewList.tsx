'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import ReviewCard from './ReviewCard'
import { Button } from '@/components/ui/button'
import { Star, AlertCircle } from 'lucide-react'

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  images: string[]
  renter: {
    full_name: string
    profile_image_url: string | null
  }
}

interface ReviewListProps {
  vehicleId: string
}

export default function ReviewList({ vehicleId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)

  useEffect(() => {
    fetchReviews()
  }, [vehicleId])

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          images,
          created_at,
          renter:users!reviews_renter_id_fkey (
            full_name,
            profile_image_url
          )
        `)
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setReviews(data || [])
      setTotalReviews(data?.length || 0)

      // Calculate average rating
      if (data && data.length > 0) {
        const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length
        setAverageRating(avg)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-sm text-muted-foreground">Loading reviews...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-muted text-muted'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">No reviews yet</p>
          <p className="text-muted-foreground">
            Be the first to review this vehicle after your rental!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              rating={review.rating}
              comment={review.comment}
              created_at={review.created_at}
              renter={{
                full_name: review.renter.full_name,
                profile_image_url: review.renter.profile_image_url || undefined,
              }}
              images={review.images}
            />
          ))}
        </div>
      )}
    </div>
  )
}

