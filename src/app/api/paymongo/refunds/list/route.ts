import { NextResponse } from 'next/server'

import { errorResponse } from '@/lib/paymongo/errors'
import { listRefunds } from '@/lib/paymongo/service'
import { listRefundsSchema } from '@/lib/paymongo/schemas'
import { requireUser } from '../../_utils'

export async function GET(request: Request) {
  try {
    await requireUser()
    const url = new URL(request.url)
    const query = listRefundsSchema.parse(Object.fromEntries(url.searchParams.entries()))
    const refunds = await listRefunds(query)
    return NextResponse.json({ data: refunds })
  } catch (error) {
    return errorResponse(error, 'Failed to list refunds')
  }
}
