/**
 * Supabase Utility Functions
 * Shared helper functions for database operations
 */

import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Error handling utilities
 */

export interface DatabaseError {
  message: string
  code?: string
  details?: any
  hint?: string
}

/**
 * Format PostgrestError into a user-friendly message
 */
export function formatDatabaseError(error: PostgrestError): DatabaseError {
  return {
    message: error.message || 'An error occurred',
    code: error.code,
    details: error.details,
    hint: error.hint,
  }
}

/**
 * Check if error is a unique constraint violation
 */
export function isUniqueConstraintError(error: PostgrestError): boolean {
  return error.code === '23505'
}

/**
 * Check if error is a foreign key violation
 */
export function isForeignKeyError(error: PostgrestError): boolean {
  return error.code === '23503'
}

/**
 * Check if error is a not found error
 */
export function isNotFoundError(error: PostgrestError): boolean {
  return error.code === 'PGRST116'
}

/**
 * Pagination utilities
 */

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

/**
 * Calculate pagination offset
 */
export function getPaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit
}

/**
 * Create paginated result object
 */
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasMore,
  }
}

/**
 * Date utilities for SQL queries
 */

/**
 * Format date for PostgreSQL date column
 */
export function formatDateForDB(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return date.toISOString().split('T')[0]
}

/**
 * Format datetime for PostgreSQL timestamptz column
 */
export function formatDateTimeForDB(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return date.toISOString()
}

/**
 * Check if two date ranges overlap
 */
export function doDateRangesOverlap(
  start1: string | Date,
  end1: string | Date,
  start2: string | Date,
  end2: string | Date
): boolean {
  const s1 = new Date(start1)
  const e1 = new Date(end1)
  const s2 = new Date(start2)
  const e2 = new Date(end2)

  return s1 <= e2 && s2 <= e1
}

/**
 * Calculate number of days between two dates
 */
export function daysBetween(start: string | Date, end: string | Date): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Filter utilities
 */

/**
 * Build text search filter (case-insensitive partial match)
 */
export function buildTextSearchFilter(query: string, columns: string[]): string {
  const searchTerm = query.trim()
  if (!searchTerm) return ''

  return columns.map((col) => `${col}.ilike.%${searchTerm}%`).join(',')
}

/**
 * Build OR filter for Supabase query
 */
export function buildOrFilter(filters: Record<string, any>): string {
  return Object.entries(filters)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}.in.(${value.join(',')})`
      }
      return `${key}.eq.${value}`
    })
    .join(',')
}

/**
 * Retry utilities
 */

export interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
  backoff?: boolean
}

/**
 * Retry a database operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, backoff = true } = options

  let lastError: any

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt < maxAttempts) {
        const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Batch operation utilities
 */

/**
 * Process items in batches
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await processor(batch)
    results.push(...batchResults)
  }

  return results
}

/**
 * Type guards
 */

/**
 * Check if value is a valid UUID
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Check if value is a valid email
 */
export function isValidEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}
