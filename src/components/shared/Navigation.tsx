'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Car, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { getNavItemsForRole, isNavItemActive, type NavItem } from "@/lib/navigation/config";
import { canSeeNavItem } from "@/lib/navigation/permissions";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

  // Get navigation items based on user role
  // Note: Admins should use AdminSidebar, not this navigation
  // So we filter out admin-specific items from main nav
  // Normalize 'pending' role to null since pending users are in onboarding
  const userRole: 'renter' | 'owner' | 'admin' | null = 
    profile?.role === 'pending' ? null : (profile?.role || null);
  const allNavItems = getNavItemsForRole(userRole);
  
  // Filter out admin-specific routes from main navigation
  // Admins should use the AdminSidebar component instead
  const navItems: NavItem[] = allNavItems.filter(item => {
    // Don't show admin routes in main nav (they have their own sidebar)
    if (item.href.startsWith('/admin')) {
      return false;
    }
    // Only show items the user can actually access
    return canSeeNavItem(item.href, userRole);
  });

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
                {navItems.map((item) => {
                  const isActive = isNavItemActive(item, pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "transition-all duration-300 font-medium relative group px-3 py-2 rounded-lg",
                        isActive
                          ? "text-primary-600 bg-primary-50/80 font-semibold"
                          : "text-foreground hover:text-primary-600 hover:bg-primary-50/50"
                      )}
                    >
                      <span className="relative z-10 group-hover:font-semibold transition-all">
                        {item.name}
                      </span>
                      <span className={cn(
                        "absolute -bottom-0.5 left-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent-400 transition-all duration-300 rounded-full shadow-sm",
                        isActive ? "w-full" : "w-0 group-hover:w-full"
                      )}></span>
                    </Link>
                  );
                })}
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
                {navItems.map((item) => {
                  const isActive = isNavItemActive(item, pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "transition-all duration-300 font-medium relative group px-3 py-2 rounded-lg",
                        isActive
                          ? "text-primary-600 bg-primary-50/80 font-semibold"
                          : "text-foreground hover:text-primary-600 hover:bg-primary-50/50"
                      )}
                    >
                      <span className="relative z-10 group-hover:font-semibold">
                        {item.name}
                      </span>
                      <span className={cn(
                        "absolute -bottom-0.5 left-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent-400 transition-all duration-300 rounded-full shadow-sm",
                        isActive ? "w-full" : "w-0 group-hover:w-full"
                      )}></span>
                    </Link>
                  );
                })}
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
              {navItems.map((item) => {
                const isActive = isNavItemActive(item, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "transition-all duration-300 font-medium p-3 rounded-lg border hover:shadow-sm group relative",
                      isActive
                        ? "text-primary-600 bg-primary-50 border-primary-200 font-semibold shadow-sm"
                        : "text-foreground hover:text-primary-600 hover:bg-primary-50 border-transparent hover:border-primary-200"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="group-hover:font-semibold group-hover:translate-x-1 inline-block transition-all duration-300">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
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
