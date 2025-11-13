'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import siargaoHeroImage from '@/assets/siargao-hero.jpg'

interface VehicleHeroProps {
  initialSearch?: string
  onFiltersToggle?: () => void
}

export function VehicleHero({ initialSearch = '', onFiltersToggle }: VehicleHeroProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params = new URLSearchParams(searchParams?.toString() || '')
    
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim())
    } else {
      params.delete('search')
    }
    
    // Reset to page 1 when searching
    params.delete('page')
    
    router.push(`/vehicles?${params.toString()}`)
  }

  return (
    <section className="text-white relative min-h-[60vh] flex items-center">
      {/* Background Image */}
      <Image
        src={siargaoHeroImage}
        alt="Siargao Island Hero"
        fill
        className="object-cover"
        priority
      />
      {/* Dark Overlay for text readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            Explore Siargao Island
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl mb-8 text-white drop-shadow-md">
            Rent the perfect vehicle for your island adventure. Easy booking, trusted owners, real-time tracking.
          </p>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-3 bg-white/20 backdrop-blur-sm rounded-lg p-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
                <Input
                  type="text"
                  placeholder="Search by vehicle name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-white/90 border-0 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-white/50 focus:ring-offset-0 h-12 rounded-md"
                />
              </div>
              
              <Button
                type="button"
                onClick={onFiltersToggle}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 h-12 font-medium"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              <Button
                type="submit"
                className="bg-white text-primary hover:bg-white/90 px-8 h-12 font-medium"
              >
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
