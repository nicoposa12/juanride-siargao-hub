'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Star, 
  MapPin, 
  Calendar, 
  CheckCircle2,
  ArrowLeft,
  MessageCircle,
  Shield,
  Loader2,
  User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { formatCurrency } from '@/lib/utils/format'
import Navigation from '@/components/shared/Navigation'

interface OwnerProfile {
  id: string
  full_name: string | null
  profile_image_url: string | null
  phone_number: string | null
  created_at: string
  is_verified: boolean
}

interface VehicleListing {
  id: string
  make: string
  model: string
  year: number | null
  price_per_day: number
  image_urls: string[]
  type: string
  location: string | null
  average_rating: number | null
  total_reviews: number
}

export default function OwnerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  
  const ownerId = params?.id as string
  
  const [owner, setOwner] = useState<OwnerProfile | null>(null)
  const [vehicles, setVehicles] = useState<VehicleListing[]>([])
  const [loading, setLoading] = useState(true)
  const [averageRating, setAverageRating] = useState(0)
  const [totalTrips, setTotalTrips] = useState(0)
  const [joinDate, setJoinDate] = useState<Date | null>(null)
  
  useEffect(() => {
    fetchOwnerProfile()
  }, [ownerId])
  
  const fetchOwnerProfile = async () => {
    try {
      setLoading(true)
      
      // Fetch owner profile
      const { data: ownerData, error: ownerError } = await supabase
        .from('users')
        .select('id, full_name, profile_image_url, phone_number, created_at, is_verified')
        .eq('id', ownerId)
        .single()
      
      if (ownerError) throw ownerError
      
      setOwner(ownerData)
      setJoinDate(new Date(ownerData.created_at))
      
      // Fetch owner's vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select(`
          id,
          make,
          model,
          year,
          price_per_day,
          image_urls,
          type,
          location,
          reviews (
            rating
          )
        `)
        .eq('owner_id', ownerId)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
      
      if (vehiclesError) throw vehiclesError
      
      // Process vehicles with ratings
      const processedVehicles = vehiclesData.map((vehicle: any) => {
        const reviews = vehicle.reviews || []
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
          : null
        
        return {
          ...vehicle,
          average_rating: avgRating,
          total_reviews: reviews.length,
        }
      })
      
      setVehicles(processedVehicles)
      
      // Calculate overall statistics
      const allReviews = vehiclesData.flatMap((v: any) => v.reviews || [])
      if (allReviews.length > 0) {
        const overallRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length
        setAverageRating(overallRating)
      }
      
      // Fetch total completed trips
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .in('vehicle_id', vehiclesData.map((v: any) => v.id))
        .eq('status', 'completed')
      
      setTotalTrips(bookingsData?.length || 0)
      
    } catch (error) {
      console.error('Error fetching owner profile:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleContactOwner = () => {
    if (!user) {
      router.push(`/login?redirect=/profile/${ownerId}`)
      return
    }
    
    // Navigate to messages with owner
    router.push(`/messages?owner=${ownerId}`)
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (!owner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Owner Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The profile you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="pt-20">
        {/* Back Button */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Owner Profile Card */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                        <AvatarImage src={owner.profile_image_url || undefined} />
                        <AvatarFallback className="text-2xl">
                          {owner.full_name?.[0]?.toUpperCase() || <User className="h-10 w-10" />}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-2xl font-bold">
                            {owner.full_name || 'Vehicle Owner'}
                          </h1>
                          {owner.is_verified && (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        {joinDate && (
                          <div className="flex items-center gap-1 text-muted-foreground mt-1">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">
                              Joined {joinDate.toLocaleDateString('en-US', { 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <Separator />
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-2xl font-bold">
                          {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {averageRating > 0 ? 'Rating' : 'No ratings yet'}
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold mb-1">{totalTrips}</div>
                      <p className="text-xs text-muted-foreground">
                        {totalTrips === 1 ? 'Trip' : 'Trips'}
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold mb-1">{vehicles.length}</div>
                      <p className="text-xs text-muted-foreground">
                        {vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Verification Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Verification
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${owner.is_verified ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className="text-sm">
                          {owner.is_verified ? 'Identity verified' : 'Identity not verified'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Email confirmed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${owner.phone_number ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className="text-sm">
                          {owner.phone_number ? 'Phone number verified' : 'Phone number not added'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Vehicles Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    {owner.full_name?.split(' ')[0] || 'Owner'}'s Vehicles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {vehicles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No vehicles available at the moment.</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {vehicles.map((vehicle) => (
                        <Link
                          key={vehicle.id}
                          href={`/vehicles/${vehicle.id}`}
                          className="group block"
                        >
                          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="relative aspect-[4/3] bg-gray-100">
                              <Image
                                src={vehicle.image_urls?.[0] || '/placeholder.svg'}
                                alt={`${vehicle.make} ${vehicle.model}`}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold mb-1">
                                {vehicle.make} {vehicle.model}
                              </h3>
                              {vehicle.year && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {vehicle.year}
                                </p>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {vehicle.location || 'Siargao'}
                                  </span>
                                </div>
                                {vehicle.average_rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs font-medium">
                                      {vehicle.average_rating.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      ({vehicle.total_reviews})
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="mt-3 pt-3 border-t">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-lg font-bold text-primary">
                                    {formatCurrency(vehicle.price_per_day)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">/day</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {/* Contact Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Owner</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={handleContactOwner}
                      className="w-full gap-2"
                      size="lg"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Send Message
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Get in touch with {owner.full_name?.split(' ')[0] || 'the owner'} to ask questions about their vehicles
                    </p>
                  </CardContent>
                </Card>
                
                {/* Safety Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Safety Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Always inspect the vehicle before renting</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Communicate through the platform</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Never pay outside of JuanRide</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Report any suspicious activity</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
