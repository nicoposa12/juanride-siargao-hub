'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getDashboardRoute, type UserRole } from '@/lib/rbac/config'

export default function UnauthorizedPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { profile } = useAuth()
  
  const reason = searchParams?.get('reason') || 'You don\'t have permission to access this page.'
  const attemptedPath = searchParams?.get('path') || 'the requested page'
  
  const userRole = (profile?.role === 'pending' ? null : profile?.role) as UserRole
  const dashboardRoute = profile ? getDashboardRoute(userRole) : '/'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div className="max-w-lg w-full mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            403 - Forbidden
          </h1>
          
          <p className="text-lg text-gray-700 mb-4 font-medium">
            Access Denied
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold">Reason:</span> {reason}
            </p>
            {attemptedPath && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Attempted path:</span> <code className="bg-gray-200 px-2 py-1 rounded">{attemptedPath}</code>
              </p>
            )}
            {profile && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-semibold">Your role:</span> <span className="capitalize">{profile.role}</span>
              </p>
            )}
          </div>
          
          <p className="text-gray-600 mb-8">
            If you believe this is an error, please contact support.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {profile && dashboardRoute !== '/' && (
              <Button 
                onClick={() => router.push(dashboardRoute)}
                variant="default" 
                size="lg"
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </Button>
            )}
            
            <Button 
              onClick={() => router.back()}
              variant="outline" 
              size="lg"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            
            <Button asChild variant="outline" size="lg">
              <Link href="/profile">
                View Profile
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

