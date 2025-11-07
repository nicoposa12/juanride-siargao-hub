import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { VehicleDetails } from '@/components/vehicle/VehicleDetails'
import { Skeleton } from '@/components/ui/skeleton'
import { getVehicleById } from '@/lib/supabase/queries/vehicles'
import Navigation from '@/components/shared/Navigation'

interface VehiclePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: VehiclePageProps) {
  try {
    const vehicle = await getVehicleById(params.id)
    
    return {
      title: `${vehicle.make} ${vehicle.model} | JuanRide`,
      description: vehicle.description || `Rent this ${vehicle.type} in ${vehicle.location}`,
    }
  } catch {
    return {
      title: 'Vehicle Not Found | JuanRide',
    }
  }
}

export default async function VehiclePage({ params }: VehiclePageProps) {
  let vehicle
  
  try {
    vehicle = await getVehicleById(params.id)
  } catch (error) {
    notFound()
  }
  
  if (!vehicle) {
    notFound()
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-96 w-full mb-6" />
            <div className="grid lg:grid-cols-3 gap-6">
              <Skeleton className="h-64 lg:col-span-2" />
              <Skeleton className="h-64" />
            </div>
          </div>
        }
      >
        <VehicleDetails vehicle={vehicle} />
      </Suspense>
    </div>
  )
}
