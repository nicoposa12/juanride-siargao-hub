'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { SinoTrackCredentials } from './SinoTrackCredentials'
import { Save, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { VEHICLE_TYPES, SIARGAO_LOCATIONS } from '@/lib/constants'

interface VehicleFormProps {
  initialData?: any
  isEditing?: boolean
}

// Form state cache key
const FORM_CACHE_KEY = 'vehicle_form_draft'

export function VehicleForm({ initialData, isEditing = false }: VehicleFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [isFormLoaded, setIsFormLoaded] = useState(false)
  const [showDraftNotice, setShowDraftNotice] = useState(false)
  const [initialDraft, setInitialDraft] = useState<any>(null)
  
  // Form state - will be initialized in useEffect
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
  
  // SinoTrack GPS tracking credentials
  const [sinotrackDeviceId, setSinotrackDeviceId] = useState(initialData?.sinotrack_device_id || '')
  const [sinotrackAccount, setSinotrackAccount] = useState(initialData?.sinotrack_account || '')
  const [sinotrackPassword, setSinotrackPassword] = useState(initialData?.sinotrack_password || '')
  
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
  
  // Load saved draft on mount (only for new vehicles)
  useEffect(() => {
    if (isEditing || isFormLoaded) return
    
    try {
      const saved = sessionStorage.getItem(FORM_CACHE_KEY)
      if (saved) {
        const draft = JSON.parse(saved)
        console.log('📝 Restored form draft from cache')
        
        // Restore all form fields from draft
        setType(draft.type || '')
        setMake(draft.make || '')
        setModel(draft.model || '')
        setYear(draft.year || '')
        setPlateNumber(draft.plateNumber || '')
        setDescription(draft.description || '')
        setLocation(draft.location || '')
        setPricePerDay(draft.pricePerDay || '')
        setPricePerWeek(draft.pricePerWeek || '')
        setPricePerMonth(draft.pricePerMonth || '')
        setRentalTerms(draft.rentalTerms || '')
        setImageUrls(draft.imageUrls || [])
        setFeatures(draft.features || {
          helmet_included: false,
          phone_holder: false,
          storage_box: false,
          gps_enabled: false,
          bluetooth: false,
          usb_charging: false,
        })
        
        setInitialDraft(draft)
        setShowDraftNotice(true)
      }
    } catch (err) {
      console.error('Failed to load form draft:', err)
    }
    
    setIsFormLoaded(true)
  }, [isEditing, isFormLoaded])
  
  // Auto-save form state to sessionStorage with debouncing (only for new vehicles)
  useEffect(() => {
    if (isEditing || !isFormLoaded) return
    
    // Debounce the save to avoid excessive writes
    const timeoutId = setTimeout(() => {
      const formState = {
        type,
        make,
        model,
        year,
        plateNumber,
        description,
        location,
        pricePerDay,
        pricePerWeek,
        pricePerMonth,
        rentalTerms,
        imageUrls,
        features,
        savedAt: Date.now(),
      }
      
      try {
        sessionStorage.setItem(FORM_CACHE_KEY, JSON.stringify(formState))
        console.log('💾 Form draft auto-saved')
      } catch (err) {
        console.error('Failed to save form draft:', err)
      }
    }, 1000) // Save after 1 second of inactivity
    
    return () => clearTimeout(timeoutId)
  }, [
    type, make, model, year, plateNumber, description, location,
    pricePerDay, pricePerWeek, pricePerMonth, rentalTerms, imageUrls,
    features, isEditing, isFormLoaded
  ])
  
  // Clear draft on successful submission
  const clearFormDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(FORM_CACHE_KEY)
      setShowDraftNotice(false)
      console.log('🧹 Cleared form draft')
    } catch (err) {
      console.error('Failed to clear form draft:', err)
    }
  }, [])
  
  const handleClearDraft = () => {
    clearFormDraft()
    // Reset all form fields
    setType('')
    setMake('')
    setModel('')
    setYear('')
    setPlateNumber('')
    setDescription('')
    setLocation('')
    setPricePerDay('')
    setPricePerWeek('')
    setPricePerMonth('')
    setRentalTerms('')
    setImageUrls([])
    setSinotrackDeviceId('')
    setSinotrackAccount('')
    setSinotrackPassword('')
    setFeatures({
      helmet_included: false,
      phone_holder: false,
      storage_box: false,
      gps_enabled: false,
      bluetooth: false,
      usb_charging: false,
    })
    toast({
      title: 'Draft Cleared',
      description: 'Your form draft has been cleared.',
    })
  }
  
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
      
      // Validate SinoTrack fields consistency
      const hasSinotrackFields = sinotrackDeviceId || sinotrackAccount || sinotrackPassword
      const hasAllSinotrackFields = sinotrackDeviceId && sinotrackAccount && sinotrackPassword
      
      if (hasSinotrackFields && !hasAllSinotrackFields) {
        toast({
          title: 'Incomplete GPS Tracking Setup',
          description: 'Please fill in all SinoTrack fields (Device ID, Account, Password) or leave them all empty.',
          variant: 'destructive',
        })
        return
      }
      
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
        sinotrack_device_id: sinotrackDeviceId || null,
        sinotrack_account: sinotrackAccount || null,
        sinotrack_password: sinotrackPassword || null,
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
        
        // Clear the draft after successful submission
        clearFormDraft()
        
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
      
      {/* Draft Restored Notice */}
      {showDraftNotice && !isEditing && (
        <Alert className="border-blue-500 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-blue-900">
              Draft restored - Your form data has been recovered from a previous session.
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearDraft}
              className="ml-4 text-blue-600 hover:text-blue-800"
            >
              Clear Draft
            </Button>
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
      
      {/* SinoTrack GPS Tracking */}
      <SinoTrackCredentials
        deviceId={sinotrackDeviceId}
        account={sinotrackAccount}
        password={sinotrackPassword}
        onDeviceIdChange={setSinotrackDeviceId}
        onAccountChange={setSinotrackAccount}
        onPasswordChange={setSinotrackPassword}
      />
      
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

