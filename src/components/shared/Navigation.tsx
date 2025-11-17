'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Car, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  const handleDashboard = () => {
    if (profile?.role === 'owner') {
      router.push('/owner/dashboard');
    } else if (profile?.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/vehicles');
    }
  };

  // Role-based navigation links
  const getNavLinks = () => {
    if (!profile) return [];

    const role = profile.role;

    // Owner navigation
    if (role === 'owner') {
      return [
        { name: "Home", href: "/" },
        { name: "Dashboard", href: "/owner/dashboard" },
        { name: "My Vehicles", href: "/owner/vehicles" },
        { name: "Bookings", href: "/owner/bookings" },
        { name: "Earnings", href: "/owner/earnings" },
        { name: "Maintenance", href: "/owner/maintenance" },
        { name: "Support", href: "/support" },
        { name: "Profile", href: "/profile" },
      ];
    }

    // Admin navigation
    if (role === 'admin') {
      return [
        { name: "Home", href: "/" },
        { name: "Dashboard", href: "/admin/dashboard" },
        { name: "Users", href: "/admin/users" },
        { name: "Listings", href: "/admin/listings" },
        { name: "Bookings", href: "/admin/bookings" },
        { name: "Profile", href: "/profile" },
      ];
    }

    // Renter navigation (default)
    return [
      { name: "Home", href: "/" },
      { name: "Browse Vehicles", href: "/vehicles" },
      { name: "My Rentals", href: "/dashboard/bookings" },
      { name: "Favorites", href: "/favorites" },
      { name: "Reviews", href: "/dashboard/reviews" },
      { name: "Support", href: "/support" },
      { name: "Profile", href: "/profile" },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-smooth bg-card shadow-layered-md border-b border-border/50`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Enhanced with depth */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary-600 rounded-lg p-2 shadow-layered-sm group-hover:bg-primary-500 group-hover:shadow-layered-lg group-hover:scale-105 transition-all duration-300">
              <Car className="h-6 w-6 text-primary-foreground group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" />
            </div>
            <span className="text-2xl font-bold text-primary-700 group-hover:text-primary-600 transition-all duration-300">
              JuanRide
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {user && profile ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-foreground hover:text-primary-600 transition-all duration-300 font-medium relative group px-3 py-2 rounded-lg hover:bg-primary-50/50"
                  >
                    <span className="relative z-10 group-hover:font-semibold transition-all">
                      {link.name}
                    </span>
                    <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent-400 group-hover:w-full transition-all duration-300 rounded-full shadow-sm"></span>
                  </Link>
                ))}
                <NotificationCenter />
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="border-primary-300 hover:bg-red-50 hover:border-red-400 hover:text-red-600 shadow-layered-sm hover:shadow-layered-lg transition-all duration-300 group"
                >
                  <LogOut className="mr-2 h-4 w-4 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300" />
                  <span className="font-medium">Sign Out</span>
                </Button>
              </>
            ) : (
              <>
                <Link href="/" className="text-foreground hover:text-primary-600 transition-all duration-300 font-medium relative group px-3 py-2 rounded-lg hover:bg-primary-50/50">
                  <span className="relative z-10 group-hover:font-semibold">Home</span>
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent-400 group-hover:w-full transition-all duration-300 rounded-full shadow-sm"></span>
                </Link>
                <Link href="/vehicles" className="text-foreground hover:text-primary-600 transition-all duration-300 font-medium relative group px-3 py-2 rounded-lg hover:bg-primary-50/50">
                  <span className="relative z-10 group-hover:font-semibold">Browse Vehicles</span>
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent-400 group-hover:w-full transition-all duration-300 rounded-full shadow-sm"></span>
                </Link>
                <Link href="/login">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border-primary-300 hover:bg-primary-50 hover:border-primary-500 shadow-layered-sm hover:shadow-layered-lg hover:scale-105 transition-all duration-300"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="gradient-hero text-primary-foreground shadow-layered-md hover:shadow-layered-lg hover:scale-105 transition-all duration-300">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-foreground hover:text-primary-600 transition-all duration-300 font-medium p-3 rounded-lg hover:bg-primary-50 border border-transparent hover:border-primary-200 hover:shadow-sm group relative"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="group-hover:font-semibold group-hover:translate-x-1 inline-block transition-all duration-300">
                    {link.name}
                  </span>
                </a>
              ))}
              {user && profile ? (
                <>
                  <div className="flex justify-center">
                    <NotificationCenter />
                  </div>
                  <Button 
                    onClick={() => {
                      handleDashboard();
                      setIsMobileMenuOpen(false);
                    }}
                    className="gradient-hero text-primary-foreground w-full shadow-layered-md hover:shadow-layered-lg hover:scale-105 transition-all duration-300 group"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4 group-hover:scale-110 group-hover:rotate-3 transition-all" />
                    <span className="font-medium">{profile.role === 'owner' ? 'Dashboard' : 'Browse Vehicles'}</span>
                  </Button>
                  <Button 
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    variant="outline"
                    className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-400 shadow-sm hover:shadow-md transition-all duration-300 group"
                  >
                    <LogOut className="mr-2 h-4 w-4 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300" />
                    <span className="font-medium">Sign Out</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="gradient-hero text-primary-foreground w-full shadow-layered-md hover:shadow-layered-lg hover:scale-105 transition-all duration-300">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
