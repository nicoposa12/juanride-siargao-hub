'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import ImageUpload from '@/components/owner/ImageUpload'
import Link from 'next/link'

const VEHICLE_TYPES = ['Motorcycle', 'Scooter', 'Car', 'Van', 'Bicycle', 'E-Bike']
const FUEL_TYPES = ['Gasoline', 'Diesel', 'Electric', 'Hybrid']
const TRANSMISSIONS = ['Manual', 'Automatic', 'CVT']

const FEATURES = [
  'Air Conditioning',
  'Bluetooth',
  'GPS',
  'Helmet Included',
  'Phone Mount',
  'USB Charging',
  'Storage Box',
  'Rain Gear',
]

export default function NewVehiclePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<File[]>([])

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    description: '',
    capacity: 1,
    fuel_type: '',
    transmission: '',
    features: [] as string[],
    daily_rate: 0,
    weekly_rate: 0,
    monthly_rate: 0,
    location: 'General Luna, Siargao',
    min_rental_days: 1,
    max_rental_days: 30,
  })

  useEffect(() => {
    if (!authLoading && (!user || user.user_metadata?.role !== 'owner')) {
      toast({
        title: 'Access denied',
        description: 'You must be an owner to create vehicle listings',
        variant: 'destructive',
      })
      router.push('/')
    }
  }, [user, authLoading])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = []

    for (const image of images) {
      const fileExt = image.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `vehicle-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(filePath, image)

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        continue
      }

      const { data } = supabase.storage.from('vehicle-images').getPublicUrl(filePath)
      uploadedUrls.push(data.publicUrl)
    }

    return uploadedUrls
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Upload images
      const imageUrls = await uploadImages()

      if (imageUrls.length === 0) {
        throw new Error('Please upload at least one image')
      }

      // Create vehicle listing
      const { error } = await supabase.from('vehicles').insert({
        owner_id: user?.id,
        name: formData.name,
        type: formData.type,
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        license_plate: formData.license_plate,
        description: formData.description,
        capacity: formData.capacity,
        fuel_type: formData.fuel_type,
        transmission: formData.transmission,
        features: formData.features,
        daily_rate: formData.daily_rate,
        weekly_rate: formData.weekly_rate,
        monthly_rate: formData.monthly_rate,
        location: formData.location,
        image_url: imageUrls[0],
        images: imageUrls,
        min_rental_days: formData.min_rental_days,
        max_rental_days: formData.max_rental_days,
        status: 'pending',
        is_available: false, // Set to false until admin approves
      })

      if (error) throw error

      toast({
        title: 'Vehicle submitted!',
        description: 'Your listing is pending admin approval',
      })

      router.push('/owner/dashboard')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create listing',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => setStep(prev => Math.min(prev + 1, 5))
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name && formData.type && formData.brand && formData.model && formData.license_plate
      case 2:
        return formData.capacity > 0 && formData.fuel_type && formData.transmission
      case 3:
        return formData.daily_rate > 0
      case 4:
        return formData.location
      case 5:
        return images.length > 0
      default:
        return false
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.user_metadata?.role !== 'owner') return null

  const progress = (step / 5) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link href="/owner/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Add New Vehicle</CardTitle>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Step {step} of 5</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Basic Information</h3>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name">Vehicle Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Honda Click 150i"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Vehicle Type *</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brand">Brand *</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        placeholder="e.g., Honda"
                      />
                    </div>
                    <div>
                      <Label htmlFor="model">Model *</Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        placeholder="e.g., Click 150i"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="license_plate">License Plate *</Label>
                      <Input
                        id="license_plate"
                        value={formData.license_plate}
                        onChange={(e) => handleInputChange('license_plate', e.target.value)}
                        placeholder="e.g., ABC-1234"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your vehicle..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Specifications */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Specifications</h3>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="capacity">Passenger Capacity *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => handleInputChange('capacity', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="fuel_type">Fuel Type *</Label>
                    <Select value={formData.fuel_type} onValueChange={(value) => handleInputChange('fuel_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="transmission">Transmission *</Label>
                    <Select value={formData.transmission} onValueChange={(value) => handleInputChange('transmission', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transmission" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSMISSIONS.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Features</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {FEATURES.map(feature => (
                        <div key={feature} className="flex items-center space-x-2">
                          <Checkbox
                            id={feature}
                            checked={formData.features.includes(feature)}
                            onCheckedChange={() => handleFeatureToggle(feature)}
                          />
                          <Label htmlFor={feature} className="text-sm font-normal cursor-pointer">
                            {feature}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Pricing */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Pricing</h3>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="daily_rate">Daily Rate (₱) *</Label>
                    <Input
                      id="daily_rate"
                      type="number"
                      min="0"
                      step="50"
                      value={formData.daily_rate}
                      onChange={(e) => handleInputChange('daily_rate', parseFloat(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="weekly_rate">Weekly Rate (₱)</Label>
                    <Input
                      id="weekly_rate"
                      type="number"
                      min="0"
                      step="50"
                      value={formData.weekly_rate}
                      onChange={(e) => handleInputChange('weekly_rate', parseFloat(e.target.value))}
                      placeholder="Optional discount for weekly rentals"
                    />
                  </div>

                  <div>
                    <Label htmlFor="monthly_rate">Monthly Rate (₱)</Label>
                    <Input
                      id="monthly_rate"
                      type="number"
                      min="0"
                      step="50"
                      value={formData.monthly_rate}
                      onChange={(e) => handleInputChange('monthly_rate', parseFloat(e.target.value))}
                      placeholder="Optional discount for monthly rentals"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Location & Availability */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Location & Availability</h3>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g., General Luna, Siargao"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min_rental_days">Minimum Rental Days</Label>
                      <Input
                        id="min_rental_days"
                        type="number"
                        min="1"
                        value={formData.min_rental_days}
                        onChange={(e) => handleInputChange('min_rental_days', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_rental_days">Maximum Rental Days</Label>
                      <Input
                        id="max_rental_days"
                        type="number"
                        min="1"
                        value={formData.max_rental_days}
                        onChange={(e) => handleInputChange('max_rental_days', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Images */}
            {step === 5 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Photos</h3>
                <p className="text-sm text-muted-foreground">
                  Upload clear photos of your vehicle. The first image will be the main photo.
                </p>
                <ImageUpload images={images} onImagesChange={setImages} />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={step === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {step < 5 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid()}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isStepValid()}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Submit for Approval
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

