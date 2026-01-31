-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 31: Relax Activity Log Type Constraint
-- =====================================================

-- Drop restrictive type check that blocks new activity kinds
ALTER TABLE activity_log
  DROP CONSTRAINT IF EXISTS activity_log_type_check;

DO $$
BEGIN
  RAISE NOTICE '✅ Dropped activity_log_type_check constraint.';
END $$;
