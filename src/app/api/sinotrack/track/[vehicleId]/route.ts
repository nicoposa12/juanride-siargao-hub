import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';
import { fetchLatestPositions } from '@/lib/sinotrack/client';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    vehicleId: string;
  };
}

/**
 * GET /api/sinotrack/track/[vehicleId]
 * 
 * Fetches real-time GPS tracking data for a specific vehicle.
 * 
 * Authorization:
 * - User must be authenticated
 * - User must be the current renter of the vehicle (active booking)
 * - Vehicle must have SinoTrack credentials configured
 * 
 * Response:
 * - position: Current GPS position data
 * - vehicle: Basic vehicle information
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createServerClient();
    const { vehicleId } = params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Unauthorized. Please log in.',
        },
        { status: 401 },
      );
    }

    // Fetch vehicle with SinoTrack credentials
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, make, model, plate_number, sinotrack_device_id, sinotrack_account, sinotrack_password')
      .eq('id', vehicleId)
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        {
          error: 'Vehicle not found',
        },
        { status: 404 },
      );
    }

    // Check if vehicle has SinoTrack configured
    if (!vehicle.sinotrack_device_id || !vehicle.sinotrack_account || !vehicle.sinotrack_password) {
      return NextResponse.json(
        {
          error: 'GPS tracking is not available for this vehicle',
        },
        { status: 404 },
      );
    }

    // Check if user has an active booking for this vehicle
    const { data: activeBooking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, start_date, end_date')
      .eq('vehicle_id', vehicleId)
      .eq('renter_id', user.id)
      .in('status', ['confirmed', 'active'])
      .gte('end_date', new Date().toISOString().split('T')[0])
      .lte('start_date', new Date().toISOString().split('T')[0])
      .single();

    if (bookingError || !activeBooking) {
      return NextResponse.json(
        {
          error: 'You do not have an active rental for this vehicle',
        },
        { status: 403 },
      );
    }

    // Get SinoTrack server URL from environment
    const server = process.env.SINOTRACK_SERVER;
    if (!server) {
      return NextResponse.json(
        {
          error: 'SinoTrack server is not configured',
        },
        { status: 500 },
      );
    }

    // Fetch position data from SinoTrack
    const positions = await fetchLatestPositions({
      server,
      account: vehicle.sinotrack_account,
      password: vehicle.sinotrack_password,
      deviceId: vehicle.sinotrack_device_id,
    });

    if (positions.length === 0) {
      return NextResponse.json(
        {
          error: 'No GPS data available for this vehicle',
        },
        { status: 404 },
      );
    }

    const position = positions[0];

    return NextResponse.json({
      position: {
        latitude: position.latitude,
        longitude: position.longitude,
        recordedAt: position.recordedAt,
        speedKph: position.speedKph,
        gsmSignal: position.gsmSignal,
        gpsSignal: position.gpsSignal,
      },
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        plateNumber: vehicle.plate_number,
      },
      booking: {
        id: activeBooking.id,
        status: activeBooking.status,
        startDate: activeBooking.start_date,
        endDate: activeBooking.end_date,
      },
    });
  } catch (error) {
    console.error('[sinotrack] track vehicle error:', error);
    return NextResponse.json(
      {
        error: (error as Error).message || 'Failed to fetch tracking data',
      },
      { status: 500 },
    );
  }
}

