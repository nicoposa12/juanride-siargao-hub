-- ============================================================================
-- Add vehicle statistics view for ratings and booking counts (SAFE VERSION)
-- Provides aggregated data for display on vehicle cards
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.vehicle_stats;

-- Create the view for vehicle statistics
CREATE VIEW public.vehicle_stats AS
SELECT 
  v.id as vehicle_id,
  -- Average rating from approved reviews
  COALESCE(AVG(r.rating) FILTER (WHERE r.is_approved = true), 0) as average_rating,
  -- Total number of approved reviews
  COUNT(r.id) FILTER (WHERE r.is_approved = true) as total_reviews,
  -- Total number of completed bookings (times rented)
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'completed') as total_bookings,
  -- Total number of all bookings (for stats)
  COUNT(DISTINCT b.id) as all_bookings_count
FROM public.vehicles v
LEFT JOIN public.reviews r ON v.id = r.vehicle_id
LEFT JOIN public.bookings b ON v.id = b.vehicle_id
GROUP BY v.id;

-- Add comment to the view
COMMENT ON VIEW public.vehicle_stats IS 'Aggregated statistics for each vehicle including ratings and booking counts';

-- Grant access to the view
GRANT SELECT ON public.vehicle_stats TO authenticated;
GRANT SELECT ON public.vehicle_stats TO anon;
