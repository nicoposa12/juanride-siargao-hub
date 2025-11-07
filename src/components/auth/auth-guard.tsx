'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'owner' | 'renter'
  fallback?: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  requiredRole,
  fallback,
  redirectTo = '/login'
}: AuthGuardProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Not authenticated
      if (!user) {
        router.push(redirectTo)
        return
      }

      // Authenticated but no profile loaded yet
      if (!profile) {
        return
      }

      // Check role requirements
      if (requiredRole) {
        const hasRequiredRole = profile.role === requiredRole || profile.role === 'admin'
        if (!hasRequiredRole) {
          router.push('/unauthorized')
          return
        }
      }
    }
  }, [user, profile, loading, requiredRole, router, redirectTo])

  // Show loading state
  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading if no user
  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Show loading if no profile
  if (!profile) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <p className="text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    )
  }

  // Check role requirements
  if (requiredRole) {
    const hasRequiredRole = profile.role === requiredRole || profile.role === 'admin'
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}

// Convenience components for specific roles
export function AdminGuard({ children, ...props }: Omit<AuthGuardProps, 'requiredRole'>) {
  return (
    <AuthGuard requiredRole="admin" {...props}>
      {children}
    </AuthGuard>
  )
}

export function OwnerGuard({ children, ...props }: Omit<AuthGuardProps, 'requiredRole'>) {
  return (
    <AuthGuard requiredRole="owner" {...props}>
      {children}
    </AuthGuard>
  )
}

export function RenterGuard({ children, ...props }: Omit<AuthGuardProps, 'requiredRole'>) {
  return (
    <AuthGuard requiredRole="renter" {...props}>
      {children}
    </AuthGuard>
  )
}

// Simple auth check without role requirements
export function RequireAuth({ children, ...props }: Omit<AuthGuardProps, 'requiredRole'>) {
  return (
    <AuthGuard {...props}>
      {children}
    </AuthGuard>
  )
}
