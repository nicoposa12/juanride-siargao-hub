-- 00010_fix_oauth_trigger_no_default_role.sql
-- Ensures new auth users fall back to a pending role and flag onboarding requirements

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    incoming_full_name TEXT;
    incoming_role TEXT;
    requires_onboarding BOOLEAN;
BEGIN
    incoming_full_name := NULLIF(NEW.raw_user_meta_data->>'full_name', '');
    incoming_role := NULLIF(NEW.raw_user_meta_data->>'role', '');

    IF incoming_role IS NULL OR incoming_role NOT IN ('renter', 'owner', 'admin') THEN
        incoming_role := 'pending';
    END IF;

    requires_onboarding := incoming_role = 'pending' OR incoming_full_name IS NULL;

    INSERT INTO public.users (
        id,
        email,
        full_name,
        role,
        needs_onboarding,
        onboarding_completed_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        incoming_full_name,
        incoming_role,
        requires_onboarding,
        CASE WHEN requires_onboarding THEN NULL ELSE NOW() END
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
