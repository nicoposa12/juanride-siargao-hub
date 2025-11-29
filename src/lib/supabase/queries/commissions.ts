import { createClient } from '@/lib/supabase/client'

export type PaymentMethod = 'qrph' | 'gcash' | 'paymaya' | 'grabpay' | 'billease' | 'cash'
export type PaymentType = 'cashless' | 'cash'
export type CommissionStatus = 'unpaid' | 'for_verification' | 'paid' | 'suspended'

export interface Commission {
  id: string
  booking_id: string
  owner_id: string
  rental_amount: number
  commission_amount: number
  commission_percentage: number
  payment_method: PaymentMethod
  payment_type: PaymentType
  status: CommissionStatus
  bank_transfer_reference?: string
  bank_name?: string
  transfer_date?: string
  payment_proof_url?: string
  verified_by?: string
  verified_at?: string
  verification_notes?: string
  created_at: string
  updated_at: string
  booking?: any
  owner?: any
  verifier?: any
}

export interface CommissionSummary {
  total_commission: number
  cashless_commission: number
  cash_commission: number
  unpaid_count: number
  for_verification_count: number
  paid_count: number
  suspended_count: number
}

export interface OwnerCommissionSummary {
  owner_id: string
  owner_name: string
  owner_email: string
  owner_location: string | null
  owner_profile_image: string | null
  is_suspended: boolean
  suspension_reason: string | null
  total_commission: number
  paid_commission: number
  unpaid_commission: number
  transaction_count: number
  has_unpaid: boolean
  latest_transaction_date: string
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  qrph: 'QRPh',
  gcash: 'GCash',
  paymaya: 'PayMaya',
  grabpay: 'GrabPay',
  billease: 'BillEase',
  cash: 'Cash',
}

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  unpaid: 'Not Paid',
  for_verification: 'For Verification',
  paid: 'Paid',
  suspended: 'Suspended',
}

/**
 * Create a commission record when a booking is confirmed
 */
export async function createCommission(
  bookingId: string,
  ownerId: string,
  rentalAmount: number,
  paymentMethod: PaymentMethod
): Promise<{ success: boolean; commission?: Commission; error?: any }> {
  try {
    const supabase = createClient()
    
    const commissionPercentage = 10.00
    const commissionAmount = rentalAmount * (commissionPercentage / 100)
    const paymentType: PaymentType = paymentMethod === 'cash' ? 'cash' : 'cashless'
    
    const { data, error } = await supabase
      .from('commissions')
      .insert({
        booking_id: bookingId,
        owner_id: ownerId,
        rental_amount: rentalAmount,
        commission_amount: commissionAmount,
        commission_percentage: commissionPercentage,
        payment_method: paymentMethod,
        payment_type: paymentType,
        status: 'unpaid',
      })
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, commission: data }
  } catch (error) {
    console.error('Error creating commission:', error)
    return { success: false, error }
  }
}

/**
 * Get all commissions (Admin view)
 */
export async function getAllCommissions(filters?: {
  status?: CommissionStatus
  paymentType?: PaymentType
  startDate?: string
  endDate?: string
}): Promise<Commission[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('commissions')
    .select(`
      *,
      booking:bookings (
        id,
        start_date,
        end_date,
        total_price,
        vehicle:vehicles (make, model, plate_number)
      ),
      owner:users!commissions_owner_id_fkey (
        id,
        full_name,
        email,
        phone_number
      ),
      verifier:users!commissions_verified_by_fkey (
        id,
        full_name
      )
    `)
    .order('created_at', { ascending: false })
  
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  
  if (filters?.paymentType) {
    query = query.eq('payment_type', filters.paymentType)
  }
  
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate)
  }
  
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching commissions:', error)
    return []
  }
  
  return (data as Commission[]) || []
}

/**
 * Get commissions for a specific owner
 */
export async function getOwnerCommissions(ownerId: string): Promise<Commission[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('commissions')
    .select(`
      *,
      booking:bookings (
        id,
        start_date,
        end_date,
        total_price,
        vehicle:vehicles (make, model, plate_number),
        renter:users!bookings_renter_id_fkey (full_name)
      )
    `)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching owner commissions:', error)
    return []
  }
  
  return (data as Commission[]) || []
}

/**
 * Submit commission payment proof (Owner action)
 */
export async function submitCommissionPayment(
  commissionId: string,
  data: {
    bank_transfer_reference: string
    bank_name: string
    transfer_date: string
    payment_proof_url?: string
  }
): Promise<{ success: boolean; error?: any }> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('commissions')
      .update({
        ...data,
        status: 'for_verification',
        updated_at: new Date().toISOString(),
      })
      .eq('id', commissionId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error submitting commission payment:', error)
    return { success: false, error }
  }
}

/**
 * Verify commission payment (Admin action)
 */
