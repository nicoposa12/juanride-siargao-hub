-- 00011_reset_oauth_users_for_onboarding.sql
-- Backfills existing users that were created via OAuth without proper profile metadata

BEGIN;

-- Flag users that are missing essential profile info as needing onboarding
UPDATE public.users
SET
    full_name = NULLIF(full_name, ''),
    role = CASE
        WHEN role NOT IN ('pending', 'renter', 'owner', 'admin') THEN 'pending'
        ELSE role
    END,
    needs_onboarding = TRUE,
    onboarding_completed_at = NULL
WHERE
    (full_name IS NULL OR full_name = '')
    OR role = 'pending';

COMMIT;
