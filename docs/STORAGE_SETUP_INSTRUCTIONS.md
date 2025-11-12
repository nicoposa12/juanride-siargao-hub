# Supabase Storage Setup Instructions

This guide will help you set up the storage buckets for JuanRide.

## Manual Setup via Supabase Dashboard

### Step 1: Access Storage

1. Go to your Supabase project dashboard
2. Click on **Storage** in the left sidebar

### Step 2: Create Buckets

Create the following three buckets:

#### Bucket 1: vehicle-images

1. Click **"New bucket"**
2. Enter name: `vehicle-images`
3. Set **Public bucket**: ✅ YES (checked)
4. File size limit: `5 MB`
5. Allowed MIME types: `image/jpeg,image/png,image/webp`
6. Click **"Create bucket"**

#### Bucket 2: user-documents

1. Click **"New bucket"**
2. Enter name: `user-documents`
3. Set **Public bucket**: ❌ NO (unchecked - private)
4. File size limit: `10 MB`
5. Allowed MIME types: `image/jpeg,image/png,application/pdf`
6. Click **"Create bucket"**

#### Bucket 3: profile-images

1. Click **"New bucket"**
2. Enter name: `profile-images`
3. Set **Public bucket**: ✅ YES (checked)
4. File size limit: `2 MB`
5. Allowed MIME types: `image/jpeg,image/png,image/webp`
6. Click **"Create bucket"**

### Step 3: Apply Storage Policies

After creating the buckets:

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy the contents of `supabase/storage-setup.sql`
3. Paste and run the SQL
4. Verify no errors appear

## Folder Structure

The storage will be organized as follows:

### vehicle-images/
```
vehicle-images/
├── {vehicle-id}/
│   ├── main.jpg
│   ├── photo-1.jpg
│   ├── photo-2.jpg
│   └── ...
```

### user-documents/
```
user-documents/
├── {user-id}/
│   ├── id-front.jpg
│   ├── id-back.jpg
│   ├── drivers-license.jpg
│   └── business-permit.pdf
```

### profile-images/
```
profile-images/
├── {user-id}.jpg
└── {user-id}-2.jpg
```

## Usage in Code

### Uploading Vehicle Images

```typescript
import { createClient } from '@/lib/supabase/client'

async function uploadVehicleImage(
  vehicleId: string, 
  file: File
): Promise<string> {
  const supabase = createClient()
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${vehicleId}/${Date.now()}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('vehicle-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) throw error
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('vehicle-images')
    .getPublicUrl(fileName)
  
  return publicUrl
}
```

### Uploading User Documents (Private)

```typescript
async function uploadUserDocument(
  userId: string,
  file: File,
  documentType: string
): Promise<string> {
  const supabase = createClient()
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${documentType}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('user-documents')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true // Allow replacement
    })
  
  if (error) throw error
  
  // For private buckets, use signed URLs
  const { data: signedUrl } = await supabase.storage
    .from('user-documents')
    .createSignedUrl(fileName, 3600) // 1 hour expiry
  
  return signedUrl?.signedUrl || ''
}
```

### Uploading Profile Images

```typescript
async function uploadProfileImage(
  userId: string,
  file: File
): Promise<string> {
  const supabase = createClient()
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('profile-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true // Replace existing
    })
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('profile-images')
    .getPublicUrl(fileName)
  
  return publicUrl
}
```

### Deleting Files

```typescript
async function deleteVehicleImages(vehicleId: string) {
  const supabase = createClient()
  
  // List all files for this vehicle
  const { data: files } = await supabase.storage
    .from('vehicle-images')
    .list(vehicleId)
  
  if (!files || files.length === 0) return
  
  // Delete all files
  const filePaths = files.map(file => `${vehicleId}/${file.name}`)
  
  const { error } = await supabase.storage
    .from('vehicle-images')
    .remove(filePaths)
  
  if (error) throw error
}
```

## Image Optimization

For better performance, optimize images before upload:

```typescript
async function optimizeAndUpload(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    img.onload = () => {
      const scaleFactor = Math.min(1, maxWidth / img.width)
      canvas.width = img.width * scaleFactor
      canvas.height = img.height * scaleFactor
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas to Blob failed'))
        },
        'image/jpeg',
        quality
      )
    }
    
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
```

## Security Notes

1. **Public Buckets** (vehicle-images, profile-images):
   - Anyone can view files
   - Only authenticated users can upload
   - Only owners can delete their files

2. **Private Buckets** (user-documents):
   - Files are not publicly accessible
   - Use signed URLs for temporary access
   - Only the owner and admins can access

3. **File Size Limits**:
   - Enforced at bucket level
   - Also validate on client before upload
   - Show user-friendly error messages

4. **MIME Type Restrictions**:
   - Prevents upload of executable files
   - Only allow image and document types
   - Validate on both client and server

## Troubleshooting

### Upload Fails with "Access Denied"

- Check RLS policies are applied (`storage-setup.sql`)
- Verify user is authenticated
- Confirm user has correct role (owner for vehicle images)

### Images Not Displaying

- For public buckets: Use `getPublicUrl()`
- For private buckets: Use `createSignedUrl()`
- Check bucket is public if using direct URLs

### Large Files Taking Too Long

- Implement client-side compression
- Show upload progress to user
- Consider chunked uploads for very large files

## Best Practices

✅ Always validate file types before upload
✅ Compress images on client side
✅ Use unique filenames to avoid conflicts
✅ Handle errors gracefully with user feedback
✅ Clean up old files when no longer needed
✅ Use signed URLs for private files
✅ Set appropriate cache headers
✅ Monitor storage usage in Supabase dashboard

