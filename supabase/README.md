# JuanRide Supabase Structure# JuanRide Supabase Structure# JuanRide Supabase Setup



A well-organized, scalable folder structure for managing Supabase database operations in the JuanRide Next.js application.



## 📁 Directory StructureA well-organized, scalable folder structure for managing Supabase database operations in the JuanRide Next.js application.This directory contains all database migrations, functions, and configuration for the JuanRide platform.



```

/supabase

├── /config                    # Supabase client configuration## 📁 Directory Structure## Directory Structure

│   ├── supabaseClient.ts     # Browser & server clients (singleton pattern)

│   ├── supabaseAdmin.ts      # Admin client with service role

│   └── env.d.ts              # Environment variable types

│``````

├── /database                  # SQL and schema management

│   ├── /migrations           # Sequential schema changes (numbered SQL files)/supabasesupabase/

│   ├── /seeds                # Development/test data

│   ├── /scripts              # Utility scripts (fixes, setup, admin tasks)├── /config                    # Supabase client configuration├── migrations/           # Database schema migrations

│   ├── /schema               # Table definitions (to be extracted)

│   ├── /functions            # PostgreSQL functions (to be extracted)│   ├── supabaseClient.ts     # Browser & server clients (singleton pattern)│   ├── 00001_initial_schema.sql    # Core tables and relationships

│   ├── /triggers             # Database triggers (to be extracted)

│   └── /policies             # RLS policies (to be extracted)│   ├── supabaseAdmin.ts      # Admin client with service role│   ├── 00002_rls_policies.sql      # Row Level Security policies

│

├── /types                     # TypeScript type definitions│   └── env.d.ts              # Environment variable types│   ├── 00003_indexes.sql           # Performance indexes

│   ├── database.types.ts     # Auto-generated from Supabase CLI

│   └── index.ts              # Custom domain types││   └── 00004_functions.sql         # Database functions and triggers

│

├── /lib                       # Database access logic├── /database                  # Database schema and SQL├── functions/           # Supabase Edge Functions (serverless)

│   ├── /queries              # Read operations (SELECT)

│   ├── /mutations            # Write operations (INSERT/UPDATE/DELETE)│   ├── /schema               # Table definitions (to be extracted)│   └── (to be added)

│   ├── storage.ts            # File upload/download utilities

│   ├── realtime.ts           # Real-time subscriptions│   ├── /functions            # PostgreSQL functions (to be extracted)├── seed.sql            # Sample data for development

│   └── utils.ts              # Helper functions

││   ├── /triggers             # Database triggers (to be extracted)├── config.toml         # Supabase configuration

├── index.ts                   # Central export file

├── README.md                  # This file│   ├── /policies             # Row Level Security policies (to be extracted)└── README.md          # This file

└── README_OLD.md              # Original setup instructions

```│   ├── /seeds                # Development/test data```



## 🚀 Quick Start│   └── /migrations           # Sequential change history



### 1. Import the Client│## Setup Instructions



```typescript├── /types                     # TypeScript type definitions

// Client Components

import { supabase } from '@/supabase/config/supabaseClient'│   ├── database.types.ts     # Auto-generated from Supabase CLI### 1. Create a Supabase Project



// Server Components / API Routes│   └── index.ts              # Custom domain types

import { createServerClient } from '@/supabase/config/supabaseClient'

│1. Go to [supabase.com](https://supabase.com)

// Admin Operations (service role - USE WITH CAUTION)

import { supabaseAdmin } from '@/supabase/config/supabaseAdmin'├── /lib                       # Database access logic2. Click "New Project"

```

│   ├── /queries              # Read operations (SELECT)3. Fill in project details:

### 2. Use Queries and Mutations

│   ├── /mutations            # Write operations (INSERT/UPDATE/DELETE)   - Name: "juanride-siargao"

