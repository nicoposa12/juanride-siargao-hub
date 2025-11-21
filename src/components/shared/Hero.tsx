'use client';

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight tracking-tight animate-fade-in">
            A Smarter Way to Rent Vehicles in{" "}
            <span className="text-accent-200 drop-shadow-lg inline-block hover:scale-105 transition-transform duration-300 cursor-default">Siargao Island</span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/95 max-w-2xl mx-auto font-medium leading-relaxed px-4">
            Book, track, and manage vehicle rentals easily with JuanRide — your all-in-one
            platform for efficient booking and monitoring.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center pt-4 px-4 w-full max-w-md sm:max-w-none mx-auto">
            <Link href="/vehicles" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-white text-primary-700 hover:bg-white/95 shadow-layered-lg hover:shadow-layered-lg hover:scale-105 transition-all text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 font-bold"
              >
                Book Now <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
              </Button>
            </Link>
            <Link href="/vehicles" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto bg-white/10 text-white border-2 border-white/40 hover:bg-white/20 hover:border-white/60 backdrop-blur-md shadow-layered-md hover:shadow-layered-lg transition-all text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 font-semibold"
              >
                <Users className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                Browse Vehicles
              </Button>
            </Link>
          </div>

          {/* Stats - Responsive grid with better mobile layout */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 pt-8 sm:pt-12 max-w-2xl mx-auto px-4">
            <div className="text-center card-gradient rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-layered-sm hover:shadow-layered-md transition-all duration-300 hover:-translate-y-1">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-700">500+</div>
              <div className="text-primary-600/90 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base font-medium">Vehicles</div>
            </div>
            <div className="text-center card-gradient rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-layered-sm hover:shadow-layered-md transition-all duration-300 hover:-translate-y-1">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-700">2K+</div>
              <div className="text-primary-600/90 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base font-medium">Happy Customers</div>
            </div>
            <div className="text-center card-gradient rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-layered-sm hover:shadow-layered-md transition-all duration-300 hover:-translate-y-1">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-700">24/7</div>
              <div className="text-primary-600/90 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base font-medium">Support</div>
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
