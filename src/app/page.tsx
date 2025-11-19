'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { getDashboardRoute, type UserRole } from '@/lib/rbac/config'
import Navigation from '@/components/shared/Navigation'
import Hero from '@/components/shared/Hero'
import About from '@/components/shared/About'
import Features from '@/components/shared/Features'
import HowItWorks from '@/components/shared/HowItWorks'
import Testimonials from '@/components/shared/Testimonials'
import Contact from '@/components/shared/Contact'
import Footer from '@/components/shared/Footer'

export default function HomePage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()

  // CRITICAL: Redirect Admin and Owner users immediately
  // This is a client-side backup to middleware protection
  useEffect(() => {
    if (!loading && user && profile) {
      const userRole = (profile.role === 'pending' ? null : profile.role) as UserRole
      
      // Admin and Owner cannot access homepage - redirect to their dashboards
      if (userRole === 'admin' || userRole === 'owner') {
        const dashboardUrl = getDashboardRoute(userRole)
        console.log('🚫 Client-side redirect: Blocking', userRole, 'from homepage, redirecting to', dashboardUrl)
        router.replace(dashboardUrl)
      }
    }
  }, [user, profile, loading, router])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is admin or owner, don't render homepage (redirect is happening)
  if (user && profile) {
    const userRole = (profile.role === 'pending' ? null : profile.role) as UserRole
    if (userRole === 'admin' || userRole === 'owner') {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Redirecting to dashboard...</p>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <About />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Contact />
      <Footer />
    </div>
  )
}

