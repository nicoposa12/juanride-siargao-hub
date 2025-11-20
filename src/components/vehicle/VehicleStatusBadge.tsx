'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, Wrench } from 'lucide-react'
import type { VehicleStatus } from '@/lib/supabase/queries/vehicles'

interface VehicleStatusBadgeProps {
  status: VehicleStatus
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function VehicleStatusBadge({ 
  status, 
  className = '', 
  showIcon = true, 
  size = 'md' 
}: VehicleStatusBadgeProps) {
  const getStatusConfig = (status: VehicleStatus) => {
    switch (status) {
      case 'available':
        return {
          label: 'Available',
          icon: CheckCircle2,
          className: 'bg-green-100 text-green-800 border-green-300',
        }
      case 'inactive':
        return {
          label: 'Unavailable',
          icon: AlertCircle,
          className: 'bg-red-100 text-red-800 border-red-300',
        }
      case 'rented':
        return {
          label: 'Rented',
          icon: CheckCircle2,
          className: 'bg-blue-100 text-blue-800 border-blue-300',
        }
      case 'maintenance':
        return {
          label: 'Under Maintenance',
          icon: Wrench,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        }
      default:
        return {
          label: 'Unknown',
          icon: AlertCircle,
          className: 'bg-gray-100 text-gray-800 border-gray-300',
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5',
  }

  return (
    <Badge 
      className={`${config.className} ${sizeClasses[size]} ${className} border font-medium inline-flex items-center gap-1.5`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  )
}
