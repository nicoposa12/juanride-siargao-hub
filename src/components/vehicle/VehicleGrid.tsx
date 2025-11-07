'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { VehicleCard } from './VehicleCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useVehicleSearch } from '@/hooks/use-vehicles'
import type { VehicleFilters } from '@/types/vehicle.types'

interface VehicleGridProps {
  filters: {
    type?: string
    minPrice?: string
    maxPrice?: string
    location?: string
    startDate?: string
    endDate?: string
    search?: string
    page?: string
  }
}

export function VehicleGrid({ filters }: VehicleGridProps) {
  const router = useRouter()
  const currentPage = parseInt(filters.page || '1')
  const itemsPerPage = 12

  // Convert filters to VehicleFilters format
  const vehicleFilters: VehicleFilters = useMemo(() => {
    const convertedFilters: VehicleFilters = {}
    
    if (filters.type) {
      convertedFilters.type = filters.type.split(',')
    }
    if (filters.minPrice) {
      convertedFilters.minPrice = parseInt(filters.minPrice)
    }
    if (filters.maxPrice) {
      convertedFilters.maxPrice = parseInt(filters.maxPrice)
    }
    if (filters.location) {
      convertedFilters.location = filters.location
    }
    if (filters.startDate) {
      convertedFilters.startDate = filters.startDate
    }
    if (filters.endDate) {
      convertedFilters.endDate = filters.endDate
    }
    if (filters.search) {
      convertedFilters.searchQuery = filters.search
    }
    
    return convertedFilters
  }, [filters])

  // Use React Query for data fetching with cache invalidation
  const { 
    data: result, 
    isLoading: loading, 
    error,
    isError 
  } = useVehicleSearch(vehicleFilters, currentPage, itemsPerPage)

  const vehicles = result?.vehicles || []
  const total = result?.total || 0
  const hasMore = result?.hasMore || false
  
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('page', newPage.toString())
    router.push(`/vehicles?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(itemsPerPage)].map((_, i) => (
          <Skeleton key={i} className="h-96 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2 text-red-600">Error loading vehicles</h3>
        <p className="text-muted-foreground mb-6">
          Please try again later or refresh the page
        </p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
      </div>
    )
  }
  
  if (vehicles.length === 0) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2">No Vehicles Found</h3>
        <p className="text-muted-foreground mb-6">
          Try adjusting your filters or search criteria to find more results.
        </p>
        <Button onClick={() => router.push('/vehicles')}>
          Clear All Filters
        </Button>
      </div>
    )
  }
  
  const totalPages = Math.ceil(total / itemsPerPage)
  
  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, total)} of {total} vehicles
        </p>
      </div>
      
      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1
              // Show first, last, current, and adjacent pages
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="min-w-[2.5rem]"
                  >
                    {page}
                  </Button>
                )
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="px-2">...</span>
              }
              return null
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
