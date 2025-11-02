'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function TestSupabasePage() {
  const [status, setStatus] = useState<{
    connected: boolean | null
    tablesExist: boolean | null
    error: string | null
  }>({
    connected: null,
    tablesExist: null,
    error: null,
  })

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    const supabase = createClient()

    try {
      // Test 1: Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setStatus({
          connected: false,
          tablesExist: false,
          error: 'Environment variables not configured',
        })
        return
      }

      // Test 2: Try to connect and query
      const { data, error } = await supabase.from('users').select('count').limit(1)

      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          setStatus({
            connected: true,
            tablesExist: false,
            error: 'Tables not created yet. Run migrations!',
          })
        } else if (error.message.includes('Invalid API key')) {
          setStatus({
            connected: false,
            tablesExist: false,
            error: 'Invalid API key in .env.local',
          })
        } else {
          setStatus({
            connected: false,
            tablesExist: false,
            error: error.message,
          })
        }
      } else {
        setStatus({
          connected: true,
          tablesExist: true,
          error: null,
        })
      }
    } catch (err: any) {
      setStatus({
        connected: false,
        tablesExist: false,
        error: err.message,
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Supabase Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Environment Variables */}
          <div className="space-y-2">
            <h3 className="font-semibold">Environment Variables</h3>
            <div className="space-y-2">
              <StatusRow
                label="NEXT_PUBLIC_SUPABASE_URL"
                value={process.env.NEXT_PUBLIC_SUPABASE_URL}
                status={!!process.env.NEXT_PUBLIC_SUPABASE_URL}
              />
              <StatusRow
                label="NEXT_PUBLIC_SUPABASE_ANON_KEY"
                value={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '••••••••' : undefined}
                status={!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
              />
            </div>
          </div>

          {/* Connection Status */}
          <div className="space-y-2">
            <h3 className="font-semibold">Connection Status</h3>
            <div className="space-y-2">
              <StatusRow
                label="Supabase Connection"
                value={status.connected === null ? 'Testing...' : status.connected ? 'Connected' : 'Failed'}
                status={status.connected}
              />
              <StatusRow
                label="Database Tables"
                value={status.tablesExist === null ? 'Testing...' : status.tablesExist ? 'Created' : 'Not found'}
                status={status.tablesExist}
              />
            </div>
          </div>

          {/* Error Message */}
          {status.error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
              <p className="text-sm font-semibold text-destructive mb-2">Error:</p>
              <p className="text-sm text-destructive/90">{status.error}</p>
            </div>
          )}

          {/* Success Message */}
          {status.connected && status.tablesExist && (
            <div className="bg-green-500/10 border border-green-500 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                ✅ Everything is working!
              </p>
              <p className="text-sm text-green-600 dark:text-green-300">
                Your Supabase connection is configured correctly and all tables exist.
                You can now use the app normally.
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="font-semibold text-sm">Next Steps:</p>
            {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Create a Supabase project at https://supabase.com</li>
                <li>Copy your Project URL and API keys</li>
                <li>Create .env.local file with your credentials</li>
                <li>Restart the dev server</li>
              </ol>
            )}
            {status.connected && !status.tablesExist && (
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to Supabase Dashboard → SQL Editor</li>
                <li>Run supabase/migrations/00001_initial_schema.sql</li>
                <li>Run supabase/migrations/00002_rls_policies.sql</li>
                <li>Refresh this page</li>
              </ol>
            )}
            {status.connected && status.tablesExist && (
              <p className="text-sm">
                Go to <a href="/signup" className="text-primary underline">signup page</a> to create an account!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatusRow({ label, value, status }: { label: string; value?: string; status: boolean | null }) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex-1">
        <p className="font-medium text-sm">{label}</p>
        {value && <p className="text-xs text-muted-foreground mt-1">{value}</p>}
      </div>
      <div>
        {status === null && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        {status === true && <CheckCircle2 className="h-5 w-5 text-green-500" />}
        {status === false && <XCircle className="h-5 w-5 text-destructive" />}
      </div>
    </div>
  )
}

