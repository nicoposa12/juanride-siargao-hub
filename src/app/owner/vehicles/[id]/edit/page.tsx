'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save } from 'lucide-react'
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

export default function EditVehiclePage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    if (!authLoading && user) {
      fetchVehicle()
    }
  }, [user, authLoading, params.id])

  const fetchVehicle = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', params.id)
        .eq('owner_id', user?.id)
        .single()

      if (error) throw error

      if (!data) {
        toast({
          title: 'Not found',
          description: 'Vehicle not found or you do not have access',
          variant: 'destructive',
        })
        router.push('/owner/vehicles')
        return
      }

      setFormData({
        name: data.name,
        type: data.type,
        brand: data.brand,
        model: data.model,
        year: data.year,
        license_plate: data.license_plate,
        description: data.description || '',
        capacity: data.capacity,
        fuel_type: data.fuel_type,
        transmission: data.transmission,
        features: data.features || [],
        daily_rate: data.daily_rate,
        weekly_rate: data.weekly_rate || 0,
        monthly_rate: data.monthly_rate || 0,
        location: data.location,
        min_rental_days: data.min_rental_days || 1,
        max_rental_days: data.max_rental_days || 30,
      })
    } catch (error) {
      console.error('Error fetching vehicle:', error)
      toast({
        title: 'Error',
        description: 'Failed to load vehicle',
        variant: 'destructive',
      })
      router.push('/owner/vehicles')
    } finally {
      setLoading(false)
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
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
          min_rental_days: formData.min_rental_days,
          max_rental_days: formData.max_rental_days,
        })
        .eq('id', params.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Vehicle updated successfully',
      })

      router.push('/owner/vehicles')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update vehicle',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link href="/owner/vehicles">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vehicles
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Edit Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Basic Information</h3>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name">Vehicle Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Vehicle Type *</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue />
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
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="model">Model *</Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        required
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
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-4 pt-6 border-t">
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
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fuel_type">Fuel Type *</Label>
                      <Select value={formData.fuel_type} onValueChange={(value) => handleInputChange('fuel_type', value)}>
                        <SelectTrigger>
                          <SelectValue />
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
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRANSMISSIONS.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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

              {/* Pricing */}
              <div className="space-y-4 pt-6 border-t">
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
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weekly_rate">Weekly Rate (₱)</Label>
                      <Input
                        id="weekly_rate"
                        type="number"
                        min="0"
                        step="50"
                        value={formData.weekly_rate}
                        onChange={(e) => handleInputChange('weekly_rate', parseFloat(e.target.value))}
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
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Availability */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="font-semibold text-lg">Location & Availability</h3>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      required
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

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Link href="/owner/vehicles">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

