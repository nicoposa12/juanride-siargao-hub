/**
 * Role-based caching system for middleware performance optimization
 * 
 * This system caches user roles in memory with TTL to avoid database queries
 * on every request, significantly improving middleware performance.
 */

interface CacheEntry {
  role: string | null
  timestamp: number
  expiresAt: number
}

interface RoleCache {
  get(userId: string): string | null
  set(userId: string, role: string | null): void
  delete(userId: string): void
  clear(): void
  cleanup(): void
  size(): number
}

/**
 * In-memory cache with TTL for user roles
 */
class InMemoryRoleCache implements RoleCache {
  private cache = new Map<string, CacheEntry>()
  private readonly ttl: number // Time to live in milliseconds
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000 // Convert to milliseconds
    
    // Start cleanup interval to remove expired entries
    this.startCleanup()
  }

  get(userId: string): string | null {
    const entry = this.cache.get(userId)
    
    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(userId)
      return null
    }

    return entry.role
  }

  set(userId: string, role: string | null): void {
    const now = Date.now()
    this.cache.set(userId, {
      role,
      timestamp: now,
      expiresAt: now + this.ttl,
    })
  }

  delete(userId: string): void {
    this.cache.delete(userId)
  }

  clear(): void {
    this.cache.clear()
  }

  cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    // Find expired entries
    for (const [userId, entry] of this.cache) {
      if (now > entry.expiresAt) {
        expiredKeys.push(userId)
      }
    }

    // Remove expired entries
    expiredKeys.forEach(key => this.cache.delete(key))

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired role cache entries`)
    }
  }

  size(): number {
    return this.cache.size
  }

  private startCleanup(): void {
    // Run cleanup every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 2 * 60 * 1000)
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

/**
 * Session storage backup for role cache
 * Used as a fallback when memory cache is not available
 */
class SessionStorageRoleCache implements RoleCache {
  private readonly prefix = 'role_cache_'
  private readonly ttl: number

  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000
  }

  get(userId: string): string | null {
    if (typeof window === 'undefined') return null

    try {
      const key = this.prefix + userId
      const item = sessionStorage.getItem(key)
      
      if (!item) return null

      const entry: CacheEntry = JSON.parse(item)
      
      // Check expiration
      if (Date.now() > entry.expiresAt) {
        sessionStorage.removeItem(key)
        return null
      }

      return entry.role
    } catch {
      return null
    }
  }

  set(userId: string, role: string | null): void {
    if (typeof window === 'undefined') return

    try {
      const now = Date.now()
      const entry: CacheEntry = {
        role,
        timestamp: now,
        expiresAt: now + this.ttl,
      }

      const key = this.prefix + userId
      sessionStorage.setItem(key, JSON.stringify(entry))
    } catch {
      // Ignore storage errors
    }
  }

  delete(userId: string): void {
    if (typeof window === 'undefined') return

    try {
      const key = this.prefix + userId
      sessionStorage.removeItem(key)
    } catch {
      // Ignore storage errors
    }
  }

  clear(): void {
    if (typeof window === 'undefined') return

    try {
      const keys: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          keys.push(key)
        }
      }
      keys.forEach(key => sessionStorage.removeItem(key))
    } catch {
      // Ignore storage errors
    }
  }

  cleanup(): void {
    if (typeof window === 'undefined') return

    try {
      const now = Date.now()
      const keys: string[] = []
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          const item = sessionStorage.getItem(key)
          if (item) {
            try {
              const entry: CacheEntry = JSON.parse(item)
              if (now > entry.expiresAt) {
                keys.push(key)
              }
            } catch {
              keys.push(key) // Remove invalid entries
            }
          }
        }
      }

      keys.forEach(key => sessionStorage.removeItem(key))
    } catch {
      // Ignore storage errors
    }
  }

  size(): number {
    if (typeof window === 'undefined') return 0

    try {
      let count = 0
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          count++
        }
      }
      return count
    } catch {
      return 0
    }
  }
}

/**
 * Combined cache with memory as primary and session storage as fallback
 */
class CombinedRoleCache implements RoleCache {
  private memoryCache: InMemoryRoleCache
  private sessionCache: SessionStorageRoleCache

  constructor(ttlMinutes: number = 5) {
    this.memoryCache = new InMemoryRoleCache(ttlMinutes)
    this.sessionCache = new SessionStorageRoleCache(ttlMinutes)
  }

  get(userId: string): string | null {
    // Try memory cache first
    let role = this.memoryCache.get(userId)
    if (role !== null) {
      return role
    }

    // Fallback to session storage
    role = this.sessionCache.get(userId)
    if (role !== null) {
      // Restore to memory cache
      this.memoryCache.set(userId, role)
      return role
    }

    return null
  }

  set(userId: string, role: string | null): void {
    this.memoryCache.set(userId, role)
    this.sessionCache.set(userId, role)
  }

  delete(userId: string): void {
    this.memoryCache.delete(userId)
    this.sessionCache.delete(userId)
  }

  clear(): void {
    this.memoryCache.clear()
    this.sessionCache.clear()
  }

  cleanup(): void {
    this.memoryCache.cleanup()
    this.sessionCache.cleanup()
  }

  size(): number {
    return this.memoryCache.size()
  }

  destroy(): void {
    this.memoryCache.destroy()
  }
}

// Global cache instance
const roleCache = new CombinedRoleCache(5) // 5 minutes TTL

/**
 * Cache management utilities
 */
export const roleCacheManager = {
  // Get role from cache
  getRole: (userId: string): string | null => {
    return roleCache.get(userId)
  },

  // Set role in cache
  setRole: (userId: string, role: string | null): void => {
    roleCache.set(userId, role)
  },

  // Remove user role from cache
  invalidateUser: (userId: string): void => {
    roleCache.delete(userId)
  },

  // Clear all cached roles
  clearAll: (): void => {
    roleCache.clear()
  },

  // Manual cleanup of expired entries
  cleanup: (): void => {
    roleCache.cleanup()
  },

  // Get cache statistics
  getStats: () => {
    return {
      size: roleCache.size(),
      ttlMinutes: 5,
    }
  },

  // Destroy cache (for cleanup on app shutdown)
  destroy: (): void => {
    roleCache.destroy()
  },
}

/**
 * Helper function for middleware to get user role with caching
 */
export async function getCachedUserRole(
  supabase: any, 
  userId: string
): Promise<string | null> {
  // Check cache first
  const cachedRole = roleCacheManager.getRole(userId)
  if (cachedRole !== null) {
    return cachedRole
  }

  // Cache miss - fetch from database
  try {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    const role = user?.role || null

  // Cache the result
  roleCacheManager.setRole(userId, role)
  console.log('🏪 Cached user role:', role, 'for user:', userId)

  return role
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}

// Cleanup on process exit (Node.js)
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    roleCacheManager.destroy()
  })

  process.on('SIGINT', () => {
    roleCacheManager.destroy()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    roleCacheManager.destroy()
    process.exit(0)
  })
}
