-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 56: Create D&D Tables (E2EE Architecture)
-- =====================================================

-- =====================================================
-- 1. Device Keys (for E2EE)
-- =====================================================

CREATE TABLE dnd_user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name TEXT,
  public_key TEXT NOT NULL, -- base64 encoded
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, public_key)
);

ALTER TABLE dnd_user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own device keys"
  ON dnd_user_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device keys"
  ON dnd_user_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device keys"
  ON dnd_user_devices FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 2. Campaigns
-- =====================================================

CREATE TABLE dnd_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dm_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  system TEXT, -- "D&D 5e", "D&D 2024", etc.
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE dnd_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DMs can manage their campaigns"
  ON dnd_campaigns FOR ALL
  USING (auth.uid() = dm_id)
  WITH CHECK (auth.uid() = dm_id);

-- =====================================================
-- 3. Campaign Members
-- =====================================================

CREATE TABLE dnd_campaign_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES dnd_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('dm', 'co_dm', 'player', 'spectator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, user_id)
);

ALTER TABLE dnd_campaign_members ENABLE ROW LEVEL SECURITY;

-- Add policy for campaign members to read campaigns (must be after dnd_campaign_members is created)
CREATE POLICY "Campaign members can read campaigns"
  ON dnd_campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dnd_campaign_members m
      WHERE m.campaign_id = id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read their own campaign memberships"
  ON dnd_campaign_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "DMs can manage campaign memberships"
  ON dnd_campaign_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM dnd_campaigns c
      WHERE c.id = campaign_id AND c.dm_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dnd_campaigns c
      WHERE c.id = campaign_id AND c.dm_id = auth.uid()
    )
  );

-- =====================================================
-- 4. Campaign Key Envelopes (E2EE)
-- =====================================================

CREATE TABLE dnd_campaign_key_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES dnd_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  encrypted_campaign_key TEXT NOT NULL, -- base64 sealed box
  key_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, user_id, key_version)
);

ALTER TABLE dnd_campaign_key_envelopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own key envelopes"
  ON dnd_campaign_key_envelopes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "DMs can write key envelopes for members"
  ON dnd_campaign_key_envelopes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dnd_campaigns c
      WHERE c.id = campaign_id AND c.dm_id = auth.uid()
    )
  );

-- =====================================================
-- 5. Session Notes (Encrypted)
-- =====================================================

CREATE TABLE dnd_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES dnd_campaigns(id) ON DELETE CASCADE,

  -- Encrypted fields (ciphertext only)
  session_date DATE,
  title_ct TEXT NOT NULL,         -- encrypted title
  dm_notes_ct TEXT NOT NULL,      -- encrypted DM-only notes
  recap_ct TEXT NOT NULL,         -- encrypted player recap

  -- Sharing state
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,

  -- Encryption metadata
  alg TEXT NOT NULL DEFAULT 'AES-256-GCM',
  nonce TEXT NOT NULL,            -- base64
  version INT NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE dnd_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can read session ciphertext"
  ON dnd_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dnd_campaign_members m
      WHERE m.campaign_id = campaign_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "DMs can write sessions"
  ON dnd_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM dnd_campaign_members m
      WHERE m.campaign_id = campaign_id
        AND m.user_id = auth.uid()
        AND m.role IN ('dm', 'co_dm')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dnd_campaign_members m
      WHERE m.campaign_id = campaign_id
        AND m.user_id = auth.uid()
        AND m.role IN ('dm', 'co_dm')
    )
  );

-- =====================================================
-- 6. Tool Access Permissions
-- =====================================================

CREATE TABLE dnd_tool_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES dnd_campaigns(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL, -- 'character_sheet', 'initiative_tracker', etc.
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID NOT NULL REFERENCES users(id),
  UNIQUE (campaign_id, player_id, tool_name)
);

ALTER TABLE dnd_tool_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can read their tool access"
  ON dnd_tool_access FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "DMs can manage tool access"
  ON dnd_tool_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM dnd_campaigns c
      WHERE c.id = campaign_id AND c.dm_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dnd_campaigns c
      WHERE c.id = campaign_id AND c.dm_id = auth.uid()
    )
  );

-- =====================================================
-- Triggers
-- =====================================================

CREATE TRIGGER trigger_update_dnd_campaigns_updated_at
  BEFORE UPDATE ON dnd_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_dnd_sessions_updated_at
  BEFORE UPDATE ON dnd_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX idx_dnd_campaign_members_user ON dnd_campaign_members (user_id);
CREATE INDEX idx_dnd_campaign_members_campaign ON dnd_campaign_members (campaign_id);
CREATE INDEX idx_dnd_sessions_campaign ON dnd_sessions (campaign_id, created_at DESC);

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ D&D tables created with E2EE support and RLS policies';
END $$;
