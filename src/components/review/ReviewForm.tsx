'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star, Upload, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

interface ReviewFormProps {
  vehicleId: string
  bookingId: string
  onSuccess?: () => void
}

export default function ReviewForm({ vehicleId, bookingId, onSuccess }: ReviewFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > 5) {
      toast({
        title: 'Too many images',
        description: 'You can upload a maximum of 5 images',
        variant: 'destructive',
      })
      return
    }

    const newImages = [...images, ...files]
    setImages(newImages)

    // Create previews
    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setImagePreviews([...imagePreviews, ...newPreviews])
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setImages(newImages)
    setImagePreviews(newPreviews)
  }

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = []

    for (const image of images) {
      const fileExt = image.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `review-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('review-images')
        .upload(filePath, image)

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        continue
      }

      const { data } = supabase.storage.from('review-images').getPublicUrl(filePath)
      uploadedUrls.push(data.publicUrl)
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to submit a review',
        variant: 'destructive',
      })
      return
    }

    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a rating',
        variant: 'destructive',
      })
      return
    }

    if (!comment.trim()) {
      toast({
        title: 'Comment required',
        description: 'Please write a review comment',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Upload images if any
      const imageUrls = images.length > 0 ? await uploadImages() : []

      // Create review
      const { error } = await supabase.from('reviews').insert({
        vehicle_id: vehicleId,
        booking_id: bookingId,
        renter_id: user.id,
        rating,
        comment: comment.trim(),
        images: imageUrls,
      })

      if (error) throw error

      toast({
        title: 'Review submitted!',
        description: 'Thank you for your feedback',
      })

      // Reset form
      setRating(0)
      setComment('')
      setImages([])
      setImagePreviews([])

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/vehicles/${vehicleId}`)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  onMouseEnter={() => setHoveredRating(i + 1)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      i < (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-muted text-muted'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Your Review *</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this vehicle..."
              rows={5}
              required
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Photos (Optional)</Label>
            <div className="space-y-3">
              {/* Preview Images */}
              {imagePreviews.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="h-24 w-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {images.length < 5 && (
                <div>
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Label htmlFor="image-upload">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload images (max 5)
                      </p>
                    </div>
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