export async function verifyCommission(
  commissionId: string,
  adminId: string,
  notes?: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('commissions')
      .update({
        status: 'paid',
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        verification_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commissionId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error verifying commission:', error)
    return { success: false, error }
  }
}

/**
 * Reject commission submission (Admin action)
 */
export async function rejectCommission(
  commissionId: string,
  adminId: string,
  notes: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('commissions')
      .update({
        status: 'unpaid',
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        verification_notes: notes,
        bank_transfer_reference: null,
        bank_name: null,
        transfer_date: null,
        payment_proof_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commissionId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error rejecting commission:', error)
    return { success: false, error }
  }
}

/**
 * Update commission status (Admin action)
 * Handles all status transitions: unpaid, for_verification, paid, suspended
 */
export async function updateCommissionStatus(
  commissionId: string,
  newStatus: CommissionStatus,
  adminId: string,
  notes?: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const supabase = createClient()
    
    // First, get the commission to check current status and owner
    const { data: commission, error: fetchError } = await supabase
      .from('commissions')
      .select('status, owner_id')
      .eq('id', commissionId)
      .single()
    
    if (fetchError) throw fetchError
    
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }
    
    // Add verification fields if marking as paid
    if (newStatus === 'paid') {
      updateData.verified_by = adminId
      updateData.verified_at = new Date().toISOString()
      if (notes) {
        updateData.verification_notes = notes
      }
    }
    
    // Add notes for suspended status
    if (newStatus === 'suspended' && notes) {
      updateData.verification_notes = notes
    }
    
    // Clear verification fields if marking as unpaid
    if (newStatus === 'unpaid') {
      updateData.bank_transfer_reference = null
      updateData.bank_name = null
      updateData.transfer_date = null
      updateData.payment_proof_url = null
      if (notes) {
        updateData.verification_notes = notes
      }
    }
    
    // Update commission status
    const { error } = await supabase
      .from('commissions')
      .update(updateData)
      .eq('id', commissionId)
    
    if (error) throw error
    
    // ✅ AUTO-UNSUSPEND: If marking as paid and commission was suspended, unsuspend the owner
    if (newStatus === 'paid' && commission?.status === 'suspended' && commission?.owner_id) {
      const { error: unsuspendError } = await supabase
        .from('users')
        .update({
          is_suspended: false,
          suspension_reason: null,
          suspended_at: null,
          suspended_by: null,
        })
        .eq('id', commission.owner_id)
      
      if (unsuspendError) {
        console.error('Error unsuspending owner:', unsuspendError)
        // Don't fail the whole operation, just log the error
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error updating commission status:', error)
    return { success: false, error }
  }
}

/**
 * Suspend owner account (Admin action)
 */
export async function suspendOwner(
  ownerId: string,
  adminId: string,
  reason: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('users')
      .update({
        is_suspended: true,
        suspension_reason: reason,
        suspended_at: new Date().toISOString(),
        suspended_by: adminId,
      })
      .eq('id', ownerId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error suspending owner:', error)
    return { success: false, error }
  }
}

/**
 * Unsuspend owner account (Admin action)
 */
export async function unsuspendOwner(
  ownerId: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('users')
      .update({
        is_suspended: false,
        suspension_reason: null,
        suspended_at: null,
        suspended_by: null,
      })
      .eq('id', ownerId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error unsuspending owner:', error)
    return { success: false, error }
  }
}

/**
 * Get commission summary with filters
 */
export async function getCommissionSummary(filters?: {
  ownerId?: string
  startDate?: string
  endDate?: string
}): Promise<CommissionSummary> {
  const supabase = createClient()
  
  let query = supabase
    .from('commissions')
    .select('commission_amount, payment_type, status')
  
  if (filters?.ownerId) {
    query = query.eq('owner_id', filters.ownerId)
  }
  
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate)
  }
  
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate)
  }
  
  const { data, error } = await query
  
  if (error || !data) {
    console.error('Error fetching commission summary:', error)
    return {
      total_commission: 0,
      cashless_commission: 0,
      cash_commission: 0,
      unpaid_count: 0,
      for_verification_count: 0,
      paid_count: 0,
      suspended_count: 0,
    }
  }
  
  const summary = data.reduce(
    (acc, commission) => {
      acc.total_commission += commission.commission_amount
      
      if (commission.payment_type === 'cashless') {
        acc.cashless_commission += commission.commission_amount
      } else {
        acc.cash_commission += commission.commission_amount
      }
      
      switch (commission.status) {
        case 'unpaid':
          acc.unpaid_count++
          break
        case 'for_verification':
          acc.for_verification_count++
          break
        case 'paid':
          acc.paid_count++
          break
        case 'suspended':
          acc.suspended_count++
          break
      }
      
      return acc
    },
    {
      total_commission: 0,
      cashless_commission: 0,
      cash_commission: 0,
      unpaid_count: 0,
      for_verification_count: 0,
      paid_count: 0,
      suspended_count: 0,
    } as CommissionSummary
  )
  
  return summary
}

/**
 * Get commission by booking ID
 */
