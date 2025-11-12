# Debugging and Troubleshooting Commands

## Overview
Essential commands and techniques for debugging issues, fixing bugs, and troubleshooting common problems in JuanRide.

---

## Development Debugging

### Browser DevTools

#### Open DevTools
```
F12 (Windows/Linux)
Cmd + Option + I (Mac)
```

**Key panels:**
- **Console** - View logs, errors, warnings
- **Network** - Inspect API requests/responses
- **Application** - View localStorage, cookies, session
- **Sources** - Set breakpoints, debug JavaScript
- **Performance** - Profile page performance
- **React DevTools** - Inspect React components

#### Console Debugging
```javascript
// Add debug logs in code
console.log('User data:', user)
console.error('Error occurred:', error)
console.table(vehicles) // Display arrays as table
console.trace() // Show call stack

// Conditional logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}
```

---

## Next.js Debugging

### Enable Verbose Logging
```bash
# Show detailed build information
DEBUG=* npm run dev

# Next.js specific debugging
NODE_OPTIONS='--inspect' npm run dev
```

### Debug API Routes
```typescript
// Add logging in API routes
export async function GET(request: Request) {
  console.log('API called:', request.url)
  console.log('Headers:', request.headers)
  
  try {
    const result = await someOperation()
    console.log('Result:', result)
    return Response.json(result)
  } catch (error) {
    console.error('API Error:', error)
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
```

### Check Server vs Client Rendering
```typescript
// Add to components
useEffect(() => {
  console.log('Component mounted on client')
}, [])

console.log('This runs on server AND client')
```

---

## Supabase Debugging

### Test Database Connection
```bash
# Create test script: scripts/test-db.ts
import { supabase } from '@/supabase/config/supabaseClient'

async function testConnection() {
  console.log('Testing Supabase connection...')
  
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .single()
  
  if (error) {
    console.error('❌ Connection failed:', error)
  } else {
    console.log('✅ Connection successful')
  }
}

testConnection()
```

```bash
# Run test
npx tsx scripts/test-db.ts
```

### Debug RLS Policies
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- View policies for table
SELECT * FROM pg_policies WHERE tablename = 'vehicles';

-- Test query as specific user (in Supabase SQL Editor)
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM vehicles WHERE owner_id = auth.uid();
```

### Debug Auth Issues
```typescript
// Check current session
const { data: { session } } = await supabase.auth.getSession()
console.log('Current session:', session)
console.log('User:', session?.user)
console.log('Access token:', session?.access_token)

// Check user in database
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('id', session?.user?.id)
  .single()
console.log('User in DB:', user)
```

### Enable Supabase Logging
```typescript
// In supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      debug: true, // Enable auth debugging
    },
  }
)
```

---

## TypeScript Debugging

### Check Types for Specific File
```bash
# Type check single file
npx tsc --noEmit src/components/vehicle/VehicleCard.tsx

# Show type at specific location
npx tsc --noEmit --pretty
```

### Debug Type Inference
```typescript
// Hover over variable in VS Code to see inferred type
const vehicle = await getVehicle(id)
//    ^? Hover here

// Explicitly check type
type VehicleType = typeof vehicle
//   ^? Shows the actual type

// Use satisfies for type checking
const config = {
  name: 'test',
  value: 123,
} satisfies Config // Ensures it matches Config type
```

### Common Type Fixes
```typescript
// ❌ Type error: Property 'name' does not exist
const name = user.name

// ✅ Fix with optional chaining
const name = user?.name

// ✅ Fix with type guard
if (user && 'name' in user) {
  const name = user.name
}

