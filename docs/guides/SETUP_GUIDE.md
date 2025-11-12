# JuanRide Setup Guide

Welcome to JuanRide! This guide will help you set up the project for development.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is fine)
- Git installed
- A code editor (VS Code recommended)

## Quick Start (5 minutes)

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd juanride-siargao-hub

# Install dependencies
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Name it "juanride-siargao" (or whatever you prefer)
3. Choose Southeast Asia (Singapore) region (closest to Philippines)
4. Wait for the project to be created (~2 minutes)

### 3. Get Your API Keys

1. In your Supabase project, go to **Project Settings** > **API**
2. Copy these values:
   - `Project URL` → NEXT_PUBLIC_SUPABASE_URL
   - `anon public` key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `service_role` key → SUPABASE_SERVICE_ROLE_KEY

### 4. Create Environment File

Create a file named `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ **Important:** Never commit `.env.local` to Git! It contains secrets.

### 5. Run Database Migrations

In your Supabase project dashboard:

1. Click **SQL Editor** in the left sidebar
2. Open each migration file and run them in order:

   a. **00001_initial_schema.sql**
   ```
   Open: supabase/migrations/00001_initial_schema.sql
   Copy the entire contents
   Paste into SQL Editor
   Click "Run"
   ```

   b. **00002_rls_policies.sql**
   ```
   Open: supabase/migrations/00002_rls_policies.sql
   Copy the entire contents
   Paste into SQL Editor
   Click "Run"
   ```

   c. **00003_indexes.sql**
   ```
   Open: supabase/migrations/00003_indexes.sql
   Copy the entire contents
   Paste into SQL Editor
   Click "Run"
   ```

   d. **00004_functions.sql**
   ```
   Open: supabase/migrations/00004_functions.sql
   Copy the entire contents
   Paste into SQL Editor
   Click "Run"
   ```

You should see ✅ "Success. No rows returned" for each migration.

### 6. Set Up Storage Buckets

In your Supabase project:

1. Click **Storage** in the left sidebar
2. Click **New bucket**

Create three buckets:

#### Bucket 1: vehicle-images
- Name: `vehicle-images`
- Public: ✅ **YES**
- File size limit: 5 MB
- Click "Create bucket"

#### Bucket 2: user-documents
- Name: `user-documents`
- Public: ❌ **NO**
- File size limit: 10 MB
- Click "Create bucket"

#### Bucket 3: profile-images
- Name: `profile-images`
- Public: ✅ **YES**
- File size limit: 2 MB
- Click "Create bucket"

Then run the storage policies:

```
Go to SQL Editor
Open: supabase/storage-setup.sql
Copy and paste the contents
Click "Run"
```

### 7. (Optional) Add Sample Data

For development/testing:

```
Go to SQL Editor
Open: supabase/seed.sql
Copy and paste the contents
Click "Run"
```

This adds sample users, vehicles, and bookings you can use for testing.

### 8. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

🎉 **You're all set!**

## Next Steps

### Test Authentication

1. Go to `http://localhost:3000/signup`
2. Create an account:
   - Email: test@example.com
   - Password: password123
   - Full Name: Test User
   - Role: Renter
3. Check your email for verification (if enabled)
4. Log in at `http://localhost:3000/login`

### Explore the Dashboard

After logging in:
- **Renters:** Can browse vehicles and make bookings
- **Owners:** Access `/owner/dashboard` to manage vehicles
- **Admins:** Access `/admin/dashboard` to manage platform

To create an owner or admin account, modify the role in the database:

```sql
UPDATE users SET role = 'owner' WHERE email = 'yourlemail@example.com';
-- or
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

## Project Structure

```
juanride-siargao-hub/
├── supabase/              # Database migrations and config
├── src/
│   ├── app/               # Next.js pages (App Router)
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   └── types/             # TypeScript types
├── public/                # Static assets
└── middleware.ts          # Route protection
```

## Common Issues

### "Failed to fetch" error

- Check that your Supabase URL is correct in `.env.local`
- Verify your Supabase project is running
- Check your internet connection

### "Row Level Security" errors

- Make sure you ran the RLS policies migration
- Check that you're logged in
- Verify your user has the correct role

### Images not uploading

- Verify storage buckets are created
- Check storage policies are applied
- Ensure file size is under limit

### Can't log in

- Clear browser cache and cookies
- Check Supabase Auth is enabled
- Verify email/password are correct
- Check browser console for errors

## Development Workflow

1. **Start dev server:** `npm run dev`
2. **Check types:** `npm run type-check`
3. **Lint code:** `npm run lint`
4. **Format code:** `npm run format`

## Testing Accounts

If you ran the seed data, you have these test accounts:

| Email | Password | Role |
|-------|----------|------|
| admin@juanride.com | (set in Supabase Auth) | Admin |
| maria@owner.com | (set in Supabase Auth) | Owner |
| alex@tourist.com | (set in Supabase Auth) | Renter |

To set passwords, use Supabase Dashboard > Authentication > Users.

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (keep secret!)

Optional (for production):
- Payment gateway keys (GCash, Maya, Stripe)
- Email service (SendGrid, AWS SES)
- SMS service (Semaphore, Twilio)
- Error tracking (Sentry)

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

Works with any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Getting Help

- **Documentation:** See `/docs` folder for detailed specs
- **Implementation Status:** `IMPLEMENTATION_STATUS.md`
- **Database Info:** `supabase/README.md`
- **Storage Setup:** `supabase/STORAGE_SETUP_INSTRUCTIONS.md`

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Your License Here]

---

**Happy coding! 🚀**

If you encounter any issues, check the documentation or open an issue.

