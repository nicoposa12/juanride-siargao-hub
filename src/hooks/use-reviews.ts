'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer: {
    id: string
    full_name: string | null
    email: string
    profile_image_url: string | null
  } | null
}

export function useReviews(vehicleId: string) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)

  const fetchReviews = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          reviewer:users!reviewer_id (
            id,
            full_name,
            email,
            profile_image_url
          )
        `)
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const reviewsData = data as Review[]
      setReviews(reviewsData)
      setTotalReviews(reviewsData.length)

      // Calculate average rating
      if (reviewsData.length > 0) {
        const sum = reviewsData.reduce((acc, review) => acc + review.rating, 0)
        setAverageRating(sum / reviewsData.length)
      } else {
        setAverageRating(0)
      }
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (vehicleId) {
      fetchReviews()
    }
  }, [vehicleId])

  return {
    reviews,
    loading,
    error,
    averageRating,
    totalReviews,
    refetch: fetchReviews,
  }
}

