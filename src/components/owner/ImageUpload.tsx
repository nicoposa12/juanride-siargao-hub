'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

interface ImageUploadProps {
  images: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  minImages?: number
}

export function ImageUpload({ 
  images, 
  onChange, 
  maxImages = 20,
  minImages = 3
}: ImageUploadProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  const supabase = createClient()
  
  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null
    
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })
      
      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(filePath)
      
      return publicUrl
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload image.',
        variant: 'destructive',
      })
      return null
    }
  }
  
  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    
    const files = Array.from(fileList)
    
    // Validate file count
    if (images.length + files.length > maxImages) {
      toast({
        title: 'Too Many Images',
        description: `You can upload a maximum of ${maxImages} images.`,
        variant: 'destructive',
      })
      return
    }
    
    // Validate each file
    const validFiles: File[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File',
          description: `${file.name} is not an image file.`,
          variant: 'destructive',
        })
        continue
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: `${file.name} exceeds the 5MB limit.`,
          variant: 'destructive',
        })
        continue
      }
      
      validFiles.push(file)
    }
    
    if (validFiles.length === 0) return
    
    setUploading(true)
    
    try {
      // Upload all files
      const uploadPromises = validFiles.map(file => uploadImage(file))
      const uploadedUrls = await Promise.all(uploadPromises)
      
      // Filter out failed uploads
      const successfulUrls = uploadedUrls.filter((url): url is string => url !== null)
      
      if (successfulUrls.length > 0) {
        onChange([...images, ...successfulUrls])
        toast({
          title: 'Images Uploaded',
          description: `Successfully uploaded ${successfulUrls.length} ${successfulUrls.length === 1 ? 'image' : 'images'}.`,
        })
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload images. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  
  const removeImage = async (index: number) => {
    const imageUrl = images[index]
    
    // Extract filename from URL to delete from storage
    try {
      const fileName = imageUrl.split('/').pop()
      if (fileName) {
        await supabase.storage
          .from('vehicle-images')
          .remove([fileName])
      }
    } catch (error) {
      console.error('Error deleting image from storage:', error)
      // Continue with removal from list even if storage deletion fails
    }
    
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
    
    toast({
      title: 'Image Removed',
      description: 'The image has been deleted.',
    })
  }
  
  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-muted-foreground/25 hover:border-primary/50'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          type="file"
          id="vehicle-image-upload"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />
        <label htmlFor="vehicle-image-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-primary/10 p-4">
              {uploading ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {uploading ? 'Uploading...' : 'Drop images here or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, GIF up to 5MB • Min: {minImages}, Max: {maxImages} images
              </p>
            </div>
          </div>
        </label>
      </div>
      
      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div key={url} className="relative group aspect-square">
              <Image
                src={url}
                alt={`Vehicle image ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeImage(index)}
                  className="rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Main Photo
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Info */}
      {images.length === 0 && (
        <div className="text-center py-8 border rounded-lg bg-muted/20">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No images uploaded yet. Upload at least {minImages} images.
          </p>
        </div>
      )}
      
      {images.length > 0 && images.length < minImages && (
        <p className="text-sm text-yellow-600">
          Please upload at least {minImages - images.length} more {minImages - images.length === 1 ? 'image' : 'images'}.
        </p>
      )}
      
      {images.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {images.length} / {maxImages} images uploaded
        </p>
      )}
    </div>
  )
}
