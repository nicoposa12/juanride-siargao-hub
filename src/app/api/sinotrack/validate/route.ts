import { NextRequest, NextResponse } from 'next/server';

import { fetchLatestPositions } from '@/lib/sinotrack/client';

export const dynamic = 'force-dynamic';

interface ValidateRequest {
  server?: string;
  account: string;
  password: string;
  deviceId?: string;
}

/**
 * POST /api/sinotrack/validate
 * 
 * Validates SinoTrack credentials by attempting to authenticate and fetch position data.
 * This endpoint is used when vehicle owners enter their SinoTrack credentials.
 * 
 * Request body:
 * - server (optional): SinoTrack server URL (defaults to env SINOTRACK_SERVER)
 * - account (required): SinoTrack account username
 * - password (required): SinoTrack account password
 * - deviceId (optional): Device ID to test with
 * 
 * Response:
 * - valid: boolean indicating if credentials are valid
 * - message: success or error message
 * - deviceCount: number of devices found (if valid)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ValidateRequest;

    // Validate required fields
    if (!body.account || !body.password) {
      return NextResponse.json(
        {
          valid: false,
          message: 'Account and password are required',
        },
        { status: 400 },
      );
    }

    // Use provided server or default from environment
    const server = body.server || process.env.SINOTRACK_SERVER;
    if (!server) {
      return NextResponse.json(
        {
          valid: false,
          message: 'SinoTrack server URL is not configured',
        },
        { status: 500 },
      );
    }

    // Attempt to authenticate and fetch positions
    const devices = await fetchLatestPositions({
      server,
      account: body.account,
      password: body.password,
      deviceId: body.deviceId,
    });

    return NextResponse.json({
      valid: true,
      message: 'Credentials are valid',
      deviceCount: devices.length,
      devices: devices.map((d) => ({
        deviceId: d.deviceId,
        lastSeen: d.recordedAt,
      })),
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error('[sinotrack] validate credentials error:', errorMessage);

    // Check if it's an authentication error
    const isAuthError =
      errorMessage.includes('login failed') ||
      errorMessage.includes('double-check the ID/password') ||
      errorMessage.includes('authentication');

    return NextResponse.json(
      {
        valid: false,
        message: isAuthError
          ? 'Invalid credentials. Please check your account and password.'
          : `Validation failed: ${errorMessage}`,
      },
      { status: isAuthError ? 401 : 500 },
    );
  }
}

