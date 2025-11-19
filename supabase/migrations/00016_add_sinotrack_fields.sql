-- ============================================================================
-- ADD SINOTRACK GPS TRACKING FIELDS TO VEHICLES TABLE
-- ============================================================================
-- Migration: 00016_add_sinotrack_fields
-- Description: Adds optional SinoTrack GPS tracking credentials to vehicles table
-- Date: 2024-11-19
-- ============================================================================

-- Add SinoTrack fields to vehicles table
-- These fields are optional and only used for vehicles with GPS tracking
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS sinotrack_device_id TEXT,
ADD COLUMN IF NOT EXISTS sinotrack_account TEXT,
ADD COLUMN IF NOT EXISTS sinotrack_password TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.vehicles.sinotrack_device_id IS 'SinoTrack GPS device identifier (TEID/IMEI) - optional';
COMMENT ON COLUMN public.vehicles.sinotrack_account IS 'SinoTrack account username for GPS tracking - optional';
COMMENT ON COLUMN public.vehicles.sinotrack_password IS 'SinoTrack account password for GPS tracking - optional';

-- Create index for faster lookups of vehicles with tracking enabled
CREATE INDEX IF NOT EXISTS idx_vehicles_sinotrack_enabled 
ON public.vehicles(id) 
WHERE sinotrack_device_id IS NOT NULL 
  AND sinotrack_account IS NOT NULL 
  AND sinotrack_password IS NOT NULL;

-- Add check constraint to ensure all three fields are either all filled or all empty
-- This ensures data consistency for GPS tracking
ALTER TABLE public.vehicles
ADD CONSTRAINT check_sinotrack_fields_consistency 
CHECK (
  (sinotrack_device_id IS NULL AND sinotrack_account IS NULL AND sinotrack_password IS NULL) OR
  (sinotrack_device_id IS NOT NULL AND sinotrack_account IS NOT NULL AND sinotrack_password IS NOT NULL)
);

COMMENT ON CONSTRAINT check_sinotrack_fields_consistency ON public.vehicles IS 
'Ensures SinoTrack credentials are either all provided or all empty for data consistency';

