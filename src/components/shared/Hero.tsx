'use client';

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getDashboardRoute, type UserRole } from "@/lib/rbac/config";
import heroImage from "@/assets/hero-siargao.jpg";

const Hero = () => {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // CRITICAL: Additional client-side redirect for Admin and Owner
  // This ensures they cannot view the homepage even if middleware is bypassed
  useEffect(() => {
    if (!loading && user && profile) {
      const userRole = (profile.role === 'pending' ? null : profile.role) as UserRole;
      
      // Admin and Owner cannot access homepage - redirect immediately
      if (userRole === 'admin' || userRole === 'owner') {
        const dashboardUrl = getDashboardRoute(userRole);
        console.log('🚫 Hero component: Redirecting', userRole, 'to', dashboardUrl);
        router.replace(dashboardUrl);
      }
    }
  }, [user, profile, loading, router]);

  const handleOwnerButton = () => {
    if (user && profile) {
      // Already logged in - go to dashboard
      if (profile.role === 'owner') {
        router.push('/owner/dashboard');
      } else {
        router.push('/vehicles');
      }
    } else {
      // Not logged in - go to signup
      router.push('/signup');
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage.src}
          alt="Siargao Island scenic view"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 gradient-overlay"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight tracking-tight animate-fade-in">
            A Smarter Way to Rent Vehicles in{" "}
            <span className="text-accent-200 drop-shadow-lg inline-block hover:scale-105 transition-transform duration-300 cursor-default">Siargao Island</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 max-w-2xl mx-auto font-medium leading-relaxed">
            Book, track, and manage vehicle rentals easily with JuanRide — your all-in-one
            platform for efficient booking and monitoring.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/vehicles">
              <Button 
                size="lg" 
                className="bg-white text-primary-700 hover:bg-white/95 shadow-layered-lg hover:shadow-layered-lg hover:scale-105 transition-all text-lg px-8 py-6 font-bold"
              >
                Book Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              onClick={handleOwnerButton}
              size="lg" 
              variant="outline" 
              className="bg-white/10 text-white border-2 border-white/40 hover:bg-white/20 hover:border-white/60 backdrop-blur-md shadow-layered-md hover:shadow-layered-lg transition-all text-lg px-8 py-6 font-semibold"
            >
              {user && profile ? (
                <>
                  <LayoutDashboard className="mr-2 h-5 w-5" />
                  {profile.role === 'owner' ? 'Go to Dashboard' : 'Browse Vehicles'}
                </>
              ) : (
                <>
                  <Users className="mr-2 h-5 w-5" />
                  For Vehicle Owners
                </>
              )}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">500+</div>
              <div className="text-white/80 mt-2">Vehicles</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">2K+</div>
              <div className="text-white/80 mt-2">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">24/7</div>
              <div className="text-white/80 mt-2">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-float">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/70 rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
