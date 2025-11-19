import { NextRequest, NextResponse } from 'next/server';

import { fetchLatestPositions } from '@/lib/sinotrack/client';

// Test credentials for the /sinotrack-test page
const { 
  SINOTRACK_SERVER,
  SINOTRACK_TEST_ACCOUNT, 
  SINOTRACK_TEST_PASSWORD, 
  SINOTRACK_TEST_DEVICE_ID 
} = process.env;

const assertEnv = () => {
  if (!SINOTRACK_SERVER || !SINOTRACK_TEST_ACCOUNT || !SINOTRACK_TEST_PASSWORD) {
    throw new Error('SinoTrack test environment variables are not fully configured');
  }
};

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    assertEnv();
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId') ?? SINOTRACK_TEST_DEVICE_ID ?? undefined;
    const devices = await fetchLatestPositions({
      server: SINOTRACK_SERVER!,
      account: SINOTRACK_TEST_ACCOUNT!,
      password: SINOTRACK_TEST_PASSWORD!,
      deviceId,
    });

    return NextResponse.json({
      requestedDeviceId: deviceId ?? null,
      fetchedAt: new Date().toISOString(),
      count: devices.length,
      devices,
    });
  } catch (error) {
    console.error('[sinotrack] get-coordinates', error);
    return NextResponse.json(
      {
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
