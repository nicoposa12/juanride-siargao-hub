'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Calendar, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface VehicleSearchProps {
  initialFilters?: {
    search?: string
    location?: string
    startDate?: string
    endDate?: string
  }
}

export function VehicleSearch({ initialFilters = {} }: VehicleSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '')
  const [location, setLocation] = useState(initialFilters.location || '')
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialFilters.startDate ? new Date(initialFilters.startDate) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialFilters.endDate ? new Date(initialFilters.endDate) : undefined
  )

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (searchQuery) {
      params.set('search', searchQuery)
    } else {
      params.delete('search')
    }
    
    if (location) {
      params.set('location', location)
    } else {
      params.delete('location')
    }
    
    if (startDate) {
      params.set('startDate', format(startDate, 'yyyy-MM-dd'))
    } else {
      params.delete('startDate')
    }
    
    if (endDate) {
      params.set('endDate', format(endDate, 'yyyy-MM-dd'))
    } else {
      params.delete('endDate')
    }
    
    // Reset to page 1 when searching
    params.delete('page')
    
    router.push(`/vehicles?${params.toString()}`)
  }

  const handleReset = () => {
    setSearchQuery('')
    setLocation('')
    setStartDate(undefined)
    setEndDate(undefined)
    router.push('/vehicles')
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Query */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>

        {/* Location */}
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Location in Siargao"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>

        {/* Start Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !startDate && 'text-muted-foreground'
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'MMM dd, yyyy') : 'Start date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>

        {/* End Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !endDate && 'text-muted-foreground'
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, 'MMM dd, yyyy') : 'End date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
              disabled={(date) => date < (startDate || new Date())}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={handleReset}>
          Clear Filters
        </Button>
        <Button onClick={handleSearch}>
          Search Vehicles
        </Button>
      </div>
    </div>
  )
}
