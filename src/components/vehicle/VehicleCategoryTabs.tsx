'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bike, Car, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVehicleStats } from '@/hooks/use-vehicle-stats'

const VEHICLE_CATEGORIES = [
  { value: '', label: 'All', icon: null },
  { value: 'scooter', label: 'Scooters', icon: Bike },
  { value: 'car', label: 'Cars', icon: Car },
  { value: 'van', label: 'Vans', icon: Truck },
  { value: 'motorcycle', label: 'Bikes', icon: Bike },
]

interface VehicleCategoryTabsProps {
  selectedCategory?: string
}

export function VehicleCategoryTabs({ 
  selectedCategory = ''
}: VehicleCategoryTabsProps) {
  const { byCategory: vehicleCounts, loading } = useVehicleStats()
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCategorySelect = (categoryValue: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (categoryValue) {
      params.set('type', categoryValue)
    } else {
      params.delete('type')
    }
    
    // Reset to page 1 when filtering
    params.delete('page')
    
    router.push(`/vehicles?${params.toString()}`)
  }

  return (
    <div className="bg-white border-b sticky top-20 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {VEHICLE_CATEGORIES.map((category) => {
            const Icon = category.icon
            const isActive = selectedCategory === category.value
            const count = vehicleCounts[category.value] || 0
            
            return (
              <Button
                key={category.value}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleCategorySelect(category.value)}
                disabled={loading}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap px-4 py-2 h-auto",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span className="font-medium">{category.label}</span>
                {!loading && count > 0 && (
                  <Badge 
                    variant={isActive ? "secondary" : "outline"} 
                    className="ml-1 text-xs"
                  >
                    {count}
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
