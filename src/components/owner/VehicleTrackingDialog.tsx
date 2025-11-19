'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Navigation, RefreshCw, Satellite, Signal, Fuel, Gauge, Thermometer, Battery, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

// Fix for default marker icon in Next.js - restore standard pin icon
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface VehicleTrackingDialogProps {
  vehicleId: string;
  vehicleName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface RawData {
  strTEID?: string;
  nTime?: string | number;
  dbLon?: string | number;
  dbLat?: string | number;
  nDirection?: string | number;
  nSpeed?: string | number;
  nGSMSignal?: string | number;
  nGPSSignal?: string | number;
  nFuel?: string | number;
  nMileage?: string | number;
  nTemp?: string | number;
  nCarState?: string | number;
  nTEState?: string | number;
  nAlarmState?: string | number;
  strOther?: string;
  nStartTime?: string | number;
  nStartMileage?: string | number;
  nParkTime?: string | number;
  nRunTime?: string | number;
}

interface TrackingData {
  deviceId: string;
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
  raw: RawData;
}

// Component to update map center when position changes
// This must be a child of MapContainer
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (map && center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  return null;
}

export function VehicleTrackingDialog({
  vehicleId,
  vehicleName,
  open,
  onOpenChange,
  autoRefresh = true,
  refreshInterval = 2000, // 2 seconds default
}: VehicleTrackingDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mapReady, setMapReady] = useState(false);

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
      setMapReady(false);
      fetchTrackingData();
      // Small delay to ensure map container is rendered
      setTimeout(() => setMapReady(true), 100);
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

  // Helper function to parse voltage from strOther
  const parseVoltage = (strOther?: string): number | null => {
    if (!strOther) return null;
    const voltageMatch = strOther.match(/Voltages?=([\d.]+)/i);
    return voltageMatch ? parseFloat(voltageMatch[1]) : null;
  };

  // Helper function to format state values
  const formatState = (state: string | number | undefined): string => {
    if (state === undefined || state === null) return 'N/A';
    const num = typeof state === 'string' ? parseInt(state, 10) : state;
    return `0x${num.toString(16).toUpperCase()}`;
  };

  // Helper function to format time
  const formatTime = (timestamp: string | number | undefined): string => {
    if (!timestamp) return 'N/A';
    const num = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    if (num === 0) return 'N/A';
    return new Date(num * 1000).toLocaleString();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Satellite className="h-5 w-5 text-primary" />
                Live GPS Tracking
              </DialogTitle>
              <DialogDescription>
                {vehicleName || 'Real-time vehicle location'}
              </DialogDescription>
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
            {/* Interactive Map */}
            <div className="relative w-full h-96 rounded-lg overflow-hidden border shadow-lg">
              <style dangerouslySetInnerHTML={{__html: `
                /* Google Maps-like muted color scheme */
                .google-maps-style .leaflet-container {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  background-color: #f5f5f5;
                }
                
                /* Mute colors to match Google Maps exactly - reduce saturation significantly */
                .google-maps-style .leaflet-tile-container img {
                  image-rendering: -webkit-optimize-contrast;
                  image-rendering: crisp-edges;
                  filter: contrast(0.9) saturate(0.6) brightness(1.08) hue-rotate(-3deg);
                  opacity: 0.99;
                }
                
                /* Ensure normal blend mode for accurate color rendering */
                .google-maps-style .leaflet-tile-container img {
                  mix-blend-mode: normal;
                }
                
                /* Custom popup styling - Google Maps-like */
                .custom-popup .leaflet-popup-content-wrapper {
                  border-radius: 8px;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                  padding: 0;
                  background: white;
                  border: none;
                }
                
                .custom-popup .leaflet-popup-content {
                  margin: 12px;
                  font-size: 14px;
                  line-height: 1.5;
                  color: #333;
                }
                
                .custom-popup .leaflet-popup-tip {
                  background: white;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                
                /* Standard marker icon styling - subtle shadow */
                .google-maps-style .leaflet-marker-icon {
                  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
                }
                
                /* Google Maps-like controls */
                .google-maps-style .leaflet-control-zoom a {
                  background-color: white;
                  color: #333;
                  border: 1px solid #ccc;
                  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
                  font-size: 18px;
                  font-weight: bold;
                  width: 34px;
                  height: 34px;
                  line-height: 34px;
                }
                
                .google-maps-style .leaflet-control-zoom a:hover {
                  background-color: #f4f4f4;
                  color: #333;
                }
                
                /* Attribution styling - Google Maps-like */
                .google-maps-style .leaflet-control-attribution {
                  background-color: rgba(255, 255, 255, 0.9);
                  color: #666;
                  font-size: 11px;
                  padding: 4px 8px;
                  border-radius: 4px;
                }
                
                .google-maps-style .leaflet-control-attribution a {
                  color: #666;
                }
                
                /* Enhance readability of place names */
                .google-maps-style .leaflet-tile-container {
                  font-weight: 500;
                }
              `}} />
              {mapReady && trackingData.position.latitude && trackingData.position.longitude ? (
                <MapContainer
                  center={[trackingData.position.latitude, trackingData.position.longitude]}
                  zoom={18}
                  minZoom={10}
                  maxZoom={19}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                  className="google-maps-style"
                >
                  {/* Vibrant OpenStreetMap tiles for colorful, Google Maps-like appearance */}
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                    subdomains="abc"
                  />
                  <Marker 
                    position={[trackingData.position.latitude, trackingData.position.longitude]}
                  >
                    <Popup className="custom-popup" maxWidth={220}>
                      <div className="space-y-1.5">
                        <p className="font-semibold text-base text-gray-900">{vehicleName || 'Vehicle'}</p>
                        <p className="text-sm text-gray-600">{trackingData.vehicle.plateNumber}</p>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                          <Gauge className="h-4 w-4 text-gray-700" />
                          <p className="text-sm font-medium text-gray-700">
                            {trackingData.position.speedKph.toFixed(1)} km/h
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                  <MapUpdater center={[trackingData.position.latitude, trackingData.position.longitude]} />
                </MapContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>

            {/* Vehicle Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Device ID</span>
                    <span className="text-sm font-medium">{trackingData.deviceId}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Vehicle</span>
                    <span className="text-sm font-medium">
                      {trackingData.vehicle.make} {trackingData.vehicle.model}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Plate Number</span>
                    <span className="text-sm font-medium">{trackingData.vehicle.plateNumber}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Latitude</span>
                    <span className="text-sm font-mono">{trackingData.position.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Longitude</span>
                    <span className="text-sm font-mono">{trackingData.position.longitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Recorded Time</span>
                    <span className="text-sm font-medium">
                      {new Date(trackingData.position.recordedAt).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Status & Signals */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status & Signals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Gauge className="h-4 w-4" />
                      Speed
                    </span>
                    <Badge variant="outline">{trackingData.position.speedKph.toFixed(1)} km/h</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Signal className="h-4 w-4" />
                      GSM Signal
                    </span>
                    <Badge variant="outline">{trackingData.position.gsmSignal}/31</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Satellite className="h-4 w-4" />
                      GPS Signal
                    </span>
                    <Badge variant="outline">{trackingData.position.gpsSignal}/31</Badge>
                  </div>
                  <Separator />
                  {trackingData.raw.nFuel !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Fuel className="h-4 w-4" />
                        Fuel
                      </span>
                      <span className="text-sm font-medium">{trackingData.raw.nFuel}%</span>
                    </div>
                  )}
                  {trackingData.raw.nMileage !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Gauge className="h-4 w-4" />
                        Mileage
                      </span>
                      <span className="text-sm font-medium">{trackingData.raw.nMileage} km</span>
                    </div>
                  )}
                  {trackingData.raw.nTemp !== undefined && trackingData.raw.nTemp !== 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Thermometer className="h-4 w-4" />
                        Temperature
                      </span>
                      <span className="text-sm font-medium">{trackingData.raw.nTemp}°C</span>
                    </div>
                  )}
                  {parseVoltage(trackingData.raw.strOther) !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Battery className="h-4 w-4" />
                        Voltage
                      </span>
                      <span className="text-sm font-medium">{parseVoltage(trackingData.raw.strOther)}V</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vehicle States */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vehicle States</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trackingData.raw.nCarState !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Car State</span>
                      <Badge variant="secondary">{formatState(trackingData.raw.nCarState)}</Badge>
                    </div>
                  )}
                  {trackingData.raw.nTEState !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">TE State</span>
                      <Badge variant="secondary">{formatState(trackingData.raw.nTEState)}</Badge>
                    </div>
                  )}
                  {trackingData.raw.nAlarmState !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Alarm State
                      </span>
                      <Badge variant={trackingData.raw.nAlarmState === '0' || trackingData.raw.nAlarmState === 0 ? 'default' : 'destructive'}>
                        {formatState(trackingData.raw.nAlarmState)}
                      </Badge>
                    </div>
                  )}
                  {trackingData.raw.nDirection !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Direction</span>
                      <span className="text-sm font-medium">{trackingData.raw.nDirection}°</span>
                    </div>
                  )}
                  {trackingData.raw.nParkTime !== undefined && trackingData.raw.nParkTime !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Park Time</span>
                      <span className="text-sm font-medium">{formatTime(trackingData.raw.nParkTime)}</span>
                    </div>
                  )}
                  {trackingData.raw.nRunTime !== undefined && trackingData.raw.nRunTime !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Run Time</span>
                      <span className="text-sm font-medium">{formatTime(trackingData.raw.nRunTime)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trackingData.raw.strOther && (
                    <div>
                      <span className="text-sm text-muted-foreground">Other Data</span>
                      <p className="text-sm font-mono mt-1 p-2 bg-muted rounded">{trackingData.raw.strOther}</p>
                    </div>
                  )}
                  {lastUpdated && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Last Updated</span>
                        <span className="text-sm font-medium">{lastUpdated.toLocaleTimeString()}</span>
                      </div>
                    </>
                  )}
                  <Separator />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleOpenInMaps}
                  >
                    <Navigation className="mr-2 h-4 w-4" />
                    Open in Google Maps
                  </Button>
                </CardContent>
              </Card>
            </div>

            {autoRefresh && (
              <Alert>
                <AlertDescription className="text-xs">
                  Location updates automatically every {refreshInterval / 1000} second{refreshInterval / 1000 !== 1 ? 's' : ''}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
