'use client'

import { useState } from 'react'
import { useVehicles } from '@/hooks/use-vehicles'
import VehicleFilters from './VehicleFilters'
import VehicleGrid from './VehicleGrid'
import { Loader2 } from 'lucide-react'
import type { VehicleFilters as Filters } from '@/types/vehicle.types'

export default function VehicleSearch() {
  const [filters, setFilters] = useState<Filters>({})
  const { data: vehicles, isLoading, error } = useVehicles(filters)

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters)
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-destructive">
          <p>Failed to load vehicles. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <VehicleFilters onFilterChange={handleFilterChange} />
        </div>

        {/* Vehicle Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <VehicleGrid vehicles={vehicles || []} />
          )}
        </div>
      </div>
    </div>
  )
}

