/**
 * PayMongo Payment Integration
 * Handles GCash, Maya (PayMaya), and Credit/Debit Card payments
 * Documentation: https://developers.paymongo.com/docs
 */

import { createClient } from '@/lib/supabase/client'

const PAYMONGO_SECRET_KEY = process.env.NEXT_PUBLIC_PAYMONGO_SECRET_KEY || ''
const PAYMONGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY || ''

// PayMongo API base URL
const API_BASE_URL = 'https://api.paymongo.com/v1'

// Encode the secret key for authorization
const getAuthHeader = () => {
  // Use btoa for browser-compatible base64 encoding
  const encodedKey = btoa(PAYMONGO_SECRET_KEY)
  return `Basic ${encodedKey}`
}

// Payment methods that use Sources API
export type SourcePaymentMethod = 'gcash' | 'grab_pay'

// Payment methods that use Payment Methods API  
export type PaymentMethodType = 'paymaya' | 'billease' | 'card' | 'qrph'

export type PaymentMethod = SourcePaymentMethod | PaymentMethodType

export interface PaymentIntentData {
  amount: number // in centavos (₱100.00 = 10000)
  description: string
  paymentMethod: PaymentMethod
  metadata?: {
    bookingId: string
    userId: string
    vehicleId: string
    [key: string]: string
  }
}

export interface PaymentSourceData {
  type: SourcePaymentMethod
  amount: number
  redirect: {
    success: string
    failed: string
  }
  billing?: {
    name: string
    email: string
    phone: string
  }
}

export interface PaymentMethodData {
  type: PaymentMethodType
  amount: number
  description: string
  billing: {
    name: string
    email: string
    phone?: string
  }
  redirect: {
    success: string
    failed: string
  }
}

/**
 * Create a Payment Intent (for card payments)
 * Payment Intents are used for direct card payments
 */
export async function createPaymentIntent(data: PaymentIntentData) {
  try {
    const response = await fetch(`${API_BASE_URL}/payment_intents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: data.amount,
            payment_method_allowed: [data.paymentMethod],
            currency: 'PHP',
            description: data.description,
            statement_descriptor: 'JuanRide Rental',
            metadata: data.metadata,
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.errors?.[0]?.detail || 'Failed to create payment intent')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

/**
 * Create a Payment Method (for card tokenization)
 * This is used to securely store card details
 */
export async function createPaymentMethod(cardDetails: {
  cardNumber: string
  expMonth: number
  expYear: number
  cvc: string
  billingDetails: {
    name: string
    email: string
    phone?: string
  }
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/payment_methods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: 'card',
            details: {
              card_number: cardDetails.cardNumber,
              exp_month: cardDetails.expMonth,
              exp_year: cardDetails.expYear,
              cvc: cardDetails.cvc,
            },
            billing: {
              name: cardDetails.billingDetails.name,
              email: cardDetails.billingDetails.email,
              phone: cardDetails.billingDetails.phone,
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.errors?.[0]?.detail || 'Failed to create payment method')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error creating payment method:', error)
    throw error
  }
}

/**
 * Attach Payment Method to Payment Intent
 * Links the payment method to the intent for processing
 */
export async function attachPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/payment_intents/${paymentIntentId}/attach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: paymentMethodId,
            return_url: `${window.location.origin}/payment/callback`,
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.errors?.[0]?.detail || 'Failed to attach payment method')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error attaching payment intent:', error)
    throw error
  }
}

/**
 * Create a Payment Method (for PayMaya, BillEase, etc.)
 * These use the /payment_methods endpoint instead of /sources
 */
export async function createPaymentMethodSource(data: PaymentMethodData) {
  try {
    const response = await fetch(`${API_BASE_URL}/payment_methods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: data.type,
            billing: data.billing,
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.errors?.[0]?.detail || 'Failed to create payment method')
    }

    const result = await response.json()
    
    // Create payment intent for this payment method
    const intentResponse = await fetch(`${API_BASE_URL}/payment_intents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: data.amount,
            payment_method_allowed: [data.type],
            payment_method_options: {
              [data.type]: {
                redirect: data.redirect,
              },
            },
            currency: 'PHP',
            description: data.description,
          },
        },
      }),
    })

    if (!intentResponse.ok) {
      const error = await intentResponse.json()
      throw new Error(error.errors?.[0]?.detail || 'Failed to create payment intent')
    }

    const intentResult = await intentResponse.json()
    
    // Attach payment method to intent
    const attachResponse = await fetch(`${API_BASE_URL}/payment_intents/${intentResult.data.id}/attach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: result.data.id,
            return_url: data.redirect.success,
          },
        },
      }),
    })

    if (!attachResponse.ok) {
      const error = await attachResponse.json()
      throw new Error(error.errors?.[0]?.detail || 'Failed to attach payment method')
    }

    const attachResult = await attachResponse.json()
    return attachResult.data
  } catch (error) {
    console.error('Error creating payment method:', error)
    throw error
  }
}

