'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Car } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { VehicleCard } from '@/components/vehicle/VehicleCard'
import Navigation from '@/components/shared/Navigation'

interface FavoriteVehicle {
  id: string
  user_id: string
  vehicle_id: string
  created_at: string
  vehicles: any
}

export default function FavoritesPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadFavorites()
    }
  }, [user, authLoading, router])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          vehicles (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading favorites:', error)
        return
      }

      setFavorites(data || [])
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Redirect if not logged in (handled in useEffect, but this is a fallback)
  if (!user) {
    return null
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 rounded-lg p-2">
                <Heart className="h-6 w-6 text-primary fill-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Favorites</h1>
                <p className="text-muted-foreground">
                  Vehicles you've saved for later
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your favorites...</p>
              </div>
            </div>
          ) : favorites.length === 0 ? (
            <Card className="text-center py-12">
              <CardHeader>
                <div className="mx-auto mb-4 bg-muted rounded-full p-6 w-fit">
                  <Heart className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl mb-2">No favorites yet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start exploring vehicles and save your favorites by clicking the heart icon on any vehicle card.
                </p>
                <Button onClick={() => router.push('/vehicles')} className="gap-2">
                  <Car className="h-4 w-4" />
                  Browse Vehicles
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Results count */}
              <div className="mb-6">
                <p className="text-muted-foreground">
                  {favorites.length} {favorites.length === 1 ? 'vehicle' : 'vehicles'} saved
                </p>
              </div>

              {/* Favorites Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favorites.map((favorite) => (
                  <VehicleCard 
                    key={favorite.id} 
                    vehicle={favorite.vehicles}
                    onFavoriteChange={loadFavorites}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
