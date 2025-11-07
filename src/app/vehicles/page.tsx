'use client'

import { Suspense, useState } from 'react'
import { VehicleHero } from '@/components/vehicle/VehicleHero'
import { VehicleCategoryTabs } from '@/components/vehicle/VehicleCategoryTabs'
import { VehicleNotificationBanner } from '@/components/vehicle/VehicleNotificationBanner'
import { VehicleFilters } from '@/components/vehicle/VehicleFilters'
import { VehicleGrid } from '@/components/vehicle/VehicleGrid'
import { Skeleton } from '@/components/ui/skeleton'
import Navigation from '@/components/shared/Navigation'
import VehicleRefreshButton from '@/components/vehicle/VehicleRefreshButton'

interface SearchParams {
  type?: string
  minPrice?: string
  maxPrice?: string
  location?: string
  startDate?: string
  endDate?: string
  search?: string
  page?: string
}

interface VehiclesPageProps {
  searchParams: SearchParams
}

export default function VehiclesPage({ searchParams }: VehiclesPageProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Navigation */}
      <Navigation />
      
      {/* Hero Section */}
      <VehicleHero 
        initialSearch={searchParams.search} 
        onFiltersToggle={() => setShowMobileFilters(!showMobileFilters)}
      />
      
      {/* Notification Banner */}
      <VehicleNotificationBanner />
      
      {/* Category Tabs */}
      <Suspense fallback={<div className="bg-white border-b h-16" />}>
        <VehicleCategoryTabs selectedCategory={searchParams.type} />
      </Suspense>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className={`lg:col-span-1 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-36 space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <VehicleFilters initialFilters={searchParams} />
              </Suspense>
              
              {/* Refresh Button */}
              <div className="pt-4 border-t">
                <VehicleRefreshButton />
              </div>
            </div>
          </aside>

          {/* Vehicle Grid */}
          <main className="lg:col-span-3">
            <Suspense
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full" />
                  ))}
                </div>
              }
            >
              <VehicleGrid filters={searchParams} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}
