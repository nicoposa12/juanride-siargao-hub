'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, Calendar, MapPin, Loader2, CheckCircle2, IdCard, Eye, Info } from 'lucide-react'
import { formatCurrency, formatDate, calculateDays } from '@/lib/utils/format'
import { getVehicleById } from '@/lib/supabase/queries/vehicles'
import { createBooking } from '@/lib/supabase/queries/bookings'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { VEHICLE_TYPES_REQUIRING_ID, ID_DOCUMENT_TYPE_LABELS } from '@/lib/constants'
import type { Database } from '@/types/database.types'
import { getIdDocumentSignedUrl } from '@/lib/supabase/storage'

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading: authLoading } = useAuth()
  const { toast } = useToast()
  
  const vehicleId = searchParams?.get('vehicle')
  const startDate = searchParams?.get('start')
  const endDate = searchParams?.get('end')
  
  const [vehicle, setVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [identityDocs, setIdentityDocs] = useState<Database['public']['Tables']['id_documents']['Row'][]>([])
  const [identityDocsLoading, setIdentityDocsLoading] = useState(false)
  const [selectedIdentityDocId, setSelectedIdentityDocId] = useState<string | null>(null)
  const [identityRequirementError, setIdentityRequirementError] = useState<string | null>(null)
  
  // Form state
  const [pickupLocation, setPickupLocation] = useState('')
  const [returnLocation, setReturnLocation] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  
  useEffect(() => {
    if (!authLoading) {
      // Prevent admin and owner from booking
      if (profile?.role === 'admin') {
        toast({
          title: 'Booking Not Allowed',
          description: 'Administrators cannot book vehicles.',
          variant: 'destructive',
        })
        router.push('/admin/dashboard')
        return
      }
      
      if (profile?.role === 'owner') {
        toast({
          title: 'Booking Not Allowed',
          description: 'Owners cannot book vehicles.',
          variant: 'destructive',
        })
        router.push('/owner/dashboard')
        return
      }
      
      if (profile && profile.role !== 'renter') {
        toast({
          title: 'Renter Account Required',
          description: 'Only renters can book vehicles.',
          variant: 'destructive',
        })
        router.push('/vehicles')
        return
      }
    }
  }, [profile, authLoading, router, toast])
  
  useEffect(() => {
    if (!vehicleId || !startDate || !endDate) {
      toast({
        title: 'Invalid Request',
        description: 'Missing required booking information.',
        variant: 'destructive',
      })
      router.push('/vehicles')
      return
    }
    
    loadVehicle()
  }, [vehicleId, startDate, endDate])

  useEffect(() => {
    if (!user) {
      setIdentityDocs([])
      return
    }

    const fetchIdentityDocs = async () => {
      setIdentityDocsLoading(true)
      const { data, error } = await createClient()
        .from('id_documents')
        .select('*')
        .eq('renter_id', user.id)
        .eq('status', 'approved')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Failed to load identity documents:', error)
        toast({
          title: 'Unable to load identity documents',
          description: error.message,
          variant: 'destructive',
        })
        setIdentityDocs([])
      } else {
        setIdentityDocs(data ?? [])
      }

      setIdentityDocsLoading(false)
    }

    fetchIdentityDocs()
  }, [toast, user])

  useEffect(() => {
    if (selectedIdentityDocId) return
    if (identityDocs.length > 0) {
      setSelectedIdentityDocId(identityDocs[0].id)
    }
  }, [identityDocs, selectedIdentityDocId])
  
  const loadVehicle = async () => {
    if (!vehicleId) return
    
    try {
      const vehicleData = await getVehicleById(vehicleId)
      if (!vehicleData) {
        throw new Error('Vehicle not found')
      }
      setVehicle(vehicleData)
      setPickupLocation(vehicleData.location || '')
      setReturnLocation(vehicleData.location || '')
    } catch (error) {
      console.error('Error loading vehicle:', error)
      toast({
        title: 'Error',
        description: 'Failed to load vehicle details.',
        variant: 'destructive',
      })
      router.push('/vehicles')
    } finally {
      setLoading(false)
    }
  }
  
  const calculatePrice = () => {
    if (!vehicle || !startDate || !endDate) return { days: 0, subtotal: 0, serviceFee: 0, total: 0 }
    
    const days = calculateDays(new Date(startDate), new Date(endDate))
    let subtotal = 0
    
    // Calculate based on pricing tiers
    if (vehicle.price_per_month && days >= 28) {
      const months = Math.floor(days / 28)
      const remainingDays = days % 28
      subtotal = (months * vehicle.price_per_month) + (remainingDays * vehicle.price_per_day)
    } else if (vehicle.price_per_week && days >= 7) {
      const weeks = Math.floor(days / 7)
      const remainingDays = days % 7
      subtotal = (weeks * vehicle.price_per_week) + (remainingDays * vehicle.price_per_day)
    } else {
      subtotal = days * vehicle.price_per_day
    }
    
    const serviceFee = subtotal * 0.05 // 5% service fee
    const total = subtotal + serviceFee
    
    return { days, subtotal, serviceFee, total }
  }
  
  const requiresIdentity = Boolean(
    vehicle?.type && VEHICLE_TYPES_REQUIRING_ID.includes(
      vehicle.type as (typeof VEHICLE_TYPES_REQUIRING_ID)[number]
    )
  )

  const handleViewIdentityDocument = async (docId: string) => {
    const doc = identityDocs.find((d) => d.id === docId)
    if (!doc) return

    try {
      const signedUrl = await getIdDocumentSignedUrl(doc.file_path)
      if (!signedUrl) throw new Error('Unable to generate secure link')
      window.open(signedUrl, '_blank', 'noopener,noreferrer')
    } catch (error: any) {
      toast({
        title: 'Unable to open document',
        description: error.message || 'Try again later.',
        variant: 'destructive',
      })
    }
  }

  const handleBooking = async () => {
    // Check authentication first
    if (!user) {
      const currentParams = new URLSearchParams()
      currentParams.set('vehicle', vehicleId || '')
      currentParams.set('start', startDate || '')
      currentParams.set('end', endDate || '')
      const redirectUrl = `/checkout?${currentParams.toString()}`
      
      router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`)
      return
    }
    
    // Prevent admin and owner from booking
    if (profile?.role === 'admin' || profile?.role === 'owner') {
      toast({
        title: 'Booking Not Allowed',
        description: 'Only renters can book vehicles.',
        variant: 'destructive',
      })
      if (profile?.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/owner/dashboard')
      }
      return
    }
    
    if (profile && profile.role !== 'renter') {
      toast({
        title: 'Renter Account Required',
        description: 'You must have a renter account to book vehicles.',
        variant: 'destructive',
      })
      router.push('/vehicles')
      return
    }
    
    if (!vehicle || !startDate || !endDate) return
    
    if (!pickupLocation.trim()) {
      toast({
        title: 'Pickup Location Required',
        description: 'Please specify where you will pick up the vehicle.',
        variant: 'destructive',
      })
      return
    }
    
    if (requiresIdentity) {
      if (identityDocsLoading) {
        toast({
          title: 'Loading ID documents',
          description: 'Please wait for your approved ID list to load.',
          variant: 'destructive',
        })
        return
      }

      const selectedDoc = selectedIdentityDocId
        ? identityDocs.find((doc) => doc.id === selectedIdentityDocId)
        : null

      if (!selectedDoc) {
        toast({
          title: 'Approved ID required',
          description: 'Upload and select an approved ID before booking this vehicle.',
          variant: 'destructive',
        })
        setIdentityRequirementError('An approved ID is required for this booking.')
        return
      }

      setIdentityRequirementError(null)
    }

    setProcessing(true)
    
    try {
      const pricing = calculatePrice()
      
      // Create booking
      const { booking, error: bookingError } = await createBooking(user.id, {
        vehicle_id: vehicle.id,
        start_date: startDate,
        end_date: endDate,
        total_price: pricing.total,
        pickup_location: pickupLocation,
        return_location: returnLocation || pickupLocation,
        special_requests: specialRequests || undefined,
      })
      
      if (bookingError || !booking) {
        throw new Error(bookingError?.message || 'Failed to create booking')
      }
      
      // Redirect to payment checkout page
      router.push(`/checkout/${booking.id}`)
    } catch (error: any) {
      console.error('Error creating booking:', error)
      toast({
        title: 'Booking Failed',
        description: error.message || 'Failed to create booking. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }
  
  if (!vehicle) {
    return null
  }
  
  const pricing = calculatePrice()
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground mt-2">
            Complete your booking for {vehicle.make} {vehicle.model}
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Details */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-32 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={vehicle.image_urls?.[0] || '/placeholder.svg'}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {vehicle.location}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Check-in</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatDate(startDate!)}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Check-out</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatDate(endDate!)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Rental Duration</Label>
                  <p className="font-medium">{pricing.days} {pricing.days === 1 ? 'day' : 'days'}</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Pickup & Return */}
            <Card>
              <CardHeader>
                <CardTitle>Pickup & Return</CardTitle>
                <CardDescription>
                  Specify where you'll pick up and return the vehicle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup">Pickup Location *</Label>
                  <Input
                    id="pickup"
                    placeholder="e.g., General Luna, Cloud 9"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="return">Return Location</Label>
                  <Input
                    id="return"
                    placeholder="Same as pickup"
                    value={returnLocation}
                    onChange={(e) => setReturnLocation(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="requests">Special Requests (Optional)</Label>
                  <Textarea
                    id="requests"
                    placeholder="Any special requirements or notes for the owner..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {requiresIdentity && (
              <Card>
                <CardHeader>
                  <CardTitle>Identity Verification</CardTitle>
                  <CardDescription>
                    Upload and select an approved government ID before booking cars or motorcycles.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-900">
                    <IdCard className="h-4 w-4" />
                    <AlertDescription>
                      Only verified IDs can be used for these vehicles. Manage IDs from your profile if needed.
                    </AlertDescription>
                  </Alert>

                  {identityDocsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading approved IDs...
                    </div>
                  ) : identityDocs.length === 0 ? (
                    <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      No approved IDs found. Visit your profile’s Identity tab to upload and get approved, then return here.
                      <div className="mt-3">
                        <Button variant="ghost" size="sm" onClick={() => router.push('/profile?tab=identity')}>
                          Manage IDs
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Select approved ID</span>
                        <Button variant="ghost" size="sm" onClick={() => router.push('/profile?tab=identity')}>
                          Manage IDs
                        </Button>
                      </div>
                      <RadioGroup
                        value={selectedIdentityDocId ?? undefined}
                        onValueChange={setSelectedIdentityDocId}
                        className="space-y-2"
                      >
                        {identityDocs.map((doc) => (
                          <label
                            key={doc.id}
                            className="flex items-center justify-between rounded-md border p-3 text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value={doc.id} />
                              <div>
                                <p className="font-medium">
                                  {ID_DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Approved {doc.reviewed_at ? new Date(doc.reviewed_at).toLocaleDateString() : ''}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                handleViewIdentityDocument(doc.id)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {identityRequirementError && (
                    <p className="text-sm text-destructive">{identityRequirementError}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Sidebar - Price Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle>Price Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formatCurrency(vehicle.price_per_day)} × {pricing.days} {pricing.days === 1 ? 'day' : 'days'}
                      </span>
                      <span>{formatCurrency(pricing.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Service fee (5%)</span>
                      <span>{formatCurrency(pricing.serviceFee)}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(pricing.total)}</span>
                  </div>
                  
                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <p className="font-medium mb-1">Booking Policy:</p>
                      <ul className="space-y-1 text-xs">
                        <li>✓ Instant confirmation</li>
                        <li>✗ No refunds, no cancellation</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter>
                  {!user && (
                    <Alert className="mb-4 w-full">
                      <AlertDescription>
                        You'll need to sign in to complete your booking. Don't worry - we'll save your details!
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button
                    onClick={handleBooking}
                    disabled={
                      processing ||
                      (requiresIdentity && (identityDocsLoading || !selectedIdentityDocId || identityDocs.length === 0))
                    }
                    className="w-full"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Booking...
                      </>
                    ) : !user ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Sign In to Continue
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Continue to Payment
                      </>
                    )}
                  </Button>
                  {requiresIdentity && (!selectedIdentityDocId || identityDocs.length === 0) && !identityDocsLoading && (
                    <p className="mt-2 text-xs text-destructive text-center">
                      Select an approved ID before continuing.
                    </p>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}

