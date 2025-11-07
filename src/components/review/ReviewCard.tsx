'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Star, User } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils/format'

interface ReviewCardProps {
  review: any
}

export function ReviewCard({ review }: ReviewCardProps) {
  const reviewer = review.reviewer
  const rating = review.rating || 0
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={reviewer?.profile_image_url} />
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">
                  {reviewer?.full_name || 'Anonymous User'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatRelativeTime(review.created_at)}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {review.comment && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {review.comment}
              </p>
            )}
            
            {/* Additional rating categories (if available) */}
            {(review.cleanliness_rating || review.condition_rating || review.value_rating || review.communication_rating) && (
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                {review.cleanliness_rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cleanliness</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{review.cleanliness_rating}</span>
                    </div>
                  </div>
                )}
                {review.condition_rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Condition</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{review.condition_rating}</span>
                    </div>
                  </div>
                )}
                {review.value_rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Value</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{review.value_rating}</span>
                    </div>
                  </div>
                )}
                {review.communication_rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Communication</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{review.communication_rating}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
