'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getDashboardRoute, type UserRole } from '@/lib/rbac/config'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { profile } = useAuth()
  
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
          
          <p className="text-lg text-gray-700 mb-8 font-medium">
            Access Denied
          </p>
          
          <p className="text-gray-600 mb-8">
            If you believe this is an error, please contact support.
          </p>
          
          <div className="flex justify-center">
            <Button 
              onClick={() => {
                if (profile && dashboardRoute !== '/') {
                  router.push(dashboardRoute)
                } else {
                  router.push('/')
                }
              }}
              variant="default" 
              size="lg"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

