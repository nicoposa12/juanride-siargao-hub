'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { createCommission } from '@/lib/supabase/queries/commissions'
import Link from 'next/link'

interface BackfillResult {
  booking_id: string
  booking_code: string
  rental_amount: number
  commission_amount: number
  owner_name: string
  vehicle: string
  success: boolean
  error?: string
}

export default function CommissionBackfillPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<BackfillResult[]>([])
  const [missingCount, setMissingCount] = useState(0)
  const [bookingsToBackfill, setBookingsToBackfill] = useState<any[]>([])
  
  // Check authorization
  if (profile && profile.role !== 'admin') {
    router.push('/unauthorized')
    return null
  }
  
  const analyzeBookings = async () => {
    setAnalyzing(true)
    try {
      const supabase = createClient()
      
      // Get all confirmed/active/completed bookings with payment info
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          total_price,
          status,
          created_at,
          vehicle:vehicles (
            id,
            make,
            model,
            owner:users!vehicles_owner_id_fkey (
              id,
              full_name
            )
          ),
          payment:payments (
            payment_method,
            status
          )
        `)
        .in('status', ['confirmed', 'active', 'ongoing', 'completed'])
      
      if (error) throw error
      
      // Check which bookings don't have commission records
      const bookingsWithoutCommissions = []
      
      for (const booking of bookings || []) {
        const { data: commission } = await supabase
          .from('commissions')
          .select('id')
          .eq('booking_id', booking.id)
          .single()
        
        if (!commission) {
          bookingsWithoutCommissions.push(booking)
        }
      }
      
      setMissingCount(bookingsWithoutCommissions.length)
      setBookingsToBackfill(bookingsWithoutCommissions)
      
      toast({
        title: 'Analysis Complete',
        description: `Found ${bookingsWithoutCommissions.length} bookings without commission records.`,
      })
    } catch (error: any) {
      console.error('Error analyzing bookings:', error)
      
      // Check if it's a table not found error
      const errorMessage = error?.message || 'Unknown error'
      const isTableNotFound = errorMessage.toLowerCase().includes('commissions') && 
                              (errorMessage.toLowerCase().includes('does not exist') || 
                               errorMessage.toLowerCase().includes('relation'))
      
      toast({
        title: 'Analysis Failed',
        description: isTableNotFound 
          ? 'Commissions table not found. Please run the database migration first.'
          : `Failed to analyze bookings: ${errorMessage}`,
        variant: 'destructive',
      })
    } finally {
      setAnalyzing(false)
    }
  }
  
  const backfillCommissions = async () => {
    if (bookingsToBackfill.length === 0) {
      toast({
        title: 'No Bookings to Process',
        description: 'Please analyze bookings first.',
        variant: 'destructive',
      })
      return
    }
    
    setLoading(true)
    const backfillResults: BackfillResult[] = []
    
    try {
      for (const booking of bookingsToBackfill) {
        const vehicle: any = Array.isArray(booking.vehicle) ? booking.vehicle[0] : booking.vehicle
        const owner: any = Array.isArray(vehicle?.owner) ? vehicle.owner[0] : vehicle?.owner
        
        // Get payment method from payment record
        const payment: any = Array.isArray(booking.payment) ? booking.payment[0] : booking.payment
        const dbPaymentMethod = payment?.payment_method || 'cash'
        
        // Map database payment method to commission payment method
        const methodMap: Record<string, string> = {
          'gcash': 'gcash',
          'maya': 'paymaya',
          'paymaya': 'paymaya',
          'qrph': 'qrph',
          'grab_pay': 'grabpay',
          'grabpay': 'grabpay',
          'billease': 'billease',
          'card': 'gcash', // Map card to gcash (cashless)
          'bank_transfer': 'gcash', // Map bank transfer to gcash (cashless)
          'cash': 'cash',
        }
        
        const paymentMethod = (methodMap[dbPaymentMethod] || 'cash') as any
        
        try {
          const result = await createCommission(
            booking.id,
            owner.id,
            booking.total_price,
            paymentMethod // Use actual payment method from payment record
          )
          
          backfillResults.push({
            booking_id: booking.id,
            booking_code: booking.id.slice(0, 8),
            rental_amount: booking.total_price,
            commission_amount: booking.total_price * 0.10,
            owner_name: owner.full_name,
            vehicle: `${vehicle.make} ${vehicle.model}`,
            success: result.success,
            error: result.error?.message,
          })
        } catch (error: any) {
          backfillResults.push({
            booking_id: booking.id,
            booking_code: booking.id.slice(0, 8),
            rental_amount: booking.total_price,
            commission_amount: booking.total_price * 0.10,
            owner_name: owner?.full_name || 'Unknown',
            vehicle: `${vehicle?.make} ${vehicle?.model}` || 'Unknown',
            success: false,
            error: error.message,
          })
        }
      }
      
      setResults(backfillResults)
      
      const successCount = backfillResults.filter(r => r.success).length
      const failCount = backfillResults.filter(r => !r.success).length
      
      toast({
        title: 'Backfill Complete',
        description: `Successfully created ${successCount} commission records. ${failCount} failed.`,
        variant: failCount > 0 ? 'destructive' : 'default',
      })
      
      // Clear bookings to backfill after processing
      setBookingsToBackfill([])
      setMissingCount(0)
    } catch (error) {
      console.error('Error backfilling commissions:', error)
      toast({
        title: 'Backfill Failed',
        description: 'An error occurred during backfill.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length
  const totalCommission = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.commission_amount, 0)
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/commissions">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Commissions
          </Button>
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary-700">
          Commission Backfill Tool
        </h1>
        <p className="text-muted-foreground mt-2 text-base sm:text-lg font-medium">
          Create commission records for existing confirmed bookings
        </p>
      </div>
      
      {/* Info Alert */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This tool will scan for confirmed, active, or completed bookings that don't have commission records
          and create them automatically. The commission payment method will be based on the <strong>renter's chosen payment method</strong>.
          All commissions will be created with <strong>Pending</strong> status.
        </AlertDescription>
      </Alert>
      
      {/* Migration Warning */}
      <Alert className="mb-6 border-orange-300 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Important:</strong> Before using this tool, make sure you've applied the database migration:
          <br />
          <code className="bg-orange-100 px-2 py-1 rounded mt-2 inline-block">
            supabase db push
          </code>
          <br />
          <span className="text-sm mt-1 inline-block">
            Or run: <code className="bg-orange-100 px-1 py-0.5 rounded">supabase/migrations/00043_create_commissions_table.sql</code>
          </span>
        </AlertDescription>
      </Alert>
      
      {/* Action Buttons */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Analyze Bookings</CardTitle>
            <CardDescription>
              Scan for bookings without commission records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={analyzeBookings}
              disabled={analyzing || loading}
              className="w-full"
              size="lg"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Analyze Bookings
                </>
              )}
            </Button>
            
            {missingCount > 0 && (
              <Alert className="mt-4 border-yellow-300 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  Found <strong>{missingCount}</strong> bookings without commission records
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Create Commissions</CardTitle>
            <CardDescription>
              Generate commission records for missing bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={backfillCommissions}
              disabled={loading || analyzing || missingCount === 0}
              className="w-full"
              size="lg"
              variant="default"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create {missingCount} Commission{missingCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
            
            {results.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Success:</span>
                  <Badge className="bg-green-100 text-green-800">
                    {successCount}
                  </Badge>
                </div>
                {failCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Failed:</span>
                    <Badge variant="destructive">
                      {failCount}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Total Commission:</span>
                  <span className="text-primary-600">
                    ₱{totalCommission.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Results Table */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Backfill Results</CardTitle>
            <CardDescription>
              Summary of commission records created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-2">Booking</th>
                    <th className="pb-2">Vehicle</th>
                    <th className="pb-2">Owner</th>
                    <th className="pb-2">Rental</th>
                    <th className="pb-2">Commission</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">#{result.booking_code}</td>
                      <td className="py-2">{result.vehicle}</td>
                      <td className="py-2">{result.owner_name}</td>
                      <td className="py-2">₱{result.rental_amount.toFixed(2)}</td>
                      <td className="py-2 font-semibold text-primary-600">
                        ₱{result.commission_amount.toFixed(2)}
                      </td>
                      <td className="py-2">
                        {result.success ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Created
                          </Badge>
                        ) : (
                          <Badge variant="destructive" title={result.error}>
                            Failed
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
