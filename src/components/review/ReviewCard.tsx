'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ReviewCardProps {
  rating: number
  comment: string
  created_at: string
  renter: {
    full_name: string
    profile_image_url?: string
  }
  images?: string[]
}

export default function ReviewCard({
  rating,
  comment,
  created_at,
  renter,
  images,
}: ReviewCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={renter.profile_image_url} alt={renter.full_name} />
            <AvatarFallback>{getInitials(renter.full_name)}</AvatarFallback>
          </Avatar>

          {/* Review Content */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{renter.full_name}</div>
                <div className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-muted text-muted'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Comment */}
            <p className="text-sm leading-relaxed">{comment}</p>

            {/* Images */}
            {images && images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Review image ${index + 1}`}
                    className="h-24 w-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

