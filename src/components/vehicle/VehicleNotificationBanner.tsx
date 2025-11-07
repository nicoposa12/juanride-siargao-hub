'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useVehicleStats } from '@/hooks/use-vehicle-stats'

export function VehicleNotificationBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const { totalAvailable, loading, error } = useVehicleStats()

  if (!isVisible || loading || error || totalAvailable === 0) return null

  return (
    <div className="bg-green-50 border border-green-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-green-700 font-medium">
              {totalAvailable} vehicle{totalAvailable !== 1 ? 's' : ''} available nearby today!
            </span>
            <span className="text-lg">🏆</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-green-700 hover:bg-green-100 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
