# Next.js Development Commands

## Overview
Essential commands for developing, running, and managing your Next.js 14 application with App Router.

---

## Development Server

### Start Development Server
```bash
npm run dev
```

**What it does:**
- Starts Next.js dev server on `http://localhost:3000`
- Enables hot module replacement (HMR)
- Shows compilation errors in browser
- Watches for file changes
- Fast Refresh for instant updates

**When to use:**
- Primary command for local development
- Building features, fixing bugs
- Testing UI changes

**Ports:**
- Default: `3000`
- If port is busy, Next.js will prompt for different port

**Access:**
- Local: `http://localhost:3000`
- Network: `http://[your-ip]:3000` (accessible on local network)

---

## Build Commands

### Production Build
```bash
npm run build
```

**What it does:**
- Creates optimized production bundle in `.next/` directory
- Minifies JavaScript and CSS
- Optimizes images
- Generates static pages where possible
- Tree-shakes unused code
- Shows build statistics

**Build output:**
```
Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB          95 kB
├ ○ /vehicles                           12.3 kB         107 kB
├ ƒ /vehicles/[id]                       8.1 kB         103 kB
└ ○ /dashboard                          15.4 kB         120 kB

○ (Static)  - prerendered as static content
ƒ (Dynamic) - server-rendered on demand
```

**When to use:**
- Before deployment
- Testing production bundle locally
- Checking bundle sizes
- Validating build succeeds

**Build artifacts:**
- `.next/` - Production bundle (git-ignored)
- `.next/static/` - Static assets
- `.next/server/` - Server-side code

### Start Production Server
```bash
npm run start
```

**What it does:**
- Serves production build from `.next/` directory
- Requires `npm run build` first
- Uses optimized, minified code

**When to use:**
- Testing production build locally
- Verifying production behavior
- Performance testing

**Note:** Not for deployment - use hosting platform's deployment process

---

## Code Quality

### Linting

#### Run ESLint
```bash
npm run lint
```

**What it does:**
- Checks all files for code quality issues
- Enforces Next.js best practices
- Validates React patterns
- Shows warnings and errors

**When to use:**
- Before committing code
- During code review
- Fixing code quality issues

#### Auto-fix Linting Issues
```bash
npm run lint -- --fix
```

**Fixes:**
- Formatting issues
- Import sorting
- Simple rule violations

**Note:** Cannot fix all issues automatically - some require manual intervention

### Type Checking

#### Check TypeScript Types
```bash
npm run type-check
```

**What it does:**
- Runs TypeScript compiler in check mode
- Validates all type definitions
- Shows type errors without emitting files

**When to use:**
- Before committing
- After database schema changes
- After updating types

**Common errors:**
```typescript
// Type error example
error TS2339: Property 'name' does not exist on type 'Vehicle'

// Missing type
error TS2554: Expected 3 arguments, but got 2
```

**Fix workflow:**
1. Run `npm run type-check`
2. Fix reported errors
3. Re-run until no errors
4. Run `npm run supabase:gen-types` if database-related

---

## Package Management

### Install Dependencies
```bash
npm install
# or
npm i
```

**When to use:**
- After cloning repository
- After pulling changes with new dependencies
- `node_modules/` is missing

### Install Specific Package
```bash
# Production dependency
npm install package-name

# Dev dependency
npm install -D package-name

# Specific version
npm install package-name@1.2.3
```

### Update Dependencies
```bash
# Update all packages (within semver range)
npm update

# Check for outdated packages
npm outdated

# Update specific package
npm install package-name@latest
```

### Remove Package
```bash
npm uninstall package-name
```

### Clear Cache and Reinstall
```bash
# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

## Cache Management

### Clear Next.js Cache
```bash
# Remove .next folder
rm -rf .next

# Rebuild
npm run build
```

**When to use:**
- Build issues that seem cached
- After major dependency updates
- Strange runtime behavior

### Clear All Caches
```bash
# Full reset
rm -rf .next node_modules .turbo

npm install
npm run build
```

---

## Environment Management

### Check Environment Variables
```bash
# View loaded env vars (in app)
# Navigate to: http://localhost:3000/debug-env
```

**Environment files:**
- `.env.local` - Local development (git-ignored)
- `.env.production` - Production values (optional)
- `.env` - Defaults (committed)

### Validate Required Variables
Create a script to validate:

```typescript
// scripts/check-env.ts
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

required.forEach(key => {
  if (!process.env[key]) {
    console.error(`❌ Missing: ${key}`)
    process.exit(1)
  }
})

console.log('✅ All required env variables present')
```

```bash
# Run validation
npx tsx scripts/check-env.ts
```

---

## Analyzing Build

### Analyze Bundle Size
```bash
# Install analyzer
npm install -D @next/bundle-analyzer

