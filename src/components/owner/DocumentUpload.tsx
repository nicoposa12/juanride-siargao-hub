'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, FileText, X, CheckCircle2, Loader2, AlertCircle, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { uploadVehicleDocument, deleteVehicleDocument } from '@/lib/supabase/storage'

interface DocumentUploadProps {
  label: string
  description: string
  documentUrl: string | null
  onChange: (url: string | null) => void
  required?: boolean
  accept?: string
  bucketPath?: string
}

export function DocumentUpload({
  label,
  description,
  documentUrl,
  onChange,
  required = false,
  accept = '.pdf,.jpg,.jpeg,.png',
  bucketPath = 'vehicle-documents'
}: DocumentUploadProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = async (file: File) => {
    // Validate file size (max 10MB for documents)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Document must be less than 10MB',
        variant: 'destructive',
      })
      return
    }

    // Validate file type
    const validTypes = accept.split(',').map(t => t.trim())
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!validTypes.some(type => type === fileExt || type === file.type)) {
      toast({
        title: 'Invalid File Type',
        description: `Please upload a valid document (${accept})`,
        variant: 'destructive',
      })
      return
    }

    setUploading(true)

    try {
      // Upload to Supabase Storage using helper function
      const publicUrl = await uploadVehicleDocument(file, bucketPath)
      
      onChange(publicUrl)

      toast({
        title: 'Document Uploaded',
        description: 'Your document has been uploaded successfully',
      })
    } catch (error: any) {
      console.error('Error uploading document:', error)
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleRemove = async () => {
    if (!documentUrl) return

    try {
      // Extract file path from URL
      const url = new URL(documentUrl)
      const pathParts = url.pathname.split('/')
      const bucketIndex = pathParts.findIndex(part => part === 'vehicle-assets')
      if (bucketIndex !== -1) {
        const filePath = pathParts.slice(bucketIndex + 1).join('/')
        
        // Delete from storage using helper function
        await deleteVehicleDocument(filePath)
      }

      onChange(null)

      toast({
        title: 'Document Removed',
        description: 'Document has been removed',
      })
    } catch (error: any) {
      console.error('Error removing document:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove document',
        variant: 'destructive',
      })
    }
  }

  const getFileName = (url: string) => {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const filename = pathname.split('/').pop() || 'document'
      // Remove timestamp and random string prefix
      return filename.replace(/^\d+_[a-z0-9]+_/, '')
    } catch {
      return 'document'
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>

      {!documentUrl ? (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragOver={(e) => {
            e.preventDefault()
            if (!uploading) setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!uploading) {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = accept
              input.onchange = (e: any) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }
              input.click()
            }
          }}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading document...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, PNG (max 10MB)
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="rounded-lg bg-green-100 p-2">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{getFileName(documentUrl)}</p>
                  <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Uploaded successfully</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(documentUrl, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {required && !documentUrl && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            This document is required before your vehicle can be approved
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