/**
 * Create a Payment Source (for e-wallet payments like GCash, GrabPay)
 * Sources are used for redirect-based payment methods
 * NOTE: Only gcash and grab_pay are supported via /sources endpoint
 */
export async function createPaymentSource(data: PaymentSourceData) {
  try {
    const response = await fetch(`${API_BASE_URL}/sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: data.type,
            amount: data.amount,
            currency: 'PHP',
            redirect: data.redirect,
            billing: data.billing,
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.errors?.[0]?.detail || 'Failed to create payment source')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error creating payment source:', error)
    throw error
  }
}

/**
 * Create a Payment (confirms the payment with a source)
 * This finalizes the payment process
 * NOTE: Only use this for SOURCE-based payments (gcash, grab_pay)
 * Payment Intent-based methods (paymaya, billease, card) don't need this step
 */
export async function createPayment(
  sourceId: string, 
  amount: number, 
  description: string, 
  metadata?: Record<string, string>
) {
  try {
    // Validate that this is a source ID, not a payment intent ID
    if (sourceId.startsWith('pi_')) {
      const error = new Error(
        `Invalid ID type: Expected source ID (src_*), but received payment intent ID (pi_*). ` +
        `Payment Intents don't use the /payments endpoint. This likely means the wrong payment method flow is being used.`
      )
      console.error('[PayMongo createPayment] ID Type Mismatch:', {
        receivedId: sourceId,
        expectedFormat: 'src_*',
        actualFormat: 'pi_*',
        endpoint: '/v1/payments',
        note: 'Payment Intent-based methods (paymaya, billease, card) are self-contained and do not require calling /payments'
      })
      throw error
    }

    const requestBody = {
      data: {
        attributes: {
          amount,
          currency: 'PHP',
          source: {
            id: sourceId,
            type: 'source',
          },
          description,
          statement_descriptor: 'JuanRide',
          metadata,
        },
      },
    }

    console.log('[PayMongo createPayment] Request:', {
      endpoint: `${API_BASE_URL}/payments`,
      sourceId: sourceId,
      sourceType: 'source',
      amount: amount,
      description: description,
    })

    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json()
      const errorDetail = error.errors?.[0]?.detail || 'Failed to create payment'
      const errorCode = error.errors?.[0]?.code || 'unknown'
      
      console.error('[PayMongo createPayment] Error Response:', {
        status: response.status,
        code: errorCode,
        detail: errorDetail,
        sourceId: sourceId,
        requestedAmount: amount,
        fullError: error,
      })
      
      throw new Error(`${errorCode}: ${errorDetail}`)
    }

    const result = await response.json()
    console.log('[PayMongo createPayment] Success:', {
      paymentId: result.data.id,
      status: result.data.attributes.status,
      amount: result.data.attributes.amount,
    })
    
    return result.data
  } catch (error) {
    console.error('[PayMongo createPayment] Exception:', error)
    throw error
  }
}

/**
 * Retrieve Payment Intent status
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/payment_intents/${paymentIntentId}`, {
      headers: {
        'Authorization': getAuthHeader(),
      },
    })

    if (!response.ok) {
      throw new Error('Failed to retrieve payment intent')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error retrieving payment intent:', error)
    throw error
  }
}

/**
 * Retrieve Payment status
 */
export async function getPayment(paymentId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
      headers: {
        'Authorization': getAuthHeader(),
      },
    })

    if (!response.ok) {
      throw new Error('Failed to retrieve payment')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error retrieving payment:', error)
    throw error
  }
}

