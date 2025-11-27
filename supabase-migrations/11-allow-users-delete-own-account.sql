-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 11: Allow users to delete their own account
-- Ticket: PH-30 - User Authentication System
-- =====================================================

-- Add policy to allow users to delete their own account
-- This works alongside the existing "Admins can delete users" policy
CREATE POLICY "Users can delete own account"
  ON users FOR DELETE
  USING (auth.uid() = id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Users can now delete their own account!';
END $$;
