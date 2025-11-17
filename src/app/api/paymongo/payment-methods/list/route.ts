import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/paymongo/errors'
import { listPaymentMethods } from '@/lib/paymongo/service'
import { listPaymentMethodsSchema } from '@/lib/paymongo/schemas'
import { requireUser } from '../../_utils'

export async function GET(request: Request) {
  try {
    await requireUser()
    const url = new URL(request.url)
    const query = listPaymentMethodsSchema.parse(Object.fromEntries(url.searchParams.entries()))
    const methods = await listPaymentMethods(query)
    return NextResponse.json({ data: methods })
  } catch (error) {
    return errorResponse(error, 'Failed to list payment methods')
  }
}
