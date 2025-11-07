'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data stays fresh for 10 minutes - much longer for better performance
            staleTime: 10 * 60 * 1000, // 10 minutes
            
            // Cache data for 30 minutes even if unused
            gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
            
            // More intelligent retry strategy
            retry: (failureCount, error: any) => {
              // Don't retry for auth errors
              if (error?.status === 401 || error?.status === 403) {
                return false
              }
              // Don't retry for client errors (4xx)
              if (error?.status >= 400 && error?.status < 500) {
                return false
              }
              // Retry up to 2 times for server errors
              return failureCount < 2
            },
            
            // Exponential backoff for retries
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // Don't refetch on window focus by default
            refetchOnWindowFocus: false,
            
            // Only refetch on mount if data is stale
            refetchOnMount: 'stale',
            
            // Don't refetch on reconnect unless data is stale
            refetchOnReconnect: 'stale',
          },
          mutations: {
            // Retry mutations on network errors
            retry: (failureCount, error: any) => {
              // Don't retry for client errors
              if (error?.status >= 400 && error?.status < 500) {
                return false
              }
              // Retry once for server errors
              return failureCount < 1
            },
            
            // Use exponential backoff for mutation retries too
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

