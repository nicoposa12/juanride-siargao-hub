'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, Star, MapPin, User } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { VEHICLE_TYPE_LABELS } from '@/lib/constants'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils/cn'

interface VehicleCardProps {
  vehicle: any
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const imageUrl = vehicle.image_urls?.[0] || '/placeholder.svg'
  const vehicleType = VEHICLE_TYPE_LABELS[vehicle.type as keyof typeof VEHICLE_TYPE_LABELS] || vehicle.type

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to save favorites.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('vehicle_id', vehicle.id)
        
        setIsFavorite(false)
        toast({
          title: 'Removed from favorites',
        })
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            vehicle_id: vehicle.id,
          })
        
        setIsFavorite(true)
        toast({
          title: 'Added to favorites',
        })
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast({
        title: 'Error',
        description: 'Failed to update favorites.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Link href={`/vehicles/${vehicle.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
        <div className="relative aspect-[4/3]">
          <Image
            src={imageUrl}
            alt={`${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Favorite Button */}
          <button
            onClick={toggleFavorite}
            disabled={loading}
            className={cn(
              "absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm",
              "hover:bg-white transition-colors",
              isFavorite && "text-red-500"
            )}
          >
            <Heart
              className={cn(
                "h-5 w-5",
                isFavorite && "fill-current"
              )}
            />
          </button>

          {/* Vehicle Type Badge */}
          <Badge className="absolute top-3 left-3 bg-primary">
            {vehicleType}
          </Badge>
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg line-clamp-1">
              {vehicle.make} {vehicle.model}
            </h3>

            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{vehicle.location || 'Siargao'}</span>
            </div>

            {vehicle.owner && (
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="h-4 w-4 mr-1" />
                <span>{vehicle.owner.full_name || 'Vehicle Owner'}</span>
              </div>
            )}

            {vehicle.average_rating !== undefined && (
              <div className="flex items-center text-sm">
                <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{vehicle.average_rating.toFixed(1)}</span>
                <span className="text-muted-foreground ml-1">
                  ({vehicle.total_reviews || 0} reviews)
                </span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(vehicle.price_per_day)}
            </div>
            <div className="text-sm text-muted-foreground">per day</div>
          </div>

          <Button size="sm">View Details</Button>
        </CardFooter>
      </Card>
    </Link>
  )
}

