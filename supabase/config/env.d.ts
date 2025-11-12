/**
 * Environment Variables Type Definitions
 * Provides type safety for environment variables used in Supabase configuration
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Supabase Configuration
      NEXT_PUBLIC_SUPABASE_URL: string
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string
      SUPABASE_SERVICE_ROLE_KEY: string

      // Application Configuration
      NEXT_PUBLIC_APP_URL: string
      NODE_ENV: 'development' | 'production' | 'test'

      // Payment Gateway (GCash, Maya) - for future implementation
      GCASH_API_KEY?: string
      GCASH_SECRET_KEY?: string
      MAYA_PUBLIC_KEY?: string
      MAYA_SECRET_KEY?: string

      // Email Service (Resend or similar)
      RESEND_API_KEY?: string
      EMAIL_FROM?: string

      // Optional Analytics/Monitoring
      NEXT_PUBLIC_GA_MEASUREMENT_ID?: string
      SENTRY_DSN?: string
    }
  }
}

export {}