/**
 * Update payment record in Supabase
 */
export async function updatePaymentRecord(
  bookingId: string,
  status: 'pending' | 'paid' | 'failed' | 'refunded',
  transactionId?: string
) {
  try {
    const supabase = createClient()
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }
    
    if (transactionId) {
      updateData.transaction_id = transactionId
    }
    
    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString()
    }
    
    // Update all payment records for this booking (in case of duplicates)
    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('booking_id', bookingId)
      .select()

    if (error) throw error

    // Return the first record
    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error('Error updating payment record:', error)
    throw error
  }
}

/**
 * Create payment record in Supabase
 * Check if payment already exists for this booking first
 */
export async function createPaymentRecord(
  bookingId: string,
  amount: number,
  paymentMethod: string
) {
  try {
    const supabase = createClient()
    
    console.log('[createPaymentRecord] Checking for existing payment:', {
      bookingId,
      paymentMethod,
      amount
    })
    
    // Check if payment already exists for this booking
    // Use .maybeSingle() instead of .single() to avoid 406 error when no records exist
    const { data: existingPayment, error: fetchError } = await supabase
      .from('payments')
      .select()
      .eq('booking_id', bookingId)
      .maybeSingle()
    
    // Log any fetch errors (but don't throw - just continue to create)
    if (fetchError) {
      console.warn('[createPaymentRecord] Error fetching existing payment:', fetchError)
    }
    
    // If payment exists, return it
    if (existingPayment) {
      console.log('[createPaymentRecord] Payment record already exists:', existingPayment.id)
      return existingPayment
    }
    
    console.log('[createPaymentRecord] Creating new payment record')
    
    // Create new payment record
    const { data, error } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        amount,
        payment_method: paymentMethod,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('[createPaymentRecord] Insert error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        paymentMethod,
      })
      throw error
    }

    console.log('[createPaymentRecord] Payment record created successfully:', data.id)
    return data
  } catch (error) {
    console.error('[createPaymentRecord] Exception:', error)
    throw error
  }
}

/**
 * Helper function to convert amount to centavos
 */
export function toCentavos(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Helper function to convert centavos to pesos
 */
export function toPesos(centavos: number): number {
  return centavos / 100
}

/**
 * Create QR PH Payment Intent
 * QR PH allows customers to pay using any QR-enabled payment app
 * Documentation: https://developers.paymongo.com/docs/qr-ph-api
 */
export async function createQRPHPaymentIntent(data: {
  amount: number // in centavos
  description: string
  metadata?: Record<string, string>
}) {
  try {
    console.log('Creating QR PH Payment Intent with amount:', data.amount)
    
    const response = await fetch(`${API_BASE_URL}/payment_intents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: data.amount,
            payment_method_allowed: ['qrph'],
            payment_method_options: {
              qrph: {
                request_type: 'dynamic', // 'dynamic' creates a QR code, 'static' for permanent QR
              },
            },
            currency: 'PHP',
            description: data.description,
            statement_descriptor: 'JuanRide',
            metadata: data.metadata,
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('QR PH Payment Intent Error:', error)
      throw new Error(error.errors?.[0]?.detail || 'Failed to create QR PH payment intent')
    }

    const result = await response.json()
    console.log('QR PH Payment Intent Created:', result.data.id)
    console.log('Payment Intent attributes:', JSON.stringify(result.data.attributes, null, 2))
    
    return result.data
  } catch (error) {
    console.error('Error creating QR PH payment intent:', error)
    throw error
  }
}

/**
 * Retrieve Payment Intent by QR PH Invoice Number
 * Use this to check payment status after customer scans QR code
 * Documentation: https://developers.paymongo.com/docs/retriving-payment-intent-id-from-qrph-invoice-number
 */
export async function getPaymentIntentByInvoice(invoiceNumber: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/payment_intents?invoice_number=${encodeURIComponent(invoiceNumber)}`,
      {
        headers: {
          'Authorization': getAuthHeader(),
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to retrieve payment intent by invoice number')
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('Error retrieving payment intent by invoice:', error)
    throw error
  }
}

