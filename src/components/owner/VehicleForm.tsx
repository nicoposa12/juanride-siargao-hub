'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ImageUpload } from './ImageUpload'
import { Save, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { VEHICLE_TYPES, SIARGAO_LOCATIONS } from '@/lib/constants'

interface VehicleFormProps {
  initialData?: any
  isEditing?: boolean
}

export function VehicleForm({ initialData, isEditing = false }: VehicleFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [type, setType] = useState(initialData?.type || '')
  const [make, setMake] = useState(initialData?.make || '')
  const [model, setModel] = useState(initialData?.model || '')
  const [year, setYear] = useState(initialData?.year?.toString() || '')
  const [plateNumber, setPlateNumber] = useState(initialData?.plate_number || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [location, setLocation] = useState(initialData?.location || '')
  const [pricePerDay, setPricePerDay] = useState(initialData?.price_per_day?.toString() || '')
  const [pricePerWeek, setPricePerWeek] = useState(initialData?.price_per_week?.toString() || '')
  const [pricePerMonth, setPricePerMonth] = useState(initialData?.price_per_month?.toString() || '')
  const [rentalTerms, setRentalTerms] = useState(initialData?.rental_terms || '')
  const [imageUrls, setImageUrls] = useState<string[]>(initialData?.image_urls || [])
  
  // Features
  const [features, setFeatures] = useState<Record<string, boolean>>(
    initialData?.features || {
      helmet_included: false,
      phone_holder: false,
      storage_box: false,
      gps_enabled: false,
      bluetooth: false,
      usb_charging: false,
    }
  )
  
  const handleFeatureToggle = (feature: string) => {
    setFeatures(prev => ({ ...prev, [feature]: !prev[feature] }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to continue.',
        variant: 'destructive',
      })
      return
    }
    
    // Validation
    if (!type || !make || !model || !plateNumber || !pricePerDay) {
      toast({
        title: 'Required Fields Missing',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }
    
    if (imageUrls.length < 3) {
      toast({
        title: 'Images Required',
        description: 'Please upload at least 3 images of your vehicle.',
        variant: 'destructive',
      })
      return
    }
    
    setSubmitting(true)
    
    try {
      const supabase = createClient()
      
      const vehicleData = {
        owner_id: user.id,
        type,
        make,
        model,
        year: year ? parseInt(year) : null,
        plate_number: plateNumber,
        description,
        location,
        price_per_day: parseFloat(pricePerDay),
        price_per_week: pricePerWeek ? parseFloat(pricePerWeek) : null,
        price_per_month: pricePerMonth ? parseFloat(pricePerMonth) : null,
        rental_terms: rentalTerms || null,
        image_urls: imageUrls,
        features,
        status: 'available',
        is_approved: false, // Requires admin approval
      }
      
      if (isEditing && initialData?.id) {
        // Update existing vehicle
        const { error } = await supabase
          .from('vehicles')
          .update({ ...vehicleData, updated_at: new Date().toISOString() })
          .eq('id', initialData.id)
        
        if (error) throw error
        
        toast({
          title: 'Vehicle Updated',
          description: 'Your vehicle listing has been updated successfully.',
        })
        
        router.push('/owner/vehicles')
      } else {
        // Create new vehicle
        const { error } = await supabase
          .from('vehicles')
          .insert(vehicleData)
        
        if (error) throw error
        
        toast({
          title: 'Vehicle Added',
          description: 'Your vehicle has been submitted for approval.',
        })
        
        router.push('/owner/vehicles')
      }
    } catch (error: any) {
      console.error('Error saving vehicle:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save vehicle.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Back Button */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Vehicles
      </Button>
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isEditing ? 'Update your vehicle information' : 'List your vehicle for rent'}
        </p>
      </div>
      
      {/* Approval Alert */}
      {!isEditing && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your vehicle listing will be reviewed by our admin team before it becomes visible to renters.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Provide the essential details about your vehicle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Vehicle Type *</Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={VEHICLE_TYPES.SCOOTER}>Scooter</SelectItem>
                  <SelectItem value={VEHICLE_TYPES.MOTORCYCLE}>Motorcycle</SelectItem>
                  <SelectItem value={VEHICLE_TYPES.CAR}>Car</SelectItem>
                  <SelectItem value={VEHICLE_TYPES.VAN}>Van</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="plateNumber">Plate Number *</Label>
              <Input
                id="plateNumber"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="ABC-1234"
                required
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">Make/Brand *</Label>
              <Input
                id="make"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Honda, Toyota, etc."
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Click 125i, Vios, etc."
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2023"
                min="1990"
                max={new Date().getFullYear() + 1}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your vehicle, its condition, and any special features..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Location & Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Location & Pricing</CardTitle>
          <CardDescription>
            Set your rental rates and location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id="location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {SIARGAO_LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricePerDay">Daily Rate (₱) *</Label>
              <Input
                id="pricePerDay"
                type="number"
                value={pricePerDay}
                onChange={(e) => setPricePerDay(e.target.value)}
                placeholder="500"
                min="0"
                step="50"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pricePerWeek">Weekly Rate (₱)</Label>
              <Input
                id="pricePerWeek"
                type="number"
                value={pricePerWeek}
                onChange={(e) => setPricePerWeek(e.target.value)}
                placeholder="3000"
                min="0"
                step="100"
              />
              <p className="text-xs text-muted-foreground">
                Optional discount for weekly rentals
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pricePerMonth">Monthly Rate (₱)</Label>
              <Input
                id="pricePerMonth"
                type="number"
                value={pricePerMonth}
                onChange={(e) => setPricePerMonth(e.target.value)}
                placeholder="10000"
                min="0"
                step="500"
              />
              <p className="text-xs text-muted-foreground">
                Optional discount for monthly rentals
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Features & Amenities</CardTitle>
          <CardDescription>
            Select the features included with your vehicle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="helmet"
                checked={features.helmet_included}
                onCheckedChange={() => handleFeatureToggle('helmet_included')}
              />
              <label htmlFor="helmet" className="text-sm font-medium cursor-pointer">
                Helmet Included
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="phone"
                checked={features.phone_holder}
                onCheckedChange={() => handleFeatureToggle('phone_holder')}
              />
              <label htmlFor="phone" className="text-sm font-medium cursor-pointer">
                Phone Holder
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="storage"
                checked={features.storage_box}
                onCheckedChange={() => handleFeatureToggle('storage_box')}
              />
              <label htmlFor="storage" className="text-sm font-medium cursor-pointer">
                Storage Box
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="gps"
                checked={features.gps_enabled}
                onCheckedChange={() => handleFeatureToggle('gps_enabled')}
              />
              <label htmlFor="gps" className="text-sm font-medium cursor-pointer">
                GPS Enabled
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bluetooth"
                checked={features.bluetooth}
                onCheckedChange={() => handleFeatureToggle('bluetooth')}
              />
              <label htmlFor="bluetooth" className="text-sm font-medium cursor-pointer">
                Bluetooth
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="usb"
                checked={features.usb_charging}
                onCheckedChange={() => handleFeatureToggle('usb_charging')}
              />
              <label htmlFor="usb" className="text-sm font-medium cursor-pointer">
                USB Charging
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Images *</CardTitle>
          <CardDescription>
            Upload at least 3 clear photos of your vehicle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUpload
            images={imageUrls}
            onChange={setImageUrls}
            maxImages={20}
            minImages={3}
          />
        </CardContent>
      </Card>
      
      {/* Rental Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Rental Terms</CardTitle>
          <CardDescription>
            Specify your rental conditions and requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={rentalTerms}
            onChange={(e) => setRentalTerms(e.target.value)}
            placeholder="e.g., Valid driver's license required, minimum 1 day rental, security deposit..."
            rows={4}
          />
        </CardContent>
      </Card>
      
      {/* Submit */}
      <Card>
        <CardFooter className="flex gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Update Vehicle' : 'Add Vehicle'}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

