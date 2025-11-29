-- Manual Unsuspend Script
-- Run this to unsuspend Justin Gwapo after marking commission as paid

-- First, check current suspension status
SELECT 
  id,
  full_name,
  email,
  is_suspended,
  suspension_reason,
  suspended_at
FROM users 
WHERE email = 'justin01@gmail.com';

-- Unsuspend Justin Gwapo
UPDATE users 
SET 
  is_suspended = FALSE,
  suspension_reason = NULL,
  suspended_at = NULL,
  suspended_by = NULL
WHERE email = 'justin01@gmail.com';

-- Verify unsuspension
SELECT 
  id,
  full_name,
  email,
  is_suspended,
  suspension_reason,
  suspended_at
FROM users 
WHERE email = 'justin01@gmail.com';
