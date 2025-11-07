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
    } else {
      router.push('/vehicles');
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "My Rentals", href: "/dashboard/bookings" },
    { name: "Reviews", href: "/dashboard/reviews" },
    { name: "Support", href: "/support" },
    { name: "Profile", href: "/dashboard/profile" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-smooth bg-white shadow-sm`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary rounded-lg p-2 group-hover:bg-primary-glow transition-smooth">
              <Car className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary">
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
                    className="text-foreground hover:text-primary transition-smooth font-medium"
                  >
                    {link.name}
                  </Link>
                ))}
                <NotificationCenter />
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="border-primary/20 hover:bg-primary/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/" className="text-foreground hover:text-primary transition-smooth font-medium">
                  Home
                </Link>
                <Link href="/vehicles" className="text-foreground hover:text-primary transition-smooth font-medium">
                  Browse Vehicles
                </Link>
                <Link href="/login">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border-primary/20 hover:bg-primary/10"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="gradient-hero text-primary-foreground hover:shadow-hover transition-smooth">
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
                  className="text-foreground hover:text-primary transition-smooth font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
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
                    className="gradient-hero text-primary-foreground w-full"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {profile.role === 'owner' ? 'Dashboard' : 'Browse Vehicles'}
                  </Button>
                  <Button 
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="gradient-hero text-primary-foreground w-full">
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
