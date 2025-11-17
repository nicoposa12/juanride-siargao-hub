-- Add status column to maintenance_logs table
ALTER TABLE public.maintenance_logs 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scheduled' 
CHECK (status IN ('scheduled', 'in_progress', 'completed'));

-- Add comment explaining the status column
COMMENT ON COLUMN public.maintenance_logs.status IS 'Maintenance status: scheduled (future/planned maintenance), in_progress (maintenance is currently being done), completed (maintenance has been done)';

-- Update any existing records to have a default status
UPDATE public.maintenance_logs 
SET status = 'scheduled' 
WHERE status IS NULL;
