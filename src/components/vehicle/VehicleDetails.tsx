'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MapPin, 
  Star, 
  Calendar, 
  Shield, 
  CheckCircle2,
  User,
  Phone,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { VEHICLE_TYPE_LABELS } from '@/lib/constants'
import { useAuth } from '@/hooks/use-auth'
import { BookingWidget } from '@/components/booking/BookingWidget'
import { ReviewList } from '@/components/review/ReviewList'

interface VehicleDetailsProps {
  vehicle: any
}

export function VehicleDetails({ vehicle }: VehicleDetailsProps) {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  const images = vehicle.image_urls || ['/placeholder.svg']
  const features = vehicle.features || {}
  const vehicleType = VEHICLE_TYPE_LABELS[vehicle.type as keyof typeof VEHICLE_TYPE_LABELS] || vehicle.type
  
  // Calculate average rating from reviews
  const reviews = vehicle.reviews || []
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
    : 0
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }
  
  const handleBookNow = () => {
    if (!user) {
      router.push(`/login?redirect=/vehicles/${vehicle.id}`)
      return
    }
    
    // Scroll to booking widget
    document.getElementById('booking-widget')?.scrollIntoView({ behavior: 'smooth' })
  }
  
  const isOwner = profile?.id === vehicle.owner_id
  const isAdmin = profile?.role === 'admin'
  const isRenter = profile?.role === 'renter'
  const canBook = isRenter && !isOwner
  
  return (
    <div className="min-h-screen pb-12">
      {/* Back Button */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Search
          </Button>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="relative aspect-[16/10] bg-gray-100">
                <Image
                  src={images[currentImageIndex]}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  className="object-cover"
                  priority
                />
                
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex
                              ? 'bg-white w-8'
                              : 'bg-white/50 hover:bg-white/75'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
                
                <Badge className="absolute top-4 left-4 bg-primary text-white">
                  {vehicleType}
                </Badge>
              </div>
              
              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 p-4 bg-gray-50">
                  {images.slice(0, 4).map((img: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? 'border-primary'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      {index === 3 && images.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold">
                          +{images.length - 4}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </Card>
            
            {/* Vehicle Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl">
                      {vehicle.make} {vehicle.model}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2 text-base">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {vehicle.location || 'Siargao'}
                      </span>
                      {vehicle.year && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {vehicle.year}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {formatCurrency(vehicle.price_per_day)}
                    </div>
                    <div className="text-sm text-muted-foreground">per day</div>
                  </div>
                </div>
                
                {averageRating > 0 && (
                  <div className="flex items-center gap-2 pt-4">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 font-semibold">{averageRating.toFixed(1)}</span>
                    </div>
                    <span className="text-muted-foreground">
                      ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="space-y-6">
                <Separator />
                
                {/* Description */}
                {vehicle.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{vehicle.description}</p>
                  </div>
                )}
                
                {/* Features */}
                {Object.keys(features).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Features & Amenities</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(features).map(([key, value]) => {
                        if (value === true) {
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm capitalize">
                                {key.replace(/_/g, ' ')}
                              </span>
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>
                )}
                
                {/* Rental Terms */}
                {vehicle.rental_terms && (
                  <div>
                    <h3 className="font-semibold mb-2">Rental Terms</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {vehicle.rental_terms}
                    </p>
                  </div>
                )}
                
                {/* Pricing Options */}
                <div>
                  <h3 className="font-semibold mb-3">Pricing Options</h3>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Daily Rate</span>
                      <span className="font-semibold">{formatCurrency(vehicle.price_per_day)}</span>
                    </div>
                    {vehicle.price_per_week && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span>Weekly Rate</span>
                        <span className="font-semibold">{formatCurrency(vehicle.price_per_week)}</span>
                      </div>
                    )}
                    {vehicle.price_per_month && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span>Monthly Rate</span>
                        <span className="font-semibold">{formatCurrency(vehicle.price_per_month)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Owner Info */}
            {vehicle.owner && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Vehicle Owner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={vehicle.owner.profile_image_url} />
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold text-lg">
                        {vehicle.owner.full_name || 'Vehicle Owner'}
                      </div>
                      {vehicle.owner.phone_number && (
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Phone className="h-4 w-4" />
                          {vehicle.owner.phone_number}
                        </div>
                      )}
                    </div>
                    <Button variant="outline" asChild>
                      <Link href={`/profile/${vehicle.owner_id}`}>
                        View Profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewList vehicleId={vehicle.id} reviews={reviews} />
              </CardContent>
            </Card>
          </div>
          
          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24" id="booking-widget">
              {isOwner ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Vehicle</CardTitle>
                    <CardDescription>
                      This is your vehicle listing. Manage it from your dashboard.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex flex-col gap-2">
                    <Button asChild className="w-full">
                      <Link href={`/owner/vehicles/${vehicle.id}/edit`}>
                        Edit Listing
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/owner/dashboard">
                        Go to Dashboard
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ) : isAdmin ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Access</CardTitle>
                    <CardDescription>
                      Administrators cannot book vehicles. Use the admin dashboard to manage bookings.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/admin/dashboard">
                        Go to Admin Dashboard
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ) : canBook ? (
                <BookingWidget vehicle={vehicle} onBook={handleBookNow} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Booking Unavailable</CardTitle>
                    <CardDescription>
                      Only renters can book vehicles. Please sign in with a renter account to make a booking.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/login">
                        Sign In
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              )}
              
              {/* Trust & Safety */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Trust & Safety
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Verified vehicle owner</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Secure payment processing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>24/7 customer support</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Flexible cancellation policy</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