// ✅ Fix with type assertion (use carefully)
const name = (user as User).name
```

---

## Network Debugging

### Monitor API Calls
```typescript
// Add interceptor to log all requests
const originalFetch = window.fetch
window.fetch = async (...args) => {
  console.log('Fetch called:', args[0])
  const response = await originalFetch(...args)
  console.log('Response:', response.status)
  return response
}
```

### Check Network Tab in DevTools
1. Open DevTools → Network
2. Filter by:
   - `XHR` - API calls
   - `Fetch` - Fetch requests
   - `WS` - WebSocket connections
3. Check:
   - Status codes
   - Response times
   - Request/response headers
   - Payload data

### Test API Endpoints
```bash
# Test with curl
curl -X GET http://localhost:3000/api/vehicles

# With authentication
curl -X GET http://localhost:3000/api/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN"

# POST request
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id": "123", "start_date": "2025-01-15"}'
```

---

## Performance Debugging

### React DevTools Profiler
1. Install React DevTools extension
2. Open DevTools → Profiler tab
3. Click "Record"
4. Perform actions
5. Click "Stop" to see results

### Check Component Re-renders
```typescript
// Add to component
useEffect(() => {
  console.log('Component re-rendered')
})

// Track specific props
useEffect(() => {
  console.log('Vehicle changed:', vehicle)
}, [vehicle])

// Use React DevTools highlight updates
// DevTools → Components → Settings → Highlight updates when components render
```

### Measure Performance
```typescript
// Performance API
console.time('Operation')
await someOperation()
console.timeEnd('Operation') // Shows duration

// React Profiler component
import { Profiler } from 'react'

<Profiler id="VehicleList" onRender={(id, phase, actualDuration) => {
  console.log(`${id} took ${actualDuration}ms`)
}}>
  <VehicleList />
</Profiler>
```

### Lighthouse Audit
```bash
# Run Lighthouse in Chrome DevTools
# DevTools → Lighthouse → Generate report

# Or use CLI
npm install -g lighthouse
lighthouse http://localhost:3000 --view
```

---

## Common Issues and Fixes

### Issue: "Hydration mismatch" Error

**Cause:** Server HTML doesn't match client HTML

**Debug:**
```typescript
// Check for:
// 1. Conditional rendering based on window/document
if (typeof window !== 'undefined') {
  // ❌ This causes hydration mismatch
}

// 2. Date formatting without timezone handling
new Date().toLocaleDateString() // ❌ Different server/client

// 3. Random values
Math.random() // ❌ Different server/client
```

**Fix:**
```typescript
// Use useEffect for client-only code
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])

if (!mounted) return null
// Client-only code here
```

### Issue: "Cannot read property of undefined"

**Debug:**
```typescript
// Add console.log before error
console.log('User:', user)
const name = user.name // Error: user is undefined
```

**Fix:**
```typescript
// Optional chaining
const name = user?.name

// Default value
const name = user?.name || 'Unknown'

// Early return
if (!user) return <Loading />
```

### Issue: Environment Variables Not Loading

**Debug:**
```bash
# Check if variables are present
echo $NEXT_PUBLIC_SUPABASE_URL

# In code
console.log('Env vars:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
})
```

**Fix:**
```bash
# 1. Check .env.local exists
ls -la .env.local

# 2. Verify prefix (must be NEXT_PUBLIC_ for client)
# ✅ NEXT_PUBLIC_API_URL=...
# ❌ API_URL=... (won't work on client)

# 3. Restart dev server
npm run dev

# 4. Clear Next.js cache
rm -rf .next
npm run dev
```

### Issue: Database Query Returns No Data

**Debug:**
```typescript
const { data, error } = await supabase
  .from('vehicles')
  .select('*')

console.log('Query result:', { data, error })
console.log('Data length:', data?.length)
console.log('Error details:', error?.message, error?.details)
```

**Check:**
1. RLS policies allow read access
2. Data exists in table (check Supabase Dashboard)
3. Correct table name
4. User is authenticated if RLS requires it

**Fix:**
```typescript
// Use admin client to bypass RLS (server-side only)
import { supabaseAdmin } from '@/supabase/config/supabaseAdmin'

const { data, error } = await supabaseAdmin
  .from('vehicles')
  .select('*')
