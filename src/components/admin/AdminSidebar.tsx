'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  Calendar,
  CreditCard,
  FileText,
  MessageSquare,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  User,
  ChevronDown,
  ShieldCheck
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { getNavItemsForRole, isNavItemActive } from '@/lib/navigation/config'

// Icon mapping for admin navigation items
const adminIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  '/admin/dashboard': LayoutDashboard,
  '/admin/users': Users,
  '/admin/listings': Car,
  '/admin/bookings': Calendar,
  '/admin/verifications': ShieldCheck,
  '/admin/transactions': CreditCard,
  '/admin/reports': FileText,
  '/admin/feedback': MessageSquare,
  '/admin/settings': Settings,
  '/admin/support': HelpCircle,
}

// Get admin navigation items from centralized config
function getAdminNavItems() {
  const adminItems = getNavItemsForRole('admin')
    .filter(item => item.href.startsWith('/admin'))
    .map(item => ({
      ...item,
      icon: adminIconMap[item.href] || LayoutDashboard,
    }))
  
  // Separate main items and bottom items (Support)
  const mainItems = adminItems.filter(item => item.href !== '/admin/support')
  const bottomItems = adminItems.filter(item => item.href === '/admin/support')
  
  return { mainItems, bottomItems }
}

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, signOut } = useAuth()

  // Get admin navigation items from centralized config
  const { mainItems: adminNavItems, bottomItems: adminBottomNavItems } = getAdminNavItems()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <Sidebar className="border-r-2 border-primary-100/50">
      <SidebarHeader className="border-b-2 border-primary-100/50 bg-gradient-to-br from-primary-50/80 via-white to-accent-50/50 relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-600 rounded-full blur-2xl"></div>
        </div>
        <div className="relative flex items-center gap-3 px-4 py-5 group cursor-pointer hover:bg-white/60 transition-all duration-300 rounded-xl mx-3 my-2 shadow-sm hover:shadow-layered-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-layered-md group-hover:shadow-layered-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ring-2 ring-primary-200/50 group-hover:ring-primary-300">
            <LayoutDashboard className="h-6 w-6 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold bg-gradient-to-r from-primary-700 via-primary-600 to-accent-600 bg-clip-text text-transparent group-hover:from-primary-600 group-hover:to-accent-500 transition-all">JuanRide Admin</span>
            <span className="text-xs text-primary-600 font-semibold tracking-wide">Management Portal</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col bg-gradient-to-b from-white via-primary-50/30 to-white">
        <SidebarMenu className="flex-1 px-3 py-3 space-y-1.5">
          {adminNavItems.map((item) => {
            const isActive = isNavItemActive(item, pathname)
            const Icon = item.icon || LayoutDashboard
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  tooltip={item.name}
                  className={cn(
                    "group relative overflow-hidden transition-all duration-300 rounded-xl",
                    isActive 
                      ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold shadow-layered-lg hover:shadow-layered-xl hover:scale-[1.02]" 
                      : "hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50/50 hover:shadow-md hover:scale-[1.01] hover:border hover:border-primary-200/50"
                  )}
                >
                  <Link href={item.href} className="flex items-center gap-3 py-3 px-4 rounded-xl relative">
                    {/* Shine effect on active */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    )}
                    <div className={cn(
                      "p-2 rounded-lg transition-all duration-300 relative z-10",
                      isActive 
                        ? "bg-white/20 text-white shadow-lg backdrop-blur-sm" 
                        : "bg-primary-100/50 text-primary-700 group-hover:bg-primary-200 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-md"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5 transition-all duration-300",
                        isActive ? "" : "group-hover:scale-110 group-hover:-rotate-6"
                      )} />
                    </div>
                    <span className={cn(
                      "font-semibold transition-all duration-300 relative z-10",
                      isActive ? "text-white" : "text-primary-800 group-hover:text-primary-700 group-hover:translate-x-1"
                    )}>{item.name}</span>
                    {isActive && (
                      <>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-white/50 via-white to-white/50 rounded-r-full shadow-lg"></div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                      </>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
        
        {/* Bottom Navigation Items */}
        <SidebarMenu className="mt-auto pt-3 border-t-2 border-primary-100/50 px-3 pb-3 space-y-1.5 bg-gradient-to-t from-primary-50/30 to-transparent">
          {adminBottomNavItems.map((item) => {
            const isActive = isNavItemActive(item, pathname)
            const Icon = item.icon || HelpCircle
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  tooltip={item.name}
                  className={cn(
                    "group transition-all duration-300 rounded-xl",
                    isActive 
                      ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold shadow-layered-md" 
                      : "hover:bg-primary-50 hover:shadow-md hover:scale-[1.01] hover:border hover:border-primary-200/50"
                  )}
                >
                  <Link href={item.href} className="flex items-center gap-3 py-3 px-4 rounded-xl">
                    <div className={cn(
                      "p-2 rounded-lg transition-all duration-300",
                      isActive 
                        ? "bg-white/20 text-white shadow-md backdrop-blur-sm" 
                        : "bg-primary-100/50 text-primary-700 group-hover:bg-primary-200 group-hover:scale-110 group-hover:rotate-12"
                    )}>
                      <Icon className="h-5 w-5 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300" />
                    </div>
                    <span className={cn(
                      "font-semibold transition-all duration-300",
                      isActive ? "text-white" : "text-primary-800 group-hover:text-primary-700 group-hover:translate-x-1"
                    )}>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t-2 border-primary-100/50 p-0 bg-gradient-to-t from-primary-50/80 via-white to-transparent relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary-600 rounded-full blur-2xl"></div>
        </div>
        <SidebarMenu className="relative z-10">
          <SidebarMenuItem>
            <div className="flex flex-col gap-2 p-4">
              <div className="flex items-center gap-3 px-3 py-3 hover:bg-white/60 rounded-xl transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-md">
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white shadow-layered-md group-hover:shadow-layered-lg group-hover:scale-110 transition-all duration-300 ring-2 ring-primary-200/50 group-hover:ring-primary-300">
                    <span className="text-base font-extrabold">
                      {profile?.full_name?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-bold truncate text-primary-800 group-hover:text-primary-700 transition-colors">
                    {profile?.full_name || 'Admin'}
                  </span>
                  <span className="text-xs text-primary-600 truncate font-semibold">
                    Administrator
                  </span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="w-full justify-start hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100/50 hover:text-red-700 transition-all duration-300 group shadow-sm hover:shadow-md rounded-xl font-semibold border border-transparent hover:border-red-200/50"
              >
                <div className="p-1.5 rounded-lg bg-red-100/50 group-hover:bg-red-200 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300 mr-2">
                  <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </div>
                <span className="group-hover:translate-x-1 transition-transform">Sign Out</span>
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { profile, signOut } = useAuth()
  
  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6 shadow-sm">
            <SidebarTrigger className="md:hidden hover:bg-accent hover:scale-105 transition-all duration-300" />
            
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-primary-600 transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="Search users, vehicles, bookings..."
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:border-primary-300 transition-all duration-300 shadow-inset-sm hover:shadow-sm"
                />
              </div>
            </div>
            
            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Notification Center */}
              <NotificationCenter />
              
              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 pl-4 border-l hover:bg-accent rounded-md px-3 py-2 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <span className="text-xs font-semibold">
                        {profile?.full_name?.charAt(0).toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-medium leading-none">
                        {profile?.full_name || 'Juander Admin'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Administrator
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || 'Juander Admin'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.email || 'admin@juanride.com'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/support" className="cursor-pointer">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Help & Support
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 bg-gradient-subtle bg-pattern-dots">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
