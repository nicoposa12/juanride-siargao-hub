# Owner Profile Contact & Social Media Enhancement

## Overview
This update adds comprehensive contact information, social media links, and location map features to owner profiles, similar to Turo's design.

## Database Changes

### New Migration File
**File:** `supabase/migrations/00005_add_user_social_and_location.sql`

### New Columns Added to `users` Table:
- `facebook_url` (TEXT) - Facebook profile/page URL
- `instagram_url` (TEXT) - Instagram profile URL  
- `twitter_url` (TEXT) - Twitter/X profile URL
- `whatsapp_number` (TEXT) - WhatsApp contact number
- `viber_number` (TEXT) - Viber contact number
- `latitude` (DECIMAL) - Latitude coordinate for owner location
- `longitude` (DECIMAL) - Longitude coordinate for owner location
- `location_name` (TEXT) - Human-readable location name

### How to Apply the Migration

1. **If using Supabase CLI locally:**
   ```bash
   npx supabase db reset
   ```
   Or apply the specific migration:
   ```bash
   npx supabase migration up
   ```

2. **If using Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy the contents of `supabase/migrations/00005_add_user_social_and_location.sql`
   - Paste and run the SQL

3. **Regenerate TypeScript types:**
   ```bash
   npm run supabase:gen-types
   ```

## Features Implemented

### 1. Owner Profile Page (`/profile/[id]`)
**File:** `src/app/profile/[id]/page.tsx`

#### New Features:
- ✅ **Contact Information Section**
  - Phone number with click-to-call
  - WhatsApp with direct link
  - Viber with direct link
  
- ✅ **Social Media Links**
  - Facebook profile button
  - Instagram profile button
  - Twitter/X profile button
  - Styled with brand colors
  
- ✅ **Interactive Map**
  - OpenStreetMap embedded view
  - Shows owner's location with marker
  - "View on Google Maps" link
  - Display location name
  
- ✅ **Quick Contact Sidebar**
  - Send Message button
  - Quick Call button
  - Quick WhatsApp button
  - Quick Viber button

### 2. Profile Settings Page (`/profile`)
**File:** `src/app/profile/page.tsx`

#### New Tab Added: "Contact & Social"
Allows owners to edit:
- WhatsApp number
- Viber number
- Facebook URL
- Instagram URL
- Twitter URL
- Location name
- Latitude & Longitude coordinates

## User Experience Flow

### For Renters:
1. View vehicle details page
2. Click "View Profile" button on owner card
3. Navigate to owner's profile page
4. See owner's contact information, social media, and location
5. Can quickly call, message via WhatsApp/Viber, or view on map

### For Owners:
1. Go to Profile Settings (`/profile`)
2. Navigate to "Contact & Social" tab
3. Fill in contact information:
   - Add WhatsApp/Viber numbers
   - Add social media profile URLs
   - Add location name and coordinates
4. Save changes
5. Information will be displayed on their public profile

## Getting Coordinates

Owners can find their coordinates by:
1. Going to [Google Maps](https://maps.google.com)
2. Searching for their location
3. Right-clicking on the map at their exact location
4. Clicking "What's here?"
5. Coordinates will appear at the bottom of the screen

Example coordinates for Siargao:
- General Luna: Latitude `9.8093`, Longitude `126.1568`

## Design Notes

### Map Implementation
- Using OpenStreetMap for free, open-source mapping
- Fallback to Google Maps link for better navigation
- Map shows approximate location (not exact address for privacy)

### Contact Privacy
- All contact information is optional
- Owners control what they share
- Only displayed on their public profile when filled in

### Social Media Integration
- Direct links to social profiles
- Branded buttons with official colors
- Opens in new tab

## Testing Checklist

- [ ] Apply database migration successfully
- [ ] Owner can add contact information in Profile Settings
- [ ] Owner can add social media URLs in Profile Settings
- [ ] Owner can add location coordinates in Profile Settings
- [ ] Changes are saved correctly to database
- [ ] Contact information displays on owner profile page
- [ ] Social media buttons work and open correct URLs
- [ ] Map displays correctly with owner's location
- [ ] Quick contact buttons work (Call, WhatsApp, Viber)
- [ ] "View on Google Maps" link works
- [ ] Empty states show appropriate messages
- [ ] Mobile responsive design works

## Files Modified

1. `supabase/migrations/00005_add_user_social_and_location.sql` (NEW)
2. `src/types/database.types.ts` (UPDATED)
3. `src/app/profile/[id]/page.tsx` (UPDATED)
4. `src/app/profile/page.tsx` (UPDATED)

## Next Steps

1. Apply the database migration
2. Test the new features in development
3. Add sample data for testing (optional)
4. Consider adding validation for social media URLs
5. Consider adding profile completion percentage indicator
