-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 9: Add 'deleted' to account_status constraint
-- Ticket: PH-30 - User Authentication System
-- =====================================================

-- Drop the existing constraint
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_account_status_check;

-- Add new constraint with 'deleted' status
ALTER TABLE users
  ADD CONSTRAINT users_account_status_check
    CHECK (account_status IN ('active', 'suspended', 'banned', 'deleted'));

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Account status constraint updated to include deleted!';
END $$;
