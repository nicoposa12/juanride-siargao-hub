-- ============================================================================
-- VERIFICATION SCRIPT - Run after migration to verify success
-- ============================================================================
-- Copy and paste this entire script into Supabase SQL Editor

-- TEST 1: Check constraint is correct
-- Expected: Should show CHECK constraint with 3 statuses
SELECT 
    'TEST 1: Constraint Check' as test_name,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'vehicles_status_check';

-- TEST 2: Check for invalid statuses
-- Expected: Should return 0 rows
SELECT 
    'TEST 2: Invalid Statuses' as test_name,
    COUNT(*) as invalid_count
FROM vehicles 
WHERE status NOT IN ('available', 'unavailable', 'maintenance');

-- TEST 3: Show status distribution
-- Expected: Only 'available', 'unavailable', 'maintenance'
SELECT 
    'TEST 3: Status Distribution' as test_name,
    status,
    COUNT(*) as count
FROM vehicles
GROUP BY status
ORDER BY count DESC;

-- TEST 4: Show sample vehicles with their statuses
-- Expected: All should have valid statuses
SELECT 
    'TEST 4: Sample Vehicles' as test_name,
    id,
    make,
    model,
    status,
    is_approved
FROM vehicles
ORDER BY created_at DESC
LIMIT 5;

-- TEST 5: Check trigger function
-- Expected: Should show updated function definition with 'unavailable'
SELECT 
    'TEST 5: Trigger Function' as test_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'update_vehicle_status';

-- ============================================================================
-- SUCCESS CRITERIA:
-- ============================================================================
-- ✅ TEST 1: Constraint shows: 'available', 'unavailable', 'maintenance'
-- ✅ TEST 2: Invalid count = 0
-- ✅ TEST 3: Only shows 3 status types
-- ✅ TEST 4: All vehicles have valid statuses
-- ✅ TEST 5: Function contains 'unavailable' not 'rented'
-- ============================================================================

-- If all tests pass, your migration is successful! 🎉
