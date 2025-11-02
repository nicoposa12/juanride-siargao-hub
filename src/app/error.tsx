'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <AlertCircle className="h-24 w-24 text-destructive mx-auto" />
        <h2 className="text-4xl font-semibold text-foreground">Something went wrong!</h2>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          An error occurred while processing your request. Please try again.
        </p>
        <Button onClick={reset} size="lg" className="mt-8">
          Try Again
        </Button>
      </div>
    </div>
  )
}

