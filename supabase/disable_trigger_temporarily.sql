-- Temporarily disable the auth trigger until we fix it
-- This allows signup to work with manual insert

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- You can re-enable it later once we fix the issue