export async function getCommissionByBookingId(bookingId: string): Promise<Commission | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('booking_id', bookingId)
    .single()
  
  if (error) {
    console.error('Error fetching commission by booking:', error)
    return null
  }
  
  return data as Commission
}

/**
 * Get owner-level commission summary
 * Returns aggregated data grouped by owner
 */
export async function getOwnerCommissionsSummary(): Promise<OwnerCommissionSummary[]> {
  const supabase = createClient()
  
  // Get all commissions with owner details
  const { data: commissions, error } = await supabase
    .from('commissions')
    .select(`
      id,
      owner_id,
      commission_amount,
      status,
      created_at,
      owner:users!commissions_owner_id_fkey (
        id,
        full_name,
        email,
        address,
        profile_image_url,
        is_suspended,
        suspension_reason
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error || !commissions) {
    console.error('Error fetching owner commissions:', error)
    return []
  }
  
  // Group and aggregate by owner
  const ownerMap = new Map<string, OwnerCommissionSummary>()
  
  commissions.forEach((commission: any) => {
    const ownerId = commission.owner_id
    const ownerData = commission.owner
    
    if (!ownerMap.has(ownerId)) {
      ownerMap.set(ownerId, {
        owner_id: ownerId,
        owner_name: ownerData?.full_name || 'Unknown',
        owner_email: ownerData?.email || '',
        owner_location: ownerData?.address || null,
        owner_profile_image: ownerData?.profile_image_url || null,
        is_suspended: ownerData?.is_suspended || false,
        suspension_reason: ownerData?.suspension_reason || null,
        total_commission: 0,
        paid_commission: 0,
        unpaid_commission: 0,
        transaction_count: 0,
        has_unpaid: false,
        latest_transaction_date: commission.created_at,
      })
    }
    
    const summary = ownerMap.get(ownerId)!
    summary.transaction_count++
    
    // Only count unpaid commissions (not paid)
    if (commission.status !== 'paid') {
      summary.total_commission += commission.commission_amount
      summary.unpaid_commission += commission.commission_amount
      summary.has_unpaid = true
    } else {
      summary.paid_commission += commission.commission_amount
    }
    
    // Update latest transaction date
    if (new Date(commission.created_at) > new Date(summary.latest_transaction_date)) {
      summary.latest_transaction_date = commission.created_at
    }
  })
  
  // Sort by unpaid status first, then by total commission amount
  return Array.from(ownerMap.values())
    .sort((a, b) => {
      // Unpaid owners first
      if (a.has_unpaid && !b.has_unpaid) return -1
      if (!a.has_unpaid && b.has_unpaid) return 1
      // Then by total commission (highest first)
      return b.total_commission - a.total_commission
    })
}

/**
 * Get detailed transactions for a specific owner with filters
 */
export async function getOwnerCommissionDetails(
  ownerId: string,
  filters?: {
    period?: 'daily' | 'monthly' | 'yearly'
    startDate?: string
    endDate?: string
  }
): Promise<{ commissions: Commission[]; summary: CommissionSummary }> {
  const supabase = createClient()
  
  let query = supabase
    .from('commissions')
    .select(`
      *,
      booking:bookings (
        id,
        start_date,
        end_date,
        total_price,
        vehicle:vehicles (make, model, plate_number)
      ),
      owner:users!commissions_owner_id_fkey (
        id,
        full_name,
        email,
        address,
        profile_image_url
      )
    `)
    .eq('owner_id', ownerId)
  
  // Apply date filters based on period
  if (filters?.startDate && filters?.endDate) {
    query = query
      .gte('created_at', filters.startDate)
      .lte('created_at', filters.endDate)
  }
  
  query = query.order('created_at', { ascending: false })
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching owner commission details:', error)
    return { commissions: [], summary: {
      total_commission: 0,
      cashless_commission: 0,
      cash_commission: 0,
      unpaid_count: 0,
      for_verification_count: 0,
      paid_count: 0,
      suspended_count: 0,
    }}
  }
  
  const commissions = (data || []) as Commission[]
  
  // Calculate summary from the filtered commissions
  const summary = commissions.reduce(
    (acc, commission) => {
      // Only count unpaid commissions in total
      if (commission.status !== 'paid') {
        acc.total_commission += commission.commission_amount
      }
      
      if (commission.payment_type === 'cashless') {
        acc.cashless_commission += commission.commission_amount
      } else {
        acc.cash_commission += commission.commission_amount
      }
      
      switch (commission.status) {
        case 'unpaid':
          acc.unpaid_count++
          break
        case 'for_verification':
          acc.for_verification_count++
          break
        case 'paid':
          acc.paid_count++
          break
        case 'suspended':
          acc.suspended_count++
          break
      }
      
      return acc
    },
    {
      total_commission: 0,
      cashless_commission: 0,
      cash_commission: 0,
      unpaid_count: 0,
      for_verification_count: 0,
      paid_count: 0,
      suspended_count: 0,
    } as CommissionSummary
  )
  
  return { commissions, summary }
}
