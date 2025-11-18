import { NextRequest, NextResponse } from 'next/server';

import { fetchLatestPositions } from '@/lib/sinotrack/client';

const { SINOTRACK_SERVER, SINOTRACK_ACCOUNT, SINOTRACK_PASSWORD, SINOTRACK_DEVICE_ID } = process.env;

const assertEnv = () => {
  if (!SINOTRACK_SERVER || !SINOTRACK_ACCOUNT || !SINOTRACK_PASSWORD) {
    throw new Error('Sinotrack environment variables are not fully configured');
  }
};

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    assertEnv();
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId') ?? SINOTRACK_DEVICE_ID ?? undefined;
    const devices = await fetchLatestPositions({
      server: SINOTRACK_SERVER!,
      account: SINOTRACK_ACCOUNT!,
      password: SINOTRACK_PASSWORD!,
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
