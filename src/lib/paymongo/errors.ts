import { NextResponse } from 'next/server'

export type PaymongoErrorDetail = {
  code?: string
  detail?: string
  source?: { pointer?: string }
  attribute?: string
  message?: string
  meta?: Record<string, unknown>
}

export class PaymongoApiError extends Error {
  public status: number
  public payload?: { errors?: PaymongoErrorDetail[] }

  constructor(status: number, payload?: { errors?: PaymongoErrorDetail[] }, message?: string) {
    super(message ?? payload?.errors?.[0]?.detail ?? 'PayMongo request failed')
    this.name = 'PaymongoApiError'
    this.status = status
    this.payload = payload
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

interface ErrorResult {
  status: number
  body: {
    error: {
      type: string
      message: string
      details?: PaymongoErrorDetail | null
    }
  }
}

function extractDetail(payload?: { errors?: PaymongoErrorDetail[] }) {
  if (!payload?.errors?.length) return null
  return payload.errors[0]
}

export function normalizeError(error: unknown, fallbackMessage = 'Something went wrong'): ErrorResult {
  if (error instanceof PaymongoApiError) {
    return {
      status: error.status,
      body: {
        error: {
          type: 'paymongo_api_error',
          message: error.message,
          details: extractDetail(error.payload),
        },
      },
    }
  }

  if (error instanceof UnauthorizedError) {
    return {
      status: 401,
      body: {
        error: {
          type: 'unauthorized',
          message: error.message,
        },
      },
    }
  }

  if (error instanceof Error) {
    return {
      status: 500,
      body: {
        error: {
          type: error.name || 'error',
          message: error.message || fallbackMessage,
        },
      },
    }
  }

  return {
    status: 500,
    body: {
      error: {
        type: 'unknown_error',
        message: fallbackMessage,
      },
    },
  }
}

export function errorResponse(error: unknown, fallbackMessage?: string) {
  const normalized = normalizeError(error, fallbackMessage)
  return NextResponse.json(normalized.body, { status: normalized.status })
}
