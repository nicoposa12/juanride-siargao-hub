'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Phone,
  Building2,
  CreditCard,
  Copy,
  CheckCircle2,
  Loader2,
  DollarSign,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils/format'

interface CommissionPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unpaidAmount: number
  unpaidCount: number
}

interface AdminPaymentInfo {
  full_name: string
  phone_number: string | null
  email: string
}

export function CommissionPaymentModal({
  open,
  onOpenChange,
  unpaidAmount,
  unpaidCount,
}: CommissionPaymentModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [adminInfo, setAdminInfo] = useState<AdminPaymentInfo | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadAdminInfo()
    }
  }, [open])

  const loadAdminInfo = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Fetch admin user details
      const { data, error } = await supabase
        .from('users')
        .select('full_name, phone_number, email')
        .eq('role', 'admin')
        .single()

      if (error) throw error

      setAdminInfo(data)
    } catch (error) {
      console.error('Error loading admin info:', error)
      toast({
        title: 'Error',
        description: 'Failed to load payment details. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast({
        title: 'Copied!',
        description: `${field} copied to clipboard`,
      })
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Please copy the information manually',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Commission Payment Details
          </DialogTitle>
          <DialogDescription>
            Payment information for settling your commission balance
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : adminInfo ? (
          <div className="space-y-6">
            {/* Amount Due Summary */}
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-900">
                      Total Amount Due:
                    </span>
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(unpaidAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-red-700">
                    {unpaidCount} unpaid transaction{unpaidCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <Separator />

            {/* Payment Methods */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                Payment Options
              </h4>

              {/* GCash Payment */}
              {adminInfo.phone_number && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <h5 className="font-semibold">GCash Payment</h5>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Account Name</p>
                        <p className="font-medium">{adminInfo.full_name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(adminInfo.full_name, 'Name')}
                      >
                        {copiedField === 'Name' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Mobile Number</p>
                        <p className="font-medium font-mono">{adminInfo.phone_number}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(adminInfo.phone_number!, 'Phone Number')}
                      >
                        {copiedField === 'Phone Number' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Transfer - Placeholder for future implementation */}
              <div className="rounded-lg border p-4 space-y-3 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <h5 className="font-semibold text-muted-foreground">Bank Transfer</h5>
                </div>
                <p className="text-sm text-muted-foreground">
                  Contact admin for bank transfer details
                </p>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Email: {adminInfo.email}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Instructions */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Payment Instructions</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Send payment to the provided account details</li>
                <li>Take a screenshot of the payment confirmation</li>
                <li>Keep the transaction reference number</li>
                <li>Contact admin to confirm payment receipt</li>
              </ol>
            </div>

            {/* Contact Info */}
            <Alert>
              <AlertDescription className="text-xs">
                For assistance, contact admin at{' '}
                <a
                  href={`mailto:${adminInfo.email}`}
                  className="font-medium text-primary hover:underline"
                >
                  {adminInfo.email}
                </a>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>
              Unable to load payment details. Please contact support.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