```typescript

// Import organized by domain│   ├── storage.ts            # File upload/download utilities   - Database Password: (generate a strong password)

import { VehicleQueries, VehicleMutations } from '@/supabase'

│   ├── realtime.ts           # Real-time subscriptions   - Region: Southeast Asia (Singapore) - closest to Philippines

// Read operations

const vehicles = await VehicleQueries.searchVehicles(filters)│   └── utils.ts              # Helper functions

const vehicle = await VehicleQueries.getVehicleById(id)

│### 2. Get Your API Keys

// Write operations

const newVehicle = await VehicleMutations.createVehicle(data)├── index.ts                   # Central export file

await VehicleMutations.updateVehicle(id, updates)

```└── README.md                  # This fileAfter project creation, go to Project Settings > API:



### 3. File Uploads```- Copy the `Project URL` (NEXT_PUBLIC_SUPABASE_URL)



```typescript- Copy the `anon/public` key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

import { StorageUtils } from '@/supabase'

## 🚀 Quick Start- Copy the `service_role` key (SUPABASE_SERVICE_ROLE_KEY) - Keep this secret!

// Upload vehicle image

const imageUrl = await StorageUtils.uploadVehicleImage(file, vehicleId)



// Upload profile picture### 1. Import the Client### 3. Configure Environment Variables

const profileUrl = await StorageUtils.uploadProfileImage(file, userId)

```



### 4. Real-time Subscriptions```typescriptCreate a `.env.local` file in the project root:



```typescript// Client Components

import { RealtimeUtils } from '@/supabase'

import { supabase } from '@/supabase/config/supabaseClient'```bash

// Subscribe to new messages

const channel = RealtimeUtils.subscribeToBookingMessages(NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

  bookingId,

  (message) => {// Server Components / API RoutesNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

    console.log('New message:', message)

  }import { createServerClient } from '@/supabase/config/supabaseClient'SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

)

```

// Clean up

await RealtimeUtils.unsubscribeChannel(channel)// Admin Operations (service role - USE WITH CAUTION)

```

import { supabaseAdmin } from '@/supabase/config/supabaseAdmin'### 4. Run Migrations

## 🧩 Key Concepts

```

### Singleton Pattern

You can run migrations in two ways:

The Supabase client uses a singleton pattern to prevent recreation on every component render:

### 2. Use Queries and Mutations

```typescript

// ✅ Good - uses singleton#### Option A: Using Supabase SQL Editor (Recommended for first-time setup)

import { supabase } from '@/supabase/config/supabaseClient'

```typescript

// ❌ Bad - creates new instance every time

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'// Import organized by domain1. Go to your Supabase project dashboard

const supabase = createClientComponentClient()

```import { VehicleQueries, VehicleMutations } from '@/supabase'2. Click on "SQL Editor" in the left sidebar



### Query vs Mutation Pattern3. Run each migration file in order:



- **Queries** (`/lib/queries/*`): Read-only operations that don't modify data// Read operations   - Copy the contents of `00001_initial_schema.sql` and run it

- **Mutations** (`/lib/mutations/*`): Operations that create, update, or delete data

const vehicles = await VehicleQueries.searchVehicles(filters)   - Copy the contents of `00002_rls_policies.sql` and run it

This separation makes it easier to:

- Optimize caching strategiesconst vehicle = await VehicleQueries.getVehicleById(id)   - Copy the contents of `00003_indexes.sql` and run it

- Implement React Query hooks

- Track data changes   - Copy the contents of `00004_functions.sql` and run it

- Audit database writes

// Write operations

### Admin vs Regular Client

const newVehicle = await VehicleMutations.createVehicle(data)#### Option B: Using Supabase CLI

```typescript

// Regular client - respects RLS policiesawait VehicleMutations.updateVehicle(id, updates)

import { supabase } from '@/supabase/config/supabaseClient'

``````bash

// Admin client - bypasses RLS (use only in secure server context)

import { supabaseAdmin } from '@/supabase/config/supabaseAdmin'# Install Supabase CLI

```

### 3. File Uploadsnpm install -g supabase

**⚠️ Security Warning**: Never expose `supabaseAdmin` or the service role key to the client.



## 📝 Development Workflow

```typescript# Login to Supabase

### 1. Create a New Table

import { StorageUtils } from '@/supabase'supabase login

```bash

# Create migration

supabase migration new add_comments_table

// Upload vehicle image# Link to your project

