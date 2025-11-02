'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import BookingWidget from '@/components/booking/BookingWidget'
import { 
  MapPin, 
  Calendar, 
  Shield, 
  CheckCircle, 
  User,
  Phone,
  Mail,
  Star
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { VEHICLE_TYPE_LABELS } from '@/lib/constants'

interface VehicleDetailsProps {
  vehicle: any
}

export default function VehicleDetails({ vehicle }: VehicleDetailsProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  
  const images = vehicle.image_urls && vehicle.image_urls.length > 0
    ? vehicle.image_urls
    : ['/placeholder.svg']

  const vehicleType = VEHICLE_TYPE_LABELS[vehicle.type as keyof typeof VEHICLE_TYPE_LABELS] || vehicle.type
  const features = vehicle.features || {}

  const getOwnerInitials = () => {
    if (vehicle.owner?.full_name) {
      return vehicle.owner.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return 'O'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Vehicle Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[16/10] rounded-lg overflow-hidden">
              <Image
                src={images[selectedImage]}
                alt={`${vehicle.make} ${vehicle.model}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.slice(0, 4).map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === idx
                        ? 'border-primary'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`View ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 25vw, 16vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Title and Info */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {vehicle.make} {vehicle.model}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <Badge>{vehicleType}</Badge>
                  {vehicle.year && <span>{vehicle.year}</span>}
                  {vehicle.plate_number && <span>• {vehicle.plate_number}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{vehicle.location || 'Siargao Island'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">About this vehicle</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {vehicle.description || 'No description available.'}
              </p>
            </CardContent>
          </Card>

          {/* Features */}
          {Object.keys(features).length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">What's Included</h2>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(features).map(([key, value]) => (
                    value && (
                      <div key={key} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rental Terms */}
          {vehicle.rental_terms && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Rental Terms</h2>
                <p className="text-muted-foreground whitespace-pre-line">
                  {vehicle.rental_terms}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Owner Info */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Meet Your Host</h2>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={vehicle.owner?.profile_image_url || undefined} />
                  <AvatarFallback className="text-lg">
                    {getOwnerInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {vehicle.owner?.full_name || 'Vehicle Owner'}
                  </h3>
                  <p className="text-sm text-muted-foreground">Joined 2024</p>
                </div>
              </div>

              {vehicle.owner && (
                <div className="mt-4 space-y-2 text-sm">
                  {vehicle.owner.phone_number && (
                    <div className="flex items-center text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{vehicle.owner.phone_number}</span>
                    </div>
                  )}
                  {vehicle.owner.email && (
                    <div className="flex items-center text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>{vehicle.owner.email}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Booking Widget */}
        <div className="lg:col-span-1">
          <BookingWidget
            vehicleId={vehicle.id}
            pricePerDay={Number(vehicle.price_per_day)}
            pricePerWeek={vehicle.price_per_week ? Number(vehicle.price_per_week) : undefined}
            pricePerMonth={vehicle.price_per_month ? Number(vehicle.price_per_month) : undefined}
          />
        </div>
      </div>
    </div>
  )
}

