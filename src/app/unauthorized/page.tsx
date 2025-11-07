import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            You don't have permission to access this page. Please contact support if you believe this is an error.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="default" size="lg">
              <Link href="/">
                Go to Homepage
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg">
              <Link href="/profile">
                View Your Profile
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

