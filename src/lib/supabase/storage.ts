import { createClient } from './client'

const VEHICLE_IMAGES_BUCKET = 'vehicle-images'
const PROFILE_IMAGES_BUCKET = 'profile-images'
const REVIEW_IMAGES_BUCKET = 'review-images'

export async function uploadVehicleImage(
  file: File,
  vehicleId: string
): Promise<string> {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${vehicleId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(VEHICLE_IMAGES_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from(VEHICLE_IMAGES_BUCKET)
    .getPublicUrl(fileName)

  return publicUrl
}

export async function uploadProfileImage(
  file: File,
  userId: string
): Promise<string> {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/profile.${fileExt}`

  const { data, error } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .getPublicUrl(fileName)

  return publicUrl
}

export async function uploadReviewImage(
  file: File,
  reviewId: string
): Promise<string> {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${reviewId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(REVIEW_IMAGES_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from(REVIEW_IMAGES_BUCKET)
    .getPublicUrl(fileName)

  return publicUrl
}

export async function deleteImage(bucket: string, path: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) throw error
}

