'use client'

import { useState, useEffect } from 'react'

export default function DebugEnvPage() {
  const [envVars, setEnvVars] = useState({
    url: '',
    hasKey: false,
    keyLength: 0
  })

  useEffect(() => {
    setEnvVars({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Environment Variables Debug</h1>
      
      <div className="space-y-4 max-w-4xl">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Supabase URL:</h2>
          <code className="text-green-400 break-all">
            {envVars.url || '❌ NOT SET'}
          </code>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Supabase Anon Key:</h2>
          <code className="text-green-400">
            {envVars.hasKey 
              ? `✅ SET (${envVars.keyLength} characters)` 
              : '❌ NOT SET'}
          </code>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Status:</h2>
          <div className="space-y-2">
            {envVars.url && envVars.hasKey ? (
              <>
                <p className="text-green-400">✅ Environment variables are loaded</p>
                <p className="text-yellow-400">⚠️ If login still times out, check:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Is your Supabase project Active (not Paused)?</li>
                  <li>Is the URL correct?</li>
                  <li>Are the API keys correct?</li>
                  <li>Can you access {envVars.url} in browser?</li>
                </ul>
              </>
            ) : (
              <>
                <p className="text-red-400">❌ Environment variables NOT loaded</p>
                <p className="text-yellow-400">⚠️ Fix:</p>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>Create .env.local in project root (same folder as package.json)</li>
                  <li>Add the Supabase credentials</li>
                  <li>Stop dev server (Ctrl+C)</li>
                  <li>Start dev server again (npm run dev)</li>
                  <li>Refresh this page</li>
                </ol>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Test Connection:</h2>
          <button 
            onClick={async () => {
              if (!envVars.url) {
                alert('No Supabase URL set!')
                return
              }
              try {
                const response = await fetch(`${envVars.url}/rest/v1/`, {
                  headers: {
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                  }
                })
                if (response.ok) {
                  alert('✅ Connection successful!')
                } else {
                  alert(`❌ Connection failed: ${response.status} ${response.statusText}`)
                }
              } catch (err) {
                alert(`❌ Connection error: ${err}`)
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-semibold"
          >
            Test Supabase Connection
          </button>
        </div>

        <div className="bg-yellow-900 border border-yellow-600 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Expected .env.local format:</h2>
          <pre className="text-sm overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://ezhjnprvzntwzukbtcfl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
          </pre>
          <p className="mt-2 text-yellow-300">
            ⚠️ NO quotes, NO spaces around =, Keys must be FULL length (not truncated)
          </p>
        </div>
      </div>
    </div>
  )
}

