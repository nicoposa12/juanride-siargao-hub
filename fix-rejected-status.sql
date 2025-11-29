-- =====================================================
-- FIX REJECTED ACCOUNT STATUS BUG
-- =====================================================
-- This script fixes owners who have rejected documents 
-- but their account status is incorrectly set to 
-- 'pending_verification' instead of 'rejected'
-- =====================================================

-- Step 1: Check ALL owners with rejected documents but wrong account status
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.business_name,
  u.account_verification_status as current_status,
  COUNT(bd.id) as total_docs,
  SUM(CASE WHEN bd.status = 'rejected' THEN 1 ELSE 0 END) as rejected_docs,
  SUM(CASE WHEN bd.status = 'approved' THEN 1 ELSE 0 END) as approved_docs,
  SUM(CASE WHEN bd.status = 'pending_review' THEN 1 ELSE 0 END) as pending_docs
FROM users u
LEFT JOIN business_documents bd ON u.id = bd.owner_id
WHERE u.role = 'owner'
GROUP BY u.id, u.email, u.full_name, u.business_name, u.account_verification_status
HAVING SUM(CASE WHEN bd.status = 'rejected' THEN 1 ELSE 0 END) > 0
  AND u.account_verification_status != 'rejected'
ORDER BY u.email;

-- Step 2: See the specific user case (nic@gmail.com or jmdaperozo@gmail.com)
SELECT 
  u.id,
  u.email,
  u.business_name,
  u.account_verification_status,
  u.account_status_reason,
  bd.document_type,
  bd.status as doc_status,
  bd.rejection_reason,
  bd.submitted_at
FROM users u
LEFT JOIN business_documents bd ON u.id = bd.owner_id
WHERE u.email IN ('nic@gmail.com', 'jmdaperozo@gmail.com')
ORDER BY u.email, bd.submitted_at DESC;

-- Step 3: FIX ALL owners with rejected documents
-- Set their account status to 'rejected' if they have ANY rejected documents
UPDATE users
SET 
  account_verification_status = 'rejected',
  account_status_reason = 'One or more business documents were rejected. Please review and resubmit the required documents.'
WHERE role = 'owner'
  AND id IN (
    SELECT DISTINCT bd.owner_id
    FROM business_documents bd
    WHERE bd.status = 'rejected'
  )
  AND account_verification_status != 'rejected';

-- Step 4: Verify the fix for all affected users
SELECT 
  u.id,
  u.email,
  u.business_name,
  u.account_verification_status,
  u.account_status_reason,
  COUNT(bd.id) FILTER (WHERE bd.status = 'rejected') as rejected_count,
  COUNT(bd.id) FILTER (WHERE bd.status = 'approved') as approved_count,
  COUNT(bd.id) FILTER (WHERE bd.status = 'pending_review') as pending_count
FROM users u
LEFT JOIN business_documents bd ON u.id = bd.owner_id
WHERE u.role = 'owner'
  AND u.account_verification_status = 'rejected'
GROUP BY u.id, u.email, u.business_name, u.account_verification_status, u.account_status_reason
ORDER BY u.email;

-- Step 5: Optional - See details for a specific user
-- Uncomment and replace the email to check a specific user
/*
SELECT 
  u.email,
  u.business_name,
  u.account_verification_status,
  bd.document_type,
  bd.status,
  bd.rejection_reason
FROM users u
LEFT JOIN business_documents bd ON u.id = bd.owner_id
WHERE u.email = 'YOUR_EMAIL_HERE'
ORDER BY bd.document_type;
*/
