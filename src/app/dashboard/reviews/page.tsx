'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { Star, MessageSquare, ArrowLeft } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/shared/Navigation'
import { formatRelativeTime } from '@/lib/utils/format'

interface ReviewWithVehicle {
  id: string
  rating: number
  comment: string | null
  created_at: string
  vehicle: {
    id: string
    make: string | null
    model: string | null
    image_urls: string[] | null
    price_per_day?: number | null
  } | null
}

export default function RenterReviewsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [reviews, setReviews] = useState<ReviewWithVehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    loadReviews()
  }, [authLoading, user])

  const loadReviews = async () => {
    if (!user) return

    setLoading(true)
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(
          `id, rating, comment, created_at, vehicle:vehicles(id, make, model, image_urls, price_per_day)`
        )
        .eq('reviewer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews((data || []) as unknown as ReviewWithVehicle[])
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    )
  }

  if (!user) {
    router.push('/login?redirect=/dashboard/reviews')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="pt-20 container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">My Reviews</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full" />
              </Card>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertDescription>You have not written any reviews yet.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="overflow-hidden">
                <div className="grid md:grid-cols-[160px_1fr] gap-4">
                  {/* Vehicle Image */}
                  <div className="relative aspect-video md:aspect-square bg-gray-100">
                    {review.vehicle?.image_urls?.[0] && (
                      <Image
                        src={review.vehicle.image_urls[0]}
                        alt={`${review.vehicle.make} ${review.vehicle.model}`}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>

                  {/* Review Content */}
                  <CardContent className="p-6 space-y-2">
                    <div className="flex items-center gap-2 justify-between">
                      <Link
                        href={`/vehicles/${review.vehicle?.id}`}
                        className="text-lg font-semibold hover:underline"
                      >
                        {review.vehicle?.make} {review.vehicle?.model}
                      </Link>
                      <span className="text-sm text-muted-foreground">
                        {formatRelativeTime(review.created_at)}
                      </span>
                    </div>

                    {/* Rating stars */}
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                        />
                      ))}
                    </div>

                    {review.comment && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