# Update next.config.js to enable analyzer
# Then run:
ANALYZE=true npm run build
```

**Opens:**
- Browser with interactive bundle visualization
- Shows which packages are largest
- Identifies optimization opportunities

### Check Build Output
```bash
npm run build

# Look for:
# - Page sizes (should be < 200 KB first load)
# - Route types (○ Static, ƒ Dynamic, ● SSG)
# - Warnings about large bundles
```

---

## Development Utilities

### Clear TypeScript Server Cache (VS Code)
```
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

**When to use:**
- Types not updating in editor
- After running `supabase:gen-types`
- Autocomplete not working

### Format Code (Prettier)
```bash
# Format all files
npx prettier --write .

# Format specific directory
npx prettier --write "src/**/*.{ts,tsx}"

# Check formatting
npx prettier --check .
```

### Run Single Test File
```bash
# If tests configured
npm test -- path/to/test.ts
```

---

## Port and Process Management

### Check if Port 3000 is in Use
```bash
# Linux/Mac
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

### Kill Process on Port 3000
```bash
# Linux/Mac
kill -9 $(lsof -t -i:3000)

# Windows
# Find PID first, then:
taskkill /PID <PID> /F
```

### Run on Different Port
```bash
PORT=3001 npm run dev
```

---

## Package Scripts Reference

From `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "supabase:gen-types": "supabase gen types typescript --project-id your-project > supabase/types/database.types.ts"
  }
}
```

### Custom Scripts (Add to package.json)

```json
{
  "scripts": {
    "clean": "rm -rf .next node_modules",
    "fresh": "npm run clean && npm install && npm run dev",
    "check": "npm run type-check && npm run lint",
    "format": "prettier --write .",
    "analyze": "ANALYZE=true npm run build"
  }
}
```

---

## Common Development Workflows

### Start Fresh Development Session
```bash
# 1. Pull latest code
git pull

# 2. Install any new dependencies
npm install

# 3. Check environment variables
cat .env.local  # Verify keys present

# 4. Start dev server
npm run dev
```

### Pre-Commit Checklist
```bash
# 1. Type check
npm run type-check

# 2. Lint
npm run lint

# 3. Test build
npm run build

# 4. Format code
npx prettier --write .

# 5. Stage and commit
git add .
git commit -m "Your message"
```

### After Database Schema Changes
```bash
# 1. Generate new types
npm run supabase:gen-types

# 2. Restart dev server
# Ctrl + C to stop
npm run dev

# 3. Restart TypeScript in VS Code
# Cmd/Ctrl + Shift + P → "Restart TS Server"

# 4. Verify types
npm run type-check
```

### Troubleshooting Build Issues
```bash
# 1. Clear caches
rm -rf .next node_modules

# 2. Reinstall
npm install

# 3. Try building
npm run build

# 4. If still failing, check:
# - Environment variables
# - TypeScript errors: npm run type-check
# - Linting: npm run lint
```

---

## Next.js CLI Options

### Development Server Options
```bash
# Custom port
next dev -p 3001

# Different hostname
next dev -H 0.0.0.0

# Turbopack (faster bundler)
next dev --turbo
```

### Build Options
```bash
# Debug build
next build --debug

# Profile build
next build --profile
```

---

## Performance Monitoring

### Development Metrics
- Watch terminal for compilation times
- Check browser DevTools → Network tab for bundle sizes
- Use React DevTools Profiler for component performance

### Production Metrics
```bash
# After build, check:
# - First Load JS (should be < 200 KB)
# - Static vs Dynamic routes
# - Bundle size warnings
```

---

## Environment-Specific Commands

### Development
```bash
npm run dev               # Start dev server
npm run lint             # Check code quality
npm run type-check       # Validate types
```

### Pre-Deployment
```bash
npm run build            # Create production build
npm run start            # Test production locally
```

### CI/CD Pipeline
```bash
npm ci                   # Clean install (uses lock file)
npm run type-check       # Validate types
npm run lint             # Check code quality
npm run build            # Build for production
```

---

## Useful Next.js Flags

```bash
# Verbose logging
DEBUG=* npm run dev

# Experimental features
NEXT_EXPERIMENTAL_FEATURE=true npm run dev

# Disable telemetry
NEXT_TELEMETRY_DISABLED=1 npm run dev
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Start development | `npm run dev` |
| Production build | `npm run build` |
| Test production | `npm run start` |
| Type check | `npm run type-check` |
| Lint code | `npm run lint` |
| Auto-fix lint | `npm run lint -- --fix` |
| Clear cache | `rm -rf .next` |
| Fresh install | `rm -rf node_modules && npm install` |
| Generate types | `npm run supabase:gen-types` |

---

**Last Updated:** November 2025  
**Next.js Version:** 14 (App Router)  
**Related Docs:** 
- `/docs/guides/SETUP_GUIDE.md`
- `/docs/implementation/project-structure.md`
