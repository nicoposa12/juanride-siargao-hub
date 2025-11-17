'use client'

import { useState, useEffect } from 'react'
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
  onFavoriteChange?: () => void | Promise<void>
}

export function VehicleCard({ vehicle, onFavoriteChange }: VehicleCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const imageUrl = vehicle.image_urls?.[0] || '/placeholder.svg'
  const vehicleType = VEHICLE_TYPE_LABELS[vehicle.type as keyof typeof VEHICLE_TYPE_LABELS] || vehicle.type

  // Load existing favorite status on mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user) {
        setInitialLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('vehicle_id', vehicle.id)
          .single()

        if (!error && data) {
          setIsFavorite(true)
        }
      } catch (error) {
        // No favorite found, keep false
      } finally {
        setInitialLoading(false)
      }
    }

    checkFavoriteStatus()
  }, [user, vehicle.id, supabase])

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
        
        // Call callback if provided
        if (onFavoriteChange) {
          await onFavoriteChange()
        }
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            vehicle_id: vehicle.id,
          })
        
        if (error) {
          throw error
        }
        
        setIsFavorite(true)
        toast({
          title: 'Added to favorites',
        })
        
        // Call callback if provided
        if (onFavoriteChange) {
          await onFavoriteChange()
        }
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
      <Card className="overflow-hidden card-gradient shadow-layered-md hover:shadow-layered-lg transition-all duration-500 h-full group hover:-translate-y-2 border-border/50 hover:border-primary-300/50 cursor-pointer">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted/20 to-muted/5">
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
          
          <Image
            src={imageUrl}
            alt={`${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Favorite Button - Enhanced interactivity */}
          <button
            onClick={toggleFavorite}
            disabled={loading || initialLoading}
            className={cn(
              "absolute top-3 right-3 p-2 sm:p-2.5 rounded-full bg-white shadow-layered-sm z-20",
              "hover:bg-white hover:shadow-layered-lg transition-all duration-300",
              "hover:scale-110 active:scale-95",
              isFavorite && "text-red-500 bg-red-50",
              (loading || initialLoading) && "opacity-50 cursor-not-allowed"
            )}
          >
            <Heart
              className={cn(
                "h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300",
                isFavorite && "fill-current scale-110 animate-pulse"
              )}
            />
          </button>

          {/* Vehicle Type Badge - Enhanced with animation */}
          <Badge className="absolute top-3 left-3 bg-primary-600 text-primary-foreground shadow-layered-sm border-0 z-20 group-hover:scale-105 transition-transform duration-300 text-xs sm:text-sm">
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
            <div className="text-2xl font-bold text-primary-700 group-hover:text-primary-600 transition-colors">
              {formatCurrency(vehicle.price_per_day)}
            </div>
            <div className="text-sm text-muted-foreground font-medium">per day</div>
          </div>

          <Button 
            size="sm" 
            className="shadow-layered-sm hover:shadow-layered-md bg-primary-600 hover:bg-primary-500 transition-all"
          >
            View Details
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}

