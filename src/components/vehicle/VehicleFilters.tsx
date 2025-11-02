'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Search } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils/cn'
import { VEHICLE_TYPES, SIARGAO_LOCATIONS } from '@/lib/constants'
import type { VehicleFilters as Filters } from '@/types/vehicle.types'

interface VehicleFiltersProps {
  onFilterChange: (filters: Filters) => void
}

export default function VehicleFilters({ onFilterChange }: VehicleFiltersProps) {
  const [type, setType] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [searchQuery, setSearchQuery] = useState<string>('')

  const applyFilters = () => {
    const filters: Filters = {}
    
    if (type) filters.type = type as any
    if (location) filters.location = location
    if (minPrice) filters.minPrice = parseFloat(minPrice)
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice)
    if (startDate) filters.startDate = format(startDate, 'yyyy-MM-dd')
    if (endDate) filters.endDate = format(endDate, 'yyyy-MM-dd')
    if (searchQuery) filters.searchQuery = searchQuery

    onFilterChange(filters)
  }

  const clearFilters = () => {
    setType('')
    setLocation('')
    setMinPrice('')
    setMaxPrice('')
    setStartDate(undefined)
    setEndDate(undefined)
    setSearchQuery('')
    onFilterChange({})
  }

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Filter Vehicles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by make, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Vehicle Type */}
        <div className="space-y-2">
          <Label>Vehicle Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value={VEHICLE_TYPES.SCOOTER}>Scooter</SelectItem>
              <SelectItem value={VEHICLE_TYPES.MOTORCYCLE}>Motorcycle</SelectItem>
              <SelectItem value={VEHICLE_TYPES.CAR}>Car</SelectItem>
              <SelectItem value={VEHICLE_TYPES.VAN}>Van</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label>Location</Label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger>
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {SIARGAO_LOCATIONS.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label>Rental Dates</Label>
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Start Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : 'End Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  disabled={(date) => date < (startDate || new Date())}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <Label>Price Range (per day)</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-4">
          <Button onClick={applyFilters} className="w-full">
            Apply Filters
          </Button>
          <Button onClick={clearFilters} variant="outline" className="w-full">
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