# Edit the migration file

# supabase/database/migrations/YYYYMMDD_add_comments_table.sqlconst imageUrl = await StorageUtils.uploadVehicleImage(file, vehicleId)supabase link --project-ref your-project-ref



# Apply migration

supabase db push

```// Upload profile picture# Run migrations



### 2. Generate TypeScript Typesconst profileUrl = await StorageUtils.uploadProfileImage(file, userId)supabase db push



```bash``````

# Generate types after schema changes

npm run supabase:gen-types



# Or manually### 4. Real-time Subscriptions### 5. Configure Storage Buckets

supabase gen types typescript --local > ./supabase/types/database.types.ts

```



### 3. Create Query/Mutation Functions```typescriptGo to Storage in Supabase Dashboard and create these buckets:



```typescriptimport { RealtimeUtils } from '@/supabase'

// supabase/lib/queries/comments.ts

import { supabase } from '@/supabase/config/supabaseClient'1. **vehicle-images**



export async function getCommentsByPost(postId: string) {// Subscribe to new messages   - Public bucket

  const { data, error } = await supabase

    .from('comments')const channel = RealtimeUtils.subscribeToBookingMessages(   - File size limit: 5MB

    .select('*')

    .eq('post_id', postId)  bookingId,   - Allowed MIME types: image/jpeg, image/png, image/webp

    .order('created_at', { ascending: false })

  (message) => {

  if (error) throw error

  return data    console.log('New message:', message)2. **user-documents**

}

```  }   - Private bucket



### 4. Export in Index Files)   - File size limit: 10MB



```typescript   - Allowed MIME types: image/jpeg, image/png, application/pdf

// supabase/lib/queries/index.ts

export * from './comments'// Clean up



// Then use:await RealtimeUtils.unsubscribeChannel(channel)3. **profile-images**

import { getCommentsByPost } from '@/supabase/lib/queries'

``````   - Public bucket



## 🔐 Security Best Practices   - File size limit: 2MB



1. **Always use Row Level Security (RLS)**## 🧩 Key Concepts   - Allowed MIME types: image/jpeg, image/png, image/webp

   - Enable RLS on all tables

   - Define granular policies in `/database/policies/`



2. **Validate input on client AND server**### Singleton Pattern### 6. Configure Authentication

   - Use Zod schemas for validation

   - Never trust client-side data



3. **Use appropriate client for context**The Supabase client uses a singleton pattern to prevent recreation on every component render:Go to Authentication > Providers in Supabase Dashboard:

   - Browser: `supabase` (from supabaseClient.ts)

   - Server: `createServerClient()`

   - Admin ops: `supabaseAdmin` (server-only)

```typescript1. **Email**

4. **Protect sensitive operations**

   - Approvals, role changes, and deletions should use admin client// ✅ Good - uses singleton   - Enable Email provider

   - Only call admin functions from secure API routes

import { supabase } from '@/supabase/config/supabaseClient'   - Enable "Confirm email" (recommended for production)

## 🗃️ Database Organization

   

### Migrations (`/database/migrations/`)

// ❌ Bad - creates new instance every time2. **Google OAuth** (Optional)

Sequential, immutable SQL files that define schema changes:

- `00001_initial_schema.sql` - Base tablesimport { createClientComponentClient } from '@supabase/auth-helpers-nextjs'   - Enable Google provider

- `00002_rls_policies.sql` - Security policies

- `00003_indexes.sql` - Performance indexesconst supabase = createClientComponentClient()   - Add OAuth credentials from Google Cloud Console

- `00004_functions.sql` - Stored procedures

