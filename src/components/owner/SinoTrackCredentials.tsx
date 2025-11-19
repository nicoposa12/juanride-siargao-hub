'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Satellite } from 'lucide-react';

interface SinoTrackCredentialsProps {
  deviceId: string;
  account: string;
  password: string;
  onDeviceIdChange: (value: string) => void;
  onAccountChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}

interface ValidationResult {
  valid: boolean;
  message: string;
  deviceCount?: number;
}

export function SinoTrackCredentials({
  deviceId,
  account,
  password,
  onDeviceIdChange,
  onAccountChange,
  onPasswordChange,
}: SinoTrackCredentialsProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const handleValidate = async () => {
    if (!account || !password) {
      setValidationResult({
        valid: false,
        message: 'Please enter both account and password to validate',
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch('/api/sinotrack/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account,
          password,
          deviceId: deviceId || undefined,
        }),
      });

      const data = await response.json();

      setValidationResult({
        valid: data.valid,
        message: data.message,
        deviceCount: data.deviceCount,
      });
    } catch (error) {
      setValidationResult({
        valid: false,
        message: 'Failed to validate credentials. Please try again.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    onDeviceIdChange('');
    onAccountChange('');
    onPasswordChange('');
    setValidationResult(null);
  };

  const hasCredentials = account || password || deviceId;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Satellite className="h-5 w-5 text-primary" />
          <CardTitle>GPS Tracking (Optional)</CardTitle>
        </div>
        <CardDescription>
          Enable real-time GPS tracking for your vehicle using SinoTrack. Renters will be able to view the
          vehicle location during their rental period.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sinotrack_device_id">Device ID (TEID/IMEI)</Label>
          <Input
            id="sinotrack_device_id"
            value={deviceId}
            onChange={(e) => onDeviceIdChange(e.target.value)}
            placeholder="e.g., 9171065898"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            The unique identifier for your GPS tracking device
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sinotrack_account">SinoTrack Account</Label>
          <Input
            id="sinotrack_account"
            value={account}
            onChange={(e) => onAccountChange(e.target.value)}
            placeholder="Your SinoTrack username"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sinotrack_password">SinoTrack Password</Label>
          <Input
            id="sinotrack_password"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Your SinoTrack password"
            autoComplete="off"
          />
        </div>

        {validationResult && (
          <Alert variant={validationResult.valid ? 'default' : 'destructive'}>
            <div className="flex items-start gap-2">
              {validationResult.valid ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 mt-0.5" />
              )}
              <AlertDescription>
                {validationResult.message}
                {validationResult.valid && validationResult.deviceCount !== undefined && (
                  <span className="block mt-1 text-sm">
                    Found {validationResult.deviceCount} device{validationResult.deviceCount !== 1 ? 's' : ''}{' '}
                    on this account.
                  </span>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleValidate}
            disabled={isValidating || !account || !password}
            className="flex-1"
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>

          {hasCredentials && (
            <Button type="button" variant="ghost" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            <strong>Note:</strong> All three fields must be filled or all left empty. GPS tracking credentials
            are encrypted and stored securely. Only active renters can view the vehicle location.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

