'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, Navigation, RefreshCw, Satellite, Signal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VehicleTrackerProps {
  vehicleId: string;
  vehicleName?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface TrackingData {
  position: {
    latitude: number;
    longitude: number;
    recordedAt: string;
    speedKph: number;
    gsmSignal: number;
    gpsSignal: number;
  };
  vehicle: {
    id: string;
    make: string | null;
    model: string | null;
    plateNumber: string;
  };
  booking: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
  };
}

export function VehicleTracker({
  vehicleId,
  vehicleName,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds default
}: VehicleTrackerProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTrackingData = useCallback(
    async (showLoadingState = true) => {
      if (showLoadingState) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const response = await fetch(`/api/sinotrack/track/${vehicleId}`, {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch tracking data');
        }

        const data = await response.json();
        setTrackingData(data);
        setLastUpdated(new Date());
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(errorMessage);
        console.error('Error fetching tracking data:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [vehicleId],
  );

  // Initial fetch
  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !trackingData) return;

    const interval = setInterval(() => {
      fetchTrackingData(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, trackingData, fetchTrackingData]);

  const handleManualRefresh = () => {
    fetchTrackingData(false);
    toast({
      title: 'Refreshing location',
      description: 'Fetching latest GPS data...',
    });
  };

  const handleOpenInMaps = () => {
    if (!trackingData) return;

    const { latitude, longitude } = trackingData.position;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading GPS tracking data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5" />
            Vehicle Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!trackingData) {
    return null;
  }

  const { position, vehicle } = trackingData;
  const recordedAt = new Date(position.recordedAt);
  const timeSinceUpdate = lastUpdated
    ? Math.floor((lastUpdated.getTime() - recordedAt.getTime()) / 1000)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary" />
            <CardTitle>Live GPS Tracking</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          {vehicleName || `${vehicle.make} ${vehicle.model}`} • {vehicle.plateNumber}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map placeholder - you can integrate Google Maps, Mapbox, or Leaflet here */}
        <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MapPin className="h-12 w-12 text-primary mx-auto" />
              <p className="text-sm font-medium">
                {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
              </p>
              <Button variant="default" size="sm" onClick={handleOpenInMaps}>
                <Navigation className="mr-2 h-4 w-4" />
                Open in Google Maps
              </Button>
            </div>
          </div>
        </div>

        {/* GPS Data */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Speed</p>
            <p className="text-lg font-semibold">{position.speedKph.toFixed(1)} km/h</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Last Updated</p>
            <p className="text-sm font-medium">{recordedAt.toLocaleTimeString()}</p>
            {timeSinceUpdate > 300 && (
              <p className="text-xs text-amber-600">
                Data is {Math.floor(timeSinceUpdate / 60)} min old
              </p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Signal className="h-3 w-3" />
              GSM Signal
            </p>
            <p className="text-sm font-medium">{position.gsmSignal}/31</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Satellite className="h-3 w-3" />
              GPS Signal
            </p>
            <p className="text-sm font-medium">{position.gpsSignal}/31</p>
          </div>
        </div>

        {autoRefresh && (
          <Alert>
            <AlertDescription className="text-xs">
              Location updates automatically every {refreshInterval / 1000} seconds
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

