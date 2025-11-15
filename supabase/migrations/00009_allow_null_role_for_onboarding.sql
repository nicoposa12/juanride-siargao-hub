-- 00009_allow_null_role_for_onboarding.sql
-- Introduces support for pending roles and onboarding metadata

BEGIN;

-- Allow role to include the new "pending" state and default to it when unspecified
ALTER TABLE public.users
    DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
    ALTER COLUMN role SET DEFAULT 'pending';

ALTER TABLE public.users
    ADD CONSTRAINT users_role_check
        CHECK (role IN ('pending', 'renter', 'owner', 'admin'));

-- Ensure existing rows comply with the new constraint
UPDATE public.users
SET role = COALESCE(NULLIF(role, ''), 'pending');

-- Add onboarding metadata columns
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS needs_onboarding BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

COMMIT;
