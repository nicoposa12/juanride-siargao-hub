import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-4xl font-semibold text-foreground">Page Not Found</h2>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It may have been moved or deleted.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/">
            <Home className="mr-2 h-5 w-5" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}