```

### Issue: "Module not found" Error

**Debug:**
```bash
# Check if file exists
ls -la src/components/VehicleCard.tsx

# Check import path
cat src/app/page.tsx | grep "import.*VehicleCard"
```

**Fix:**
```bash
# 1. Verify correct path
# ❌ import { VehicleCard } from '@/components/VehicleCard'
# ✅ import { VehicleCard } from '@/components/vehicle/VehicleCard'

# 2. Check tsconfig paths
cat tsconfig.json | grep -A 5 "paths"

# 3. Clear cache and reinstall
rm -rf .next node_modules
npm install
```

### Issue: Auth Session Lost on Refresh

**Debug:**
```typescript
// Check cookie storage
const { data: { session } } = await supabase.auth.getSession()
console.log('Session on refresh:', session)

// Check localStorage
console.log('Auth storage:', localStorage.getItem('supabase.auth.token'))
```

**Fix:**
```typescript
// Ensure using singleton client
// ✅ src/supabase/config/supabaseClient.ts
export const supabase = createClient(...)

// ❌ Don't create new instances
const supabase = createClient(...) // Creates new instance!

// Use the singleton
import { supabase } from '@/supabase/config/supabaseClient'
```

---

## Logging Best Practices

### Development Logging
```typescript
// Structured logging
const logDebug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}`, data)
  }
}

const logError = (message: string, error: any) => {
  console.error(`[ERROR] ${message}`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  })
}

// Usage
logDebug('Fetching vehicles', { filters })
logError('Failed to create booking', error)
```

### Remove Console Logs in Production
```typescript
// In next.config.js
module.exports = {
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

// Or keep console.error
module.exports = {
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  },
}
```

---

## Testing Commands

### Run Type Checks
```bash
npm run type-check
```

### Run Linter
```bash
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### Test Production Build
```bash
npm run build
npm run start

# Then test manually in browser
```

---

## VS Code Debugging

### Debug Configuration
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Set Breakpoints
1. Click left gutter in VS Code to set breakpoint
2. Press F5 to start debugging
3. Code will pause at breakpoint
4. Inspect variables in Debug panel

---

## Quick Debugging Checklist

**When something breaks:**
```bash
□ Check console for errors (F12 → Console)
□ Check Network tab for failed requests
□ Verify environment variables loaded
□ Run type check: npm run type-check
□ Run linter: npm run lint
□ Clear cache: rm -rf .next
□ Restart dev server
□ Check Supabase Dashboard for data
□ Test database connection
□ Verify RLS policies
□ Check user authentication status
```

---

## Useful Debug Scripts

### Create Debug Script
```typescript
// scripts/debug.ts
import { supabase } from '@/supabase/config/supabaseClient'

async function debug() {
  console.log('=== DEBUG INFO ===')
  
  // Check environment
  console.log('Environment:', process.env.NODE_ENV)
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  
  // Check auth
  const { data: { session } } = await supabase.auth.getSession()
  console.log('User:', session?.user?.email)
  
  // Check database
  const { count, error } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
  console.log('Vehicle count:', count)
  console.log('Error:', error)
  
  console.log('=== END DEBUG ===')
}

debug()
```

```bash
# Run debug script
npx tsx scripts/debug.ts
```

---

## Quick Reference

| Issue | Debug Command |
|-------|---------------|
| Type errors | `npm run type-check` |
| Lint issues | `npm run lint` |
| Build fails | `rm -rf .next && npm run build` |
| Auth issues | Check session in DevTools Console |
| Database issues | Check RLS in Supabase Dashboard |
| Network issues | Check Network tab in DevTools |
| Performance | Use React Profiler |
| Cache issues | `rm -rf .next node_modules && npm install` |

---

**Last Updated:** November 2025  
**Related Docs:**
- `/docs/commands/nextjs-commands.md`
- `/docs/commands/database-commands.md`
- `/docs/fixes/` (for specific bug fixes)
