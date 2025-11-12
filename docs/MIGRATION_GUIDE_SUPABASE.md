# Migration Guide: Old Structure → New Supabase Structure

This guide helps you migrate from the old `src/lib/supabase/*` structure to the new organized `/supabase` structure.

## 📋 Quick Reference

| Old Import | New Import |
|------------|------------|
| `@/lib/supabase/client` | `@/supabase/config/supabaseClient` |
| `@/lib/supabase/server` | `@/supabase/config/supabaseClient` |
| `@/lib/supabase/queries/vehicles` | `@/supabase/lib/queries/vehicles` |
| `@/lib/supabase/queries/bookings` | `@/supabase/lib/queries/bookings` |
| `@/lib/supabase/storage` | `@/supabase/lib/storage` |
| `@/lib/supabase/realtime` | `@/supabase/lib/realtime` |
| `@/types/database.types` | `@/supabase/types/database.types` |

## 🔄 Step-by-Step Migration

### 1. Update Client Imports

**Old:**
```typescript
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

**New:**
```typescript
import { supabase } from '@/supabase/config/supabaseClient'
// No need to call createClient() - it's a singleton
```

### 2. Update Server Client Imports

**Old:**
```typescript
import { createServerClient } from '@/lib/supabase/server'
const supabase = createServerClient()
```

**New:**
```typescript
import { createServerClient } from '@/supabase/config/supabaseClient'
const supabase = createServerClient()
```

### 3. Update Query Imports

**Old:**
```typescript
import { searchVehicles, getVehicleById } from '@/lib/supabase/queries/vehicles'
```

**New (Option A - Direct imports):**
```typescript
import { searchVehicles, getVehicleById } from '@/supabase/lib/queries/vehicles'
```

**New (Option B - Namespace imports):**
```typescript
import { VehicleQueries } from '@/supabase'
// Then use: VehicleQueries.searchVehicles()
```

### 4. Update Type Imports

**Old:**
```typescript
import type { Database } from '@/types/database.types'
```

**New:**
```typescript
import type { Database } from '@/supabase/types/database.types'

// Or use the central export
import type { Database } from '@/supabase/types'
```

### 5. Update Storage Utilities

**Old:**
```typescript
import { uploadVehicleImage } from '@/lib/supabase/storage'
```

**New:**
```typescript
import { uploadVehicleImage } from '@/supabase/lib/storage'

// Or namespace import
import { StorageUtils } from '@/supabase'
// Then use: StorageUtils.uploadVehicleImage()
```

### 6. Update Realtime Utilities

**Old:**
```typescript
import { subscribeToBookingMessages } from '@/lib/supabase/realtime'
```

**New:**
```typescript
import { subscribeToBookingMessages } from '@/supabase/lib/realtime'

// Or namespace import
import { RealtimeUtils } from '@/supabase'
// Then use: RealtimeUtils.subscribeToBookingMessages()
```

## 🗂️ Files That Need Updating

Run this command to find files that need migration:

```bash
# Find all files importing from old structure
grep -r "@/lib/supabase" --include="*.ts" --include="*.tsx" src/
```

### Key Files to Update:

1. **Hooks** (`src/hooks/`)
   - `use-auth.ts`
   - `use-vehicles.ts`
   - `use-bookings.ts`
   - `use-reviews.ts`

2. **Components** (`src/components/`)
   - Any components directly using Supabase
   - Check: `grep -r "createClient\|createServerClient" src/components/`

3. **App Routes** (`src/app/`)
   - API routes in `src/app/api/`
   - Server components
   - Server actions

4. **Contexts** (`src/contexts/`)
   - `auth-context.tsx`

## ✅ Testing After Migration

After updating imports, verify everything works:

### 1. Check TypeScript Compilation
```bash
npm run type-check
```

### 2. Check for Import Errors
```bash
npm run lint
```

### 3. Test Key Functionalities
- [ ] User authentication (login/logout)
- [ ] Vehicle search and filtering
- [ ] Creating a booking
- [ ] File uploads (vehicle images, profile pictures)
- [ ] Real-time chat/notifications

## 🎯 Benefits of New Structure

1. **Better Organization**: Clear separation between queries, mutations, config
2. **Singleton Pattern**: Prevents unnecessary client recreation
3. **Type Safety**: Centralized type definitions
4. **Easier Testing**: Organized by domain
5. **Scalability**: Easy to add new tables/features
6. **Documentation**: Clear structure with README

## 🐛 Common Issues & Fixes

### Issue: `Cannot find module '@/supabase/...'`

**Fix**: Ensure `tsconfig.json` includes the path alias:
```json
{
  "compilerOptions": {
    "paths": {
      "@/supabase/*": ["./supabase/*"]
    }
  }
}
```

### Issue: `supabase is not a function`

**Old code:**
```typescript
import { supabase } from '@/supabase/config/supabaseClient'
const client = supabase() // ❌ Wrong
```

**Fixed:**
```typescript
import { supabase } from '@/supabase/config/supabaseClient'
// supabase is already the client instance ✅
const { data } = await supabase.from('vehicles').select('*')
```

### Issue: RLS errors after migration

This is likely NOT caused by the restructure. Check:
- Are you using the correct client (regular vs admin)?
- Are RLS policies still correct?
- Is the user properly authenticated?

## 📝 Gradual Migration Strategy

You don't need to migrate everything at once. Here's a recommended order:

1. ✅ **Phase 1**: Start with new features
   - Use new structure for all new code
   - Old code continues working

2. ✅ **Phase 2**: Update utility imports
   - Storage, realtime, utils
   - Low risk, high impact

3. ✅ **Phase 3**: Update hooks
   - One hook at a time
   - Test thoroughly after each

4. ✅ **Phase 4**: Update components
   - Start with leaf components
   - Work up to parent components

5. ✅ **Phase 5**: Update routes
   - API routes
   - Server components
   - Page components

6. ✅ **Phase 6**: Remove old structure
   - Once all imports updated
   - Delete `src/lib/supabase/`

## 🔍 Automated Migration Script

For bulk updates, you can use this script (review changes carefully):

```bash
#!/bin/bash

# Update client imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  's/@\/lib\/supabase\/client/@\/supabase\/config\/supabaseClient/g' {} +

# Update server imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  's/@\/lib\/supabase\/server/@\/supabase\/config\/supabaseClient/g' {} +

# Update query imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  's/@\/lib\/supabase\/queries/@\/supabase\/lib\/queries/g' {} +

# Update storage imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  's/@\/lib\/supabase\/storage/@\/supabase\/lib\/storage/g' {} +

# Update realtime imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  's/@\/lib\/supabase\/realtime/@\/supabase\/lib\/realtime/g' {} +

# Update type imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  's/@\/types\/database.types/@\/supabase\/types\/database.types/g' {} +

echo "Migration complete! Please review changes and test thoroughly."
```

**⚠️ Warning**: Always commit your work before running automated scripts!

## 💡 Tips

1. **Use IDE Search & Replace**: Most IDEs can find and replace across files safely
2. **Commit Often**: Make small, incremental changes
3. **Test Continuously**: Don't wait until everything is migrated
4. **Update One Feature at a Time**: Easier to track issues
5. **Keep Old Structure Temporarily**: Until migration is complete and tested

## 📞 Need Help?

- Check the main README: `/supabase/README.md`
- Review examples in `/supabase/lib/`
- Ask the team for guidance

---

**Last Updated**: November 2025
