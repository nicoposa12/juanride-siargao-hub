// Global cache utilities for cross-component cache management

import { QueryClient } from '@tanstack/react-query'

/**
 * Global function to invalidate vehicle caches
 * Useful for admin actions, webhooks, or external updates
 */
export function invalidateVehicleCaches(queryClient: QueryClient) {
  // Invalidate all vehicle-related queries
  queryClient.invalidateQueries({ queryKey: ['vehicles'] })
  queryClient.invalidateQueries({ queryKey: ['vehicles', 'search'] })
  
  console.log('🔄 Vehicle caches invalidated globally')
}

/**
 * Global function to invalidate all caches
 * Use sparingly - only for major data changes
 */
export function invalidateAllCaches(queryClient: QueryClient) {
  queryClient.invalidateQueries()
  console.log('🔄 All caches cleared')
}

/**
 * Utility to force refetch vehicle data immediately
 * Bypasses cache entirely for critical updates
 */
export function refetchVehicleData(queryClient: QueryClient) {
  queryClient.refetchQueries({ queryKey: ['vehicles'] })
  queryClient.refetchQueries({ queryKey: ['vehicles', 'search'] })
  
  console.log('🔄 Vehicle data refetched immediately')
}
