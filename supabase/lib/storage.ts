/**
 * Supabase Storage Utilities
 * Helper functions for file uploads and management
 */

import { supabase } from '@/supabase/config/supabaseClient'

// Storage bucket names
export const STORAGE_BUCKETS = {
  VEHICLE_IMAGES: 'vehicle-images',
  PROFILE_IMAGES: 'profile-images',
  REVIEW_IMAGES: 'review-images',
  USER_DOCUMENTS: 'user-documents', // Private bucket for ID verification
} as const

/**
 * Upload vehicle image
 */
export async function uploadVehicleImage(
  file: File,
  vehicleId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${vehicleId}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.VEHICLE_IMAGES)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading vehicle image:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.VEHICLE_IMAGES)
    .getPublicUrl(fileName)

  return data.publicUrl
}

/**
 * Upload multiple vehicle images
 */
export async function uploadVehicleImages(
  files: File[],
  vehicleId: string
): Promise<string[]> {
  const uploadPromises = files.map((file) =>
    uploadVehicleImage(file, vehicleId)
  )
  return Promise.all(uploadPromises)
}

/**
 * Delete vehicle image
 */
export async function deleteVehicleImage(imagePath: string): Promise<void> {
  // Extract path from URL if full URL is provided
  const path = imagePath.includes('/vehicle-images/')
    ? imagePath.split('/vehicle-images/')[1]
    : imagePath

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.VEHICLE_IMAGES)
    .remove([path])

  if (error) {
    console.error('Error deleting vehicle image:', error)
    throw error
  }
}

/**
 * Upload profile image
 */
export async function uploadProfileImage(
  file: File,
  userId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/profile.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.PROFILE_IMAGES)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true, // Replace existing profile image
    })

  if (uploadError) {
    console.error('Error uploading profile image:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.PROFILE_IMAGES)
    .getPublicUrl(fileName)

  return data.publicUrl
}

/**
 * Delete profile image
 */
export async function deleteProfileImage(userId: string): Promise<void> {
  // Profile images are stored as userId/profile.ext, we need to list and delete
  const { data: files, error: listError } = await supabase.storage
    .from(STORAGE_BUCKETS.PROFILE_IMAGES)
    .list(userId)

  if (listError) {
    console.error('Error listing profile images:', listError)
    throw listError
  }

  if (files && files.length > 0) {
    const filePaths = files.map((file) => `${userId}/${file.name}`)
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.PROFILE_IMAGES)
      .remove(filePaths)

    if (error) {
      console.error('Error deleting profile images:', error)
      throw error
    }
  }
}

/**
 * Upload review image
 */
export async function uploadReviewImage(
  file: File,
  reviewId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${reviewId}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.REVIEW_IMAGES)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading review image:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.REVIEW_IMAGES)
    .getPublicUrl(fileName)

  return data.publicUrl
}

/**
 * Upload user document (ID verification)
 */
export async function uploadUserDocument(
  file: File,
  userId: string,
  documentType: 'id_front' | 'id_back' | 'drivers_license'
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${documentType}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.USER_DOCUMENTS)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    console.error('Error uploading user document:', uploadError)
    throw uploadError
  }

  // Note: USER_DOCUMENTS is a private bucket, so we return the path, not public URL
  return fileName
}

/**
 * Get signed URL for private document
 */
export async function getSignedDocumentUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.USER_DOCUMENTS)
    .createSignedUrl(filePath, expiresIn)

  if (error) {
    console.error('Error creating signed URL:', error)
    throw error
  }

  return data.signedUrl
}

/**
 * Delete file from any bucket
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}

/**
 * Delete multiple files from a bucket
 */
export async function deleteFiles(
  bucket: string,
  paths: string[]
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove(paths)

  if (error) {
    console.error('Error deleting files:', error)
    throw error
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).list(path)

  if (error) {
    console.error('Error getting file metadata:', error)
    throw error
  }

  return data
}

/**
 * Check if file exists
 */
export async function fileExists(bucket: string, path: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)
    
    return !error && !!data
  } catch {
    return false
  }
}
