'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useInvalidateVehicles } from '@/hooks/use-vehicles'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

export default function VehicleRefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const invalidateVehicles = useInvalidateVehicles()
  const { toast } = useToast()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    try {
      // Invalidate caches
      invalidateVehicles()
      
      // Show success message
      toast({
        title: 'Refreshed!',
        description: 'Vehicle listings have been updated with the latest data.',
      })
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Could not refresh vehicle listings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      // Add a small delay for better UX
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1000)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </Button>
  )
}
