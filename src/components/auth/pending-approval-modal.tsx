'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PendingApprovalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName?: string
  userRole?: 'renter' | 'owner'
}

export function PendingApprovalModal({ open, onOpenChange, userName, userRole = 'renter' }: PendingApprovalModalProps) {
  const router = useRouter()

  const handleClose = () => {
    onOpenChange(false)
    router.push('/login')
  }

  const documentType = userRole === 'renter' ? 'ID documents' : 'business documents'
  const roleDescription = userRole === 'renter' 
    ? 'As a renter, you need valid ID verification to book vehicles.'
    : 'As an owner, you need business document verification to list vehicles.'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
          </div>
          <DialogTitle className="text-center text-xl">
            Account Registration Pending
          </DialogTitle>
          <DialogDescription className="text-center space-y-4 pt-4">
            <p className="text-base">
              Thank you for registering{userName ? `, ${userName}` : ''}! 🎉
            </p>
            <div className="bg-muted p-4 rounded-lg space-y-3 text-left">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Verification Required</p>
                  <p className="text-sm">
                    Your account is currently under review. Our admin team is verifying your {documentType}.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {roleDescription}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">What's Next?</p>
                  <p className="text-sm">
                    You'll receive an email notification once your account is approved. This usually takes 24-48 hours.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              You won't be able to log in until your account is approved by our administrators.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={handleClose} className="w-full">
            Okay, I Understand
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = 'mailto:support@juanride.com'}
            className="w-full"
          >
            Contact Support
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