- `00005_add_user_social_and_location.sql` - Additional fields```



**Never edit existing migrations** - create new ones for changes.3. **Facebook OAuth** (Optional)



### Seeds (`/database/seeds/`)### Query vs Mutation Pattern   - Enable Facebook provider



Test and development data:   - Add OAuth credentials from Facebook Developers

- `seed_all.sql` - Complete dataset

- `seed_vehicles.sql` - Just vehicles- **Queries** (`/lib/queries/*`): Read-only operations that don't modify data

- Add custom seeds as needed

- **Mutations** (`/lib/mutations/*`): Operations that create, update, or delete data### 7. Seed Development Data (Optional)

### Scripts (`/database/scripts/`)



Utility scripts for maintenance and fixes:

- Admin account creation scriptsThis separation makes it easier to:For development/testing, run the seed file:

- RLS policy fixes

- Storage setup scripts- Optimize caching strategies

- Database cleanup utilities

- Implement React Query hooks```sql

## 📊 Type Safety

- Track data changes-- In Supabase SQL Editor, run:

All database operations are fully typed using generated TypeScript definitions:

- Audit database writes-- Copy and paste contents of seed.sql

```typescript

import type { Database } from '@/supabase/types/database.types'```



type Vehicle = Database['public']['Tables']['vehicles']['Row']### Admin vs Regular Client

type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']

type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']## Database Schema Overview

```

```typescript

Custom domain types extend these base types in `/types/index.ts`.

// Regular client - respects RLS policies### Core Tables

## 🔄 Migration from Old Structure

import { supabase } from '@/supabase/config/supabaseClient'

If migrating from `src/lib/supabase/*`, update imports:

- **users** - Extended user profiles (linked to auth.users)

```typescript

// Old// Admin client - bypasses RLS (use only in secure server context)- **vehicles** - Vehicle listings with specs and pricing

import { createClient } from '@/lib/supabase/client'

import { supabaseAdmin } from '@/supabase/config/supabaseAdmin'- **bookings** - Rental bookings connecting renters and vehicles

// New

import { supabase } from '@/supabase/config/supabaseClient'```- **payments** - Payment transactions and history



// Or for server- **reviews** - Reviews and ratings for vehicles and owners

import { createServerClient } from '@/supabase/config/supabaseClient'

```**⚠️ Security Warning**: Never expose `supabaseAdmin` or the service role key to the client.- **messages** - Real-time chat messages between users



The old structure in `src/lib/supabase/` can be deprecated once all imports are updated.- **maintenance_logs** - Vehicle maintenance tracking



See `/docs/MIGRATION_GUIDE_SUPABASE.md` for detailed migration instructions.## 📝 Development Workflow- **notifications** - In-app notifications for users



## 📚 Additional Resources- **blocked_dates** - Owner-defined unavailable dates



- [Supabase Documentation](https://supabase.com/docs)### 1. Create a New Table- **favorites** - User-saved favorite vehicles

- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)- **disputes** - Dispute management system

- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)

- See `README_OLD.md` for original setup instructions```bash



---# Create migration### Key Features



**Last Updated**: November 2025  supabase migration new add_comments_table

**Maintained by**: JuanRide Development Team

- ✅ Row Level Security (RLS) on all tables

# Edit the migration file- ✅ Automatic timestamps with triggers

# supabase/database/migrations/YYYYMMDD_add_comments_table.sql- ✅ Foreign key constraints for data integrity

- ✅ Performance indexes for common queries

# Apply migration- ✅ Full-text search capability

supabase db push- ✅ Real-time subscriptions for chat and notifications

```- ✅ Automated notifications via triggers

- ✅ Booking conflict prevention

### 2. Generate TypeScript Types- ✅ Automatic vehicle status updates



```bash## Useful Database Functions

# Generate types after schema changes

npm run supabase:gen-types### Check Vehicle Availability



# Or manually```sql

supabase gen types typescript --local > ./supabase/types/database.types.tsSELECT public.get_vehicle_availability(

```    'vehicle-uuid',

    '2025-01-01'::DATE,

### 3. Create Query/Mutation Functions    '2025-01-05'::DATE

);

```typescript```

// supabase/lib/queries/comments.ts

import { supabase } from '@/supabase/config/supabaseClient'### Get Vehicle Average Rating



export async function getCommentsByPost(postId: string) {```sql

  const { data, error } = await supabaseSELECT public.get_vehicle_avg_rating('vehicle-uuid');

    .from('comments')```

    .select('*')

    .eq('post_id', postId)### Get Owner Earnings

    .order('created_at', { ascending: false })

```sql

  if (error) throw errorSELECT * FROM public.get_owner_earnings(

  return data    'owner-uuid',

}    '2025-01-01'::DATE,

```    '2025-12-31'::DATE

);

### 4. Export in Index Files```



```typescript## Type Generation

// supabase/lib/queries/index.ts

export * from './comments'Generate TypeScript types from your database schema:



// Then use:```bash

import { getCommentsByPost } from '@/supabase/lib/queries'npm run supabase:gen-types

``````



## 🔐 Security Best PracticesThis creates/updates `src/types/database.types.ts` with all your table definitions.



1. **Always use Row Level Security (RLS)**## Backup and Recovery

   - Enable RLS on all tables

   - Define granular policies in `/database/policies/`### Manual Backup



2. **Validate input on client AND server**1. Go to Database > Backups in Supabase Dashboard

   - Use Zod schemas for validation2. Click "Create Backup"

   - Never trust client-side data3. Download the backup file



3. **Use appropriate client for context**### Automated Backups

   - Browser: `supabase` (from supabaseClient.ts)

   - Server: `createServerClient()`Supabase Pro plan includes:

   - Admin ops: `supabaseAdmin` (server-only)- Daily automated backups

- 7-day retention

4. **Protect sensitive operations**- Point-in-time recovery

   - Approvals, role changes, and deletions should use admin client

   - Only call admin functions from secure API routes## Monitoring



## 🗃️ Database OrganizationCheck these regularly:



### Migrations (`/database/migrations/`)1. **Database Health** - Database > Logs

2. **API Usage** - Project Settings > Usage

Sequential, immutable SQL files that define schema changes:3. **Real-time Connections** - Database > Realtime Inspector

- `00001_initial_schema.sql` - Base tables4. **Error Logs** - SQL Editor > Query History

- `00002_rls_policies.sql` - Security policies

- `00003_indexes.sql` - Performance indexes## Security Best Practices

- `00004_functions.sql` - Stored procedures

- `00005_add_user_social_and_location.sql` - Additional fields✅ **Never commit `.env.local` to git**

✅ **Keep service_role key secret** - Never expose in client code

**Never edit existing migrations** - create new ones for changes.✅ **Use RLS policies** - Already configured, don't disable

✅ **Validate inputs** - Both client and server side

### Seeds (`/database/seeds/`)✅ **Use prepared statements** - Supabase client does this automatically

✅ **Regular backups** - Enable automated backups in production

Test and development data:✅ **Monitor auth attempts** - Check for suspicious activity

- `seed_all.sql` - Complete dataset

- `seed_vehicles.sql` - Just vehicles## Troubleshooting

- Add custom seeds as needed

### RLS Errors

## 📊 Type Safety

If you get "permission denied" errors:

All database operations are fully typed using generated TypeScript definitions:- Check that RLS policies match your use case

- Verify you're using the correct auth context

```typescript- Check if the user has the right role

import type { Database } from '@/supabase/types/database.types'

### Migration Errors

type Vehicle = Database['public']['Tables']['vehicles']['Row']

type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']If migrations fail:

type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']- Run migrations in order (00001, 00002, etc.)

```- Check for syntax errors in SQL

- Ensure dependencies exist (e.g., auth.users before public.users)

Custom domain types extend these base types in `/types/index.ts`.

### Performance Issues

## 🔄 Migration from Old Structure

- Check Database > Logs for slow queries

If migrating from `src/lib/supabase/*`, update imports:- Verify indexes are created (run 00003_indexes.sql)

- Consider adding more specific indexes for your queries

```typescript

// Old## Support

import { createClient } from '@/lib/supabase/client'

- [Supabase Documentation](https://supabase.com/docs)

// New- [Supabase Discord](https://discord.supabase.com)

import { supabase } from '@/supabase/config/supabaseClient'- [GitHub Issues](https://github.com/supabase/supabase/issues)



// Or for server
import { createServerClient } from '@/supabase/config/supabaseClient'
```

The old structure in `src/lib/supabase/` can be deprecated once all imports are updated.

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
- See `README_OLD.md` for original setup instructions

---

**Last Updated**: November 2025
**Maintained by**: JuanRide Development Team
