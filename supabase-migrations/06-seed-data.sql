-- =====================================================
-- PLATINUM HUNTERS GR - DATABASE MIGRATION
-- Part 6: Seed Initial Data
-- =====================================================

-- =====================================================
-- PLATFORMS
-- =====================================================

INSERT INTO platforms (name, short_name, icon_name) VALUES
  -- PlayStation
  ('PlayStation 5', 'PS5', 'playstation'),
  ('PlayStation 4', 'PS4', 'playstation'),
  ('PlayStation 3', 'PS3', 'playstation'),
  ('PlayStation 2', 'PS2', 'playstation'),
  ('PlayStation', 'PS1', 'playstation'),
  ('PlayStation Vita', 'PS Vita', 'playstation'),
  ('PlayStation Portable', 'PSP', 'playstation'),
  ('PlayStation VR', 'PS VR', 'vr'),
  ('PlayStation VR2', 'PS VR2', 'vr'),

  -- Xbox
  ('Xbox Series X/S', 'Xbox Series X/S', 'xbox'),
  ('Xbox One', 'Xbox One', 'xbox'),
  ('Xbox 360', 'Xbox 360', 'xbox'),
  ('Xbox', 'Xbox', 'xbox'),

  -- Nintendo
  ('Nintendo Switch', 'Switch', 'nintendo'),
  ('Wii U', 'Wii U', 'nintendo'),
  ('Wii', 'Wii', 'nintendo'),
  ('Nintendo 3DS', '3DS', 'nintendo'),
  ('Nintendo DS', 'DS', 'nintendo'),
  ('GameCube', 'GameCube', 'nintendo'),
  ('Nintendo 64', 'N64', 'nintendo'),

  -- PC & Mobile
  ('PC (Microsoft Windows)', 'PC', 'pc'),
  ('Mac', 'Mac', 'apple'),
  ('Linux', 'Linux', 'linux'),
  ('iOS', 'iOS', 'mobile'),
  ('Android', 'Android', 'mobile'),

  -- Retro
  ('Sega Genesis', 'Genesis', 'sega'),
  ('Dreamcast', 'Dreamcast', 'sega'),
  ('Atari', 'Atari', 'atari')
ON CONFLICT (short_name) DO NOTHING;

-- =====================================================
-- GENRES
-- =====================================================

INSERT INTO genres (name, slug) VALUES
  ('Δράση', 'action'),
  ('Περιπέτεια', 'adventure'),
  ('RPG', 'rpg'),
  ('Στρατηγική', 'strategy'),
  ('Αθλητικά', 'sports'),
  ('Αγώνες', 'racing'),
  ('Προσομοίωση', 'simulation'),
  ('Παζλ', 'puzzle'),
  ('Φρίκη', 'horror'),
  ('Πλατφόρμας', 'platformer'),
  ('Fighting', 'fighting'),
  ('Shooter', 'shooter'),
  ('Stealth', 'stealth'),
  ('Survival', 'survival'),
  ('MMORPG', 'mmorpg'),
  ('Roguelike', 'roguelike'),
  ('Metroidvania', 'metroidvania'),
  ('Rhythm', 'rhythm'),
  ('Visual Novel', 'visual-novel'),
  ('Party', 'party'),
  ('Indie', 'indie')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SAMPLE ADMIN USER (OPTIONAL)
-- =====================================================

-- Note: This creates a sample admin user for testing
-- In production, you should create admin users through Supabase Auth
-- and then update their role in the users table

-- Example (commented out - uncomment and modify as needed):
/*
INSERT INTO users (id, email, username, display_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@platinumhunters.gr', 'admin', 'Administrator', 'admin')
ON CONFLICT (id) DO NOTHING;
*/

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Seed data inserted successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Import your old game/guide data';
  RAISE NOTICE '2. Create your admin user through Supabase Auth';
  RAISE NOTICE '3. Update your application code to use new schema';
  RAISE NOTICE '4. Test thoroughly before going live';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created: 17';
  RAISE NOTICE 'Indexes created: 30+';
  RAISE NOTICE 'Triggers created: 10+';
  RAISE NOTICE 'Views created: 7';
  RAISE NOTICE 'RLS Policies: Enabled on all tables';
  RAISE NOTICE '';
END $$;
