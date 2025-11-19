'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin, Navigation, RefreshCw, Satellite, Signal, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VehicleTrackingDialogProps {
  vehicleId: string;
  vehicleName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

export function VehicleTrackingDialog({
  vehicleId,
  vehicleName,
  open,
  onOpenChange,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds default
}: VehicleTrackingDialogProps) {
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
        const response = await fetch(`/api/sinotrack/track-owner/${vehicleId}`, {
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

  // Initial fetch when dialog opens
  useEffect(() => {
    if (open && vehicleId) {
      fetchTrackingData();
    }
  }, [open, vehicleId, fetchTrackingData]);

  // Auto-refresh when dialog is open
  useEffect(() => {
    if (!open || !autoRefresh || !trackingData) return;

    const interval = setInterval(() => {
      fetchTrackingData(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [open, autoRefresh, refreshInterval, trackingData, fetchTrackingData]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary" />
            Live GPS Tracking
          </DialogTitle>
          <DialogDescription>
            {vehicleName || 'Real-time vehicle location'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading GPS tracking data...</p>
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : trackingData ? (
          <div className="space-y-4">
            {/* Map placeholder - you can integrate Google Maps, Mapbox, or Leaflet here */}
            <div className="relative w-full h-96 bg-muted rounded-lg overflow-hidden border">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4 z-10">
                  <MapPin className="h-16 w-16 text-primary mx-auto animate-pulse" />
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">
                      {trackingData.position.latitude.toFixed(6)}, {trackingData.position.longitude.toFixed(6)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {trackingData.vehicle.plateNumber}
                    </p>
                    <Button variant="default" size="sm" onClick={handleOpenInMaps}>
                      <Navigation className="mr-2 h-4 w-4" />
                      Open in Google Maps
                    </Button>
                  </div>
                </div>
                {/* Grid overlay for map-like appearance */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `
                      linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                  }} />
                </div>
              </div>
            </div>

            {/* GPS Data */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Speed</p>
                <p className="text-xl font-semibold">{trackingData.position.speedKph.toFixed(1)} km/h</p>
              </div>
              <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">
                  {new Date(trackingData.position.recordedAt).toLocaleTimeString()}
                </p>
                {lastUpdated && (() => {
                  const timeSinceUpdate = Math.floor(
                    (lastUpdated.getTime() - new Date(trackingData.position.recordedAt).getTime()) / 1000
                  );
                  return timeSinceUpdate > 300 ? (
                    <p className="text-xs text-amber-600">
                      Data is {Math.floor(timeSinceUpdate / 60)} min old
                    </p>
                  ) : null;
                })()}
              </div>
              <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Signal className="h-3 w-3" />
                  GSM Signal
                </p>
                <p className="text-sm font-medium">{trackingData.position.gsmSignal}/31</p>
              </div>
              <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Satellite className="h-3 w-3" />
                  GPS Signal
                </p>
                <p className="text-sm font-medium">{trackingData.position.gpsSignal}/31</p>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-semibold">
                    {trackingData.vehicle.make} {trackingData.vehicle.model}
                  </p>
                  <p className="text-sm text-muted-foreground">Plate: {trackingData.vehicle.plateNumber}</p>
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
            </div>

            {autoRefresh && (
              <Alert>
                <AlertDescription className="text-xs">
                  Location updates automatically every {refreshInterval / 1000} seconds
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

