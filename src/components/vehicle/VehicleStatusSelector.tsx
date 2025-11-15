'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  Loader2,
  Settings
} from 'lucide-react'
import { updateVehicleStatus, VEHICLE_STATUS_OPTIONS, type VehicleStatus } from '@/lib/supabase/queries/vehicles'
import { useToast } from '@/hooks/use-toast'

interface VehicleStatusSelectorProps {
  vehicleId: string
  currentStatus: VehicleStatus
  onStatusUpdate?: (newStatus: VehicleStatus) => void
  className?: string
}

export function VehicleStatusSelector({ 
  vehicleId, 
  currentStatus, 
  onStatusUpdate,
  className 
}: VehicleStatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus>(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const getStatusDisplay = (status: VehicleStatus) => {
    const option = VEHICLE_STATUS_OPTIONS.find(opt => opt.value === status)
    if (!option) return { label: status, icon: AlertCircle, color: 'bg-gray-100 text-gray-800' }
    
    switch (status) {
      case 'available':
        return { 
          label: option.label, 
          icon: CheckCircle2, 
          color: 'bg-green-100 text-green-800' 
        }
      case 'unavailable':
        return { 
          label: option.label, 
          icon: AlertCircle, 
          color: 'bg-red-100 text-red-800' 
        }
      case 'maintenance':
        return { 
          label: option.label, 
          icon: Wrench, 
          color: 'bg-yellow-100 text-yellow-800' 
        }
      default:
        return { 
          label: option.label, 
          icon: AlertCircle, 
          color: 'bg-gray-100 text-gray-800' 
        }
    }
  }

  const handleStatusUpdate = async () => {
    if (selectedStatus === currentStatus) {
      setIsOpen(false)
      return
    }

    setIsUpdating(true)
    try {
      await updateVehicleStatus(vehicleId, selectedStatus)
      
      toast({
        title: 'Status Updated',
        description: `Vehicle status changed to ${getStatusDisplay(selectedStatus).label.toLowerCase()}.`,
      })
      
      onStatusUpdate?.(selectedStatus)
      setIsOpen(false)
    } catch (error) {
      console.error('Error updating vehicle status:', error)
      toast({
        title: 'Update Failed',
        description: 'Failed to update vehicle status. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const currentDisplay = getStatusDisplay(currentStatus)
  const CurrentIcon = currentDisplay.icon

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <CurrentIcon className="h-4 w-4 mr-2" />
          <Badge className={`${currentDisplay.color} border-0 mr-2`}>
            {currentDisplay.label}
          </Badge>
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Vehicle Status</DialogTitle>
          <DialogDescription>
            Change your vehicle's availability status. This will affect whether renters can book your vehicle.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Status</label>
            <div className="flex items-center gap-2">
              <CurrentIcon className="h-4 w-4" />
              <Badge className={currentDisplay.color}>
                {currentDisplay.label}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">New Status</label>
            <Select value={selectedStatus} onValueChange={(value: VehicleStatus) => setSelectedStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_STATUS_OPTIONS.map((option) => {
                  const display = getStatusDisplay(option.value)
                  const Icon = display.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          
          {selectedStatus !== 'available' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Note:</strong> Setting status to "{getStatusDisplay(selectedStatus).label}" will prevent new bookings. 
                  Existing confirmed bookings will not be affected.
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleStatusUpdate} 
            disabled={isUpdating || selectedStatus === currentStatus}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
