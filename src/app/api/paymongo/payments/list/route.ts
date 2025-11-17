import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/paymongo/errors'
import { listPayments } from '@/lib/paymongo/service'
import { retrievePaymentListSchema } from '@/lib/paymongo/schemas'
import { requireUser } from '../../_utils'

export async function GET(request: Request) {
  try {
    await requireUser()
    const url = new URL(request.url)
    const query = retrievePaymentListSchema.parse(Object.fromEntries(url.searchParams.entries()))
    const payments = await listPayments(query)
    return NextResponse.json({ data: payments })
  } catch (error) {
    return errorResponse(error, 'Failed to list payments')
  }
}
