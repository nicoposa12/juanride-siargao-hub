import { Suspense } from 'react'
import Navigation from '@/components/shared/Navigation'
import Footer from '@/components/shared/Footer'
import VehicleSearch from '@/components/vehicle/VehicleSearch'
import { Skeleton } from '@/components/ui/skeleton'

export default function VehiclesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 mt-20">
        <div className="bg-gradient-to-r from-primary to-accent py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold text-white mb-4">
              Find Your Perfect Ride
            </h1>
            <p className="text-xl text-white/90">
              Browse available vehicles in Siargao Island
            </p>
          </div>
        </div>

        <Suspense fallback={<VehicleSearchSkeleton />}>
          <VehicleSearch />
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}

function VehicleSearchSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="lg:col-span-3">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

