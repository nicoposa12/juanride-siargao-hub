import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/paymongo/errors'
import { listPaymentIntents } from '@/lib/paymongo/service'
import { listPaymentIntentsSchema } from '@/lib/paymongo/schemas'
import { requireUser } from '../../_utils'

export async function GET(request: Request) {
  try {
    await requireUser()
    const url = new URL(request.url)
    const query = listPaymentIntentsSchema.parse(Object.fromEntries(url.searchParams.entries()))
    const intents = await listPaymentIntents(query)
    return NextResponse.json({ data: intents })
  } catch (error) {
    return errorResponse(error, 'Failed to list payment intents')
  }
}
