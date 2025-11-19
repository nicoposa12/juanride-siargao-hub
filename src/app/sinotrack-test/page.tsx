'use client';

import { useCallback, useEffect, useState } from 'react';

interface SinoTrackDevice {
  deviceId: string;
  recordedAt: string;
  latitude: number;
  longitude: number;
  speedKph: number;
  gsmSignal: number;
  gpsSignal: number;
}

interface CoordinatesResponse {
  requestedDeviceId: string | null;
  fetchedAt: string;
  count: number;
  devices: SinoTrackDevice[];
  error?: string;
}

export default function SinoTrackTestPage() {
  const [deviceId, setDeviceId] = useState('');
  const [data, setData] = useState<CoordinatesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (overrideDeviceId?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        const queryDevice = overrideDeviceId ?? deviceId.trim();
        if (queryDevice) {
          params.set('deviceId', queryDevice);
        }
        const query = params.toString();
        const response = await fetch(`/api/get-coordinates${query ? `?${query}` : ''}`, {
          method: 'GET',
          cache: 'no-store',
        });
        const payload = (await response.json()) as CoordinatesResponse;
        if (!response.ok) {
          throw new Error(payload.error ?? 'Unable to fetch coordinates');
        }
        setData(payload);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [deviceId],
  );

  useEffect(() => {
    fetchData().catch(() => {});
  }, [fetchData]);

  const latestDevice = data?.devices[0];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-semibold">SinoTrack Live Coordinates</h1>
        <p className="text-sm text-muted-foreground">
          Enter a TEID/IMEI to filter a specific tracker or leave it blank to view every device that the
          account can access.
        </p>
      </header>

      <form
        className="flex flex-col gap-3 rounded-md border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          fetchData().catch(() => {});
        }}
      >
        <label className="text-sm font-medium" htmlFor="deviceId">
          Device Identifier
        </label>
        <input
          id="deviceId"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={deviceId}
          onChange={(event) => setDeviceId(event.target.value)}
          placeholder="91710658988"
          autoComplete="off"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Loading…' : 'Refresh'}
        </button>
      </form>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {latestDevice && (
        <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Most Recent Fix</h2>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Device</dt>
              <dd className="font-medium">{latestDevice.deviceId || 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Recorded At</dt>
              <dd className="font-medium">{new Date(latestDevice.recordedAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Latitude</dt>
              <dd className="font-mono">{latestDevice.latitude.toFixed(6)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Longitude</dt>
              <dd className="font-mono">{latestDevice.longitude.toFixed(6)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Speed</dt>
              <dd className="font-medium">{latestDevice.speedKph.toFixed(1)} km/h</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Signal (GSM / GPS)</dt>
              <dd className="font-medium">
                {latestDevice.gsmSignal}/{latestDevice.gpsSignal}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {data && (
        <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">API Payload</h2>
              <p className="text-xs text-muted-foreground">
                Last updated {new Date(data.fetchedAt).toLocaleTimeString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchData().catch(() => {})}
              className="rounded-md border border-border px-3 py-1 text-xs font-medium"
              disabled={isLoading}
            >
              Re-run Request
            </button>
          </header>
          <pre className="mt-3 max-h-80 overflow-auto rounded-md bg-muted/60 p-3 text-xs">
            {JSON.stringify(data, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}
