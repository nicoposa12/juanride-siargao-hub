'use client'

import VehicleCard from './VehicleCard'
import { AlertCircle } from 'lucide-react'

interface VehicleGridProps {
  vehicles: any[]
}

export default function VehicleGrid({ vehicles }: VehicleGridProps) {
  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Vehicles Found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters to find more results.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <p className="text-muted-foreground">
          {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'} found
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </div>
  )
}

