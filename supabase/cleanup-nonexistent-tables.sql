-- Remove RLS from non-existent tables
-- Run this to clean up the RLS policies that reference tables we haven't created yet

-- Remove RLS from tables that don't exist
-- These will fail silently if the tables don't exist

-- Drop policies for non-existent tables
DO $$ 
BEGIN
    -- notifications table
    EXECUTE 'ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY';
    
    -- blocked_dates table  
    EXECUTE 'ALTER TABLE IF EXISTS public.blocked_dates DISABLE ROW LEVEL SECURITY';
    
    -- favorites table
    EXECUTE 'ALTER TABLE IF EXISTS public.favorites DISABLE ROW LEVEL SECURITY';
    
    -- disputes table
    EXECUTE 'ALTER TABLE IF EXISTS public.disputes DISABLE ROW LEVEL SECURITY';
    
EXCEPTION
    WHEN undefined_table THEN
        -- Ignore errors for tables that don't exist
        NULL;
END $$;

