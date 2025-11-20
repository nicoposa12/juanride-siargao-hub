'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bike, Car, Truck, X } from 'lucide-react'

const VEHICLE_TYPES = [
  { value: 'scooter', label: 'Scooter', icon: Bike },
  { value: 'motorcycle', label: 'Motorcycle', icon: Bike },
  { value: 'car', label: 'Car', icon: Car },
  { value: 'van', label: 'Van', icon: Truck },
]

interface VehicleFiltersProps {
  initialFilters?: {
    type?: string
    minPrice?: string
    maxPrice?: string
  }
}

const PRICE_MIN = 0
const PRICE_MAX = 10000

export function VehicleFilters({ initialFilters = {} }: VehicleFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const selectedTypes = initialFilters.type ? initialFilters.type.split(',') : []
  
  // Use state for reactive price slider
  const [priceRange, setPriceRange] = useState<[number, number]>([
    initialFilters.minPrice ? parseInt(initialFilters.minPrice) : PRICE_MIN,
    initialFilters.maxPrice ? parseInt(initialFilters.maxPrice) : PRICE_MAX
  ])
  
  // Sync state with URL params when they change
  useEffect(() => {
    const newMin = initialFilters.minPrice ? parseInt(initialFilters.minPrice) : PRICE_MIN
    const newMax = initialFilters.maxPrice ? parseInt(initialFilters.maxPrice) : PRICE_MAX
    setPriceRange([newMin, newMax])
  }, [initialFilters.minPrice, initialFilters.maxPrice])
  
  const handleTypeToggle = (type: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    const currentTypes = params.get('type')?.split(',').filter(Boolean) || []
    
    let newTypes: string[]
    if (currentTypes.includes(type)) {
      newTypes = currentTypes.filter(t => t !== type)
    } else {
      newTypes = [...currentTypes, type]
    }
    
    if (newTypes.length > 0) {
      params.set('type', newTypes.join(','))
    } else {
      params.delete('type')
    }
    
    params.delete('page')
    router.push(`/vehicles?${params.toString()}`)
  }
  
  const handlePriceChange = (values: number[]) => {
    setPriceRange([values[0], values[1]])
    
    const params = new URLSearchParams(searchParams?.toString() || '')
    
    // Only set price params if they differ from defaults
    if (values[0] > PRICE_MIN) {
      params.set('minPrice', values[0].toString())
    } else {
      params.delete('minPrice')
    }
    
    if (values[1] < PRICE_MAX) {
      params.set('maxPrice', values[1].toString())
    } else {
      params.delete('maxPrice')
    }
    
    params.delete('page')
    router.push(`/vehicles?${params.toString()}`)
  }
  
  const clearFilters = () => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    // Keep search, location, and date params
    const search = params.get('search')
    const location = params.get('location')
    const startDate = params.get('startDate')
    const endDate = params.get('endDate')
    
    const newParams = new URLSearchParams()
    if (search) newParams.set('search', search)
    if (location) newParams.set('location', location)
    if (startDate) newParams.set('startDate', startDate)
    if (endDate) newParams.set('endDate', endDate)
    
    router.push(`/vehicles?${newParams.toString()}`)
  }
  
  const activeFilterCount = selectedTypes.length + (priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX ? 1 : 0)
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vehicle Type */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Vehicle Type</Label>
          <div className="space-y-2">
            {VEHICLE_TYPES.map((type) => {
              const Icon = type.icon
              const isChecked = selectedTypes.includes(type.value)
              
              return (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.value}
                    checked={isChecked}
                    onCheckedChange={() => handleTypeToggle(type.value)}
                  />
                  <label
                    htmlFor={type.value}
                    className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    <Icon className="h-4 w-4" />
                    {type.label}
                  </label>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Price Range */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Price per Day</Label>
            <span className="text-sm text-muted-foreground">
              ₱{priceRange[0].toLocaleString()} - ₱{priceRange[1].toLocaleString()}
            </span>
          </div>
          <Slider
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={100}
            value={priceRange}
            onValueChange={(values) => setPriceRange([values[0], values[1]])}
            onValueCommit={handlePriceChange}
            className="w-full"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>₱{PRICE_MIN.toLocaleString()}</span>
            <span>₱{(PRICE_MAX / 1000).toFixed(0)}k+</span>
          </div>
        </div>
        
        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
