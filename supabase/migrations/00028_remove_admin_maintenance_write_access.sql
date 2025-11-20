-- ============================================================================
-- MIGRATION: Remove Admin Write Access to Maintenance Logs
-- ============================================================================
-- Description: Remove admin ability to modify maintenance records.
--              Admins can only VIEW maintenance logs for monitoring purposes.
--              Only vehicle owners can CREATE, UPDATE, DELETE maintenance logs.
-- Date: 2024-11-20
-- Related: MAINTENANCE_FLOW_ANALYSIS.md
-- ============================================================================

-- Drop existing admin policies that allow write access
DROP POLICY IF EXISTS "Admins can manage maintenance" ON public.maintenance_logs;

-- Create new read-only policy for admins
-- Admins can view ALL maintenance logs for monitoring and analytics
CREATE POLICY "Admins can view all maintenance (read-only)"
    ON public.maintenance_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Verify existing owner policies remain intact
-- (These policies were created in 00002_rls_policies.sql)

-- Policy 1: "Owners can view own vehicle maintenance"
-- Allows owners to SELECT maintenance logs for their vehicles
-- Status: ✓ Remains unchanged

-- Policy 2: "Owners can manage own vehicle maintenance"
-- Allows owners to INSERT, UPDATE, DELETE maintenance logs for their vehicles
-- Status: ✓ Remains unchanged

-- ============================================================================
-- SUMMARY OF MAINTENANCE_LOGS RLS POLICIES AFTER THIS MIGRATION
-- ============================================================================
-- 
-- 1. Owners: Full CRUD access to their vehicle maintenance logs
--    - Can view, create, update, delete
--    
-- 2. Admins: Read-only access to ALL maintenance logs
--    - Can view for monitoring and analytics
--    - Cannot create, update, or delete
--
-- 3. Renters: No access to maintenance logs
--
-- ============================================================================

-- Add comment to table explaining the access model
COMMENT ON TABLE public.maintenance_logs IS 'Vehicle maintenance history and schedules. Owners manage their own vehicle maintenance. Admins have read-only access for monitoring.';
