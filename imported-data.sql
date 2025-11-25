-- =====================================================
-- PLATINUM HUNTERS GR - DATA IMPORT
-- Migrated from old backup
-- =====================================================

BEGIN;

-- Insert unique platforms (skip if already exist)
INSERT INTO platforms (name, short_name) VALUES
  ('PS3', 'PS3'),
  ('PS4', 'PS4'),
  ('PS5', 'PS5')
ON CONFLICT (short_name) DO NOTHING;

-- Insert games
-- Note: We're inserting without developer/publisher/genre for now
-- You can update these later using the RAWG API integration

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  2,
  $$Black Myth: Wukong$$,
  'black-myth-wukong',
  'https://i.psnprofiles.com/games/0dc331/L7909fa.png',
  1,
  4,
  9,
  22
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 2, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  3,
  $$Astro's Playroom$$,
  'astros-playroom',
  'https://i.psnprofiles.com/games/775921/Ldaaa68.png',
  1,
  5,
  14,
  31
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 3, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  4,
  $$Ender Lilies: Quietus of the Knights$$,
  'ender-lilies-quietus-of-the-knights',
  'https://i.psnprofiles.com/games/038939/L47bb55.png',
  1,
  3,
  13,
  22
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 4, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  5,
  $$Marvel's Spider-Man$$,
  'marvels-spider-man',
  'https://i.psnprofiles.com/games/8c6109/L1398d7.png',
  1,
  5,
  14,
  54
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 5, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  6,
  $$Marvel's Spider-Man: Miles Morales$$,
  'marvels-spider-man-miles-morales',
  'https://i.psnprofiles.com/games/530657/L46f0dd.png',
  1,
  2,
  10,
  37
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 6, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  7,
  $$Cat Quest$$,
  'cat-quest',
  'https://i.psnprofiles.com/games/821e23/L8e9ed9.png',
  1,
  8,
  7,
  7
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 7, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  8,
  $$Life is Strange$$,
  'life-is-strange',
  'https://i.psnprofiles.com/games/ed93d6/Ld80014.png',
  1,
  1,
  0,
  59
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 8, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  9,
  $$Life is Strange: Before the Storm$$,
  'life-is-strange-before-the-storm',
  'https://i.psnprofiles.com/games/b87253/L827e0a.png',
  1,
  4,
  15,
  15
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 9, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  10,
  $$Astro Bot$$,
  'astro-bot',
  'https://i.psnprofiles.com/games/600ec7/L29b820.png',
  1,
  2,
  18,
  37
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 10, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  11,
  $$Daxter$$,
  'daxter',
  'https://i.psnprofiles.com/games/bd1cf1/L078734.png',
  1,
  4,
  8,
  30
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 11, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  12,
  $$Spyro the Dragon$$,
  'spyro-the-dragon',
  'https://i.psnprofiles.com/games/b8edaf/L648c20.png',
  1,
  3,
  17,
  16
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 12, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  13,
  $$Spyro 2: Ripto's Rage!$$,
  'spyro-2-riptos-rage',
  'https://i.psnprofiles.com/games/01522c/Le64bcd.png',
  1,
  5,
  12,
  12
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 13, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  14,
  $$Spyro 3: Year of the Dragon$$,
  'spyro-3-year-of-the-dragon',
  'https://i.psnprofiles.com/games/10a4cb/L3c80ff.png',
  1,
  4,
  9,
  27
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 14, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  15,
  $$Coffee Talk$$,
  'coffee-talk',
  'https://i.psnprofiles.com/games/15850f/L6eddce.png',
  1,
  7,
  7,
  9
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 15, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  16,
  $$Undertale$$,
  'undertale',
  'https://i.psnprofiles.com/games/60c710/Le71ec5.png',
  1,
  5,
  10,
  14
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 16, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  17,
  $$Assassin's Creed Mirage$$,
  'assassins-creed-mirage',
  'https://i.psnprofiles.com/games/a5f21a/La5ae77.png',
  1,
  1,
  15,
  34
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 17, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  18,
  $$The Stanley Parable: Ultra Deluxe$$,
  'the-stanley-parable-ultra-deluxe',
  'https://i.psnprofiles.com/games/1d47e0/L8041ad.png',
  1,
  11,
  0,
  0
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 18, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  19,
  $$Marvel's Spider-Man 2$$,
  'marvels-spider-man-2',
  'https://i.psnprofiles.com/games/fede54/Lc5ecf9.png',
  1,
  2,
  18,
  22
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 19, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  20,
  $$Life is Strange 2$$,
  'life-is-strange-2',
  'https://i.psnprofiles.com/games/e35b71/L16aa50.png',
  1,
  1,
  15,
  30
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 20, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  21,
  $$Life is Strange: True Colors$$,
  'life-is-strange-true-colors',
  'https://i.psnprofiles.com/games/4f3b67/Lf35aaf.png',
  1,
  6,
  0,
  34
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 21, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  22,
  $$MediEvil$$,
  'medievil',
  'https://i.psnprofiles.com/games/99aaaf/Ld22d3a.png',
  1,
  3,
  17,
  18
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 22, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  23,
  $$Red Dead Redemption 2$$,
  'red-dead-redemption-2',
  'https://i.psnprofiles.com/games/debcee/L758121.png',
  1,
  3,
  4,
  44
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 23, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  24,
  $$Cyberpunk 2077$$,
  'cyberpunk-2077',
  'https://i.psnprofiles.com/games/c66113/L1c60e6.png',
  1,
  1,
  17,
  26
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 24, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  26,
  $$Final Fantasy VII Remake$$,
  'final-fantasy-vii-remake',
  'https://i.psnprofiles.com/games/592be4/Le59079.png',
  1,
  2,
  7,
  44
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 26, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  27,
  $$Grand Theft Auto V$$,
  'grand-theft-auto-v',
  'https://i.psnprofiles.com/games/bdb66f/L0b925e.png',
  1,
  3,
  15,
  59
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 27, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  28,
  $$Demon's Souls$$,
  'demons-souls',
  'https://i.psnprofiles.com/games/54fddf/Le4464f.png',
  1,
  5,
  9,
  22
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 28, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  30,
  $$Dark Souls$$,
  'dark-souls',
  'https://i.psnprofiles.com/games/a68ce9/Lab9533.png',
  1,
  2,
  20,
  18
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 30, id FROM platforms WHERE name = 'PlayStation 3'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  31,
  $$Rise of the Ronin$$,
  'rise-of-the-ronin',
  'https://i.psnprofiles.com/games/2f3a77/Lec7edc.png',
  1,
  2,
  9,
  39
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 31, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  32,
  $$MediEvil: Resurrection$$,
  'medievil-resurrection',
  'https://i.psnprofiles.com/games/0243cb/La78341.png',
  1,
  4,
  11,
  24
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 32, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  33,
  $$Stellar Blade$$,
  'stellar-blade',
  'https://i.psnprofiles.com/games/179104/L2f942a.png',
  1,
  3,
  12,
  29
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 33, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  34,
  $$GhoulBoy$$,
  'ghoulboy',
  'https://i.psnprofiles.com/games/a44c8a/L7488d0.png',
  1,
  11,
  0,
  0
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 34, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  35,
  $$The Gardens Between$$,
  'the-gardens-between',
  'https://i.psnprofiles.com/games/3a44be/L6ef0d2.png',
  1,
  8,
  9,
  0
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 35, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  36,
  $$Röki$$,
  'röki',
  'https://i.psnprofiles.com/games/ac2239/Led48af.png',
  1,
  5,
  14,
  12
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 36, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  37,
  $$Silent Hill 2$$,
  'silent-hill-2',
  'https://i.psnprofiles.com/games/e41e90/Lc51e47.png',
  1,
  3,
  12,
  28
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 37, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  38,
  $$Crow Country$$,
  'crow-country',
  'https://i.psnprofiles.com/games/8accd2/L6ec416.png',
  1,
  10,
  2,
  3
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 38, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  39,
  $$Sonic Origins$$,
  'sonic-origins',
  'https://i.psnprofiles.com/games/0bd9a7/L41f0eb.png',
  1,
  5,
  10,
  20
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 39, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  40,
  $$Cat Quest III$$,
  'cat-quest-iii',
  'https://i.psnprofiles.com/games/71cf63/Lf4bb4e.png',
  1,
  4,
  20,
  6
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 40, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  41,
  $$Endling: Extinction is Forever$$,
  'endling-extinction-is-forever',
  'https://i.psnprofiles.com/games/adc992/L3fd49e.png',
  1,
  7,
  8,
  12
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 41, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  42,
  $$Crash Bandicoot 2: Cortex Strikes Back$$,
  'crash-bandicoot-2-cortex-strikes-back',
  'https://i.psnprofiles.com/games/0a2d7a/L3d70b4.png',
  1,
  6,
  11,
  7
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 42, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  43,
  $$Jak 3$$,
  'jak-3',
  'https://i.psnprofiles.com/games/0b8c8e/L272970.png',
  1,
  3,
  9,
  34
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 43, id FROM platforms WHERE name = 'PlayStation 3'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  44,
  $$LEGO Harry Potter Collection: Years 5-7$$,
  'lego-harry-potter-collection-years-5-7',
  'https://i.psnprofiles.com/games/65e8cd/L607d19.png',
  1,
  2,
  12,
  34
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 44, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  45,
  $$Jak and Daxter: The Precursor Legacy$$,
  'jak-and-daxter-the-precursor-legacy',
  'https://i.psnprofiles.com/games/bf812e/Lf0abf0.png',
  1,
  4,
  12,
  22
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 45, id FROM platforms WHERE name = 'PlayStation 3'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  46,
  $$Ghostwire: Tokyo$$,
  'ghostwire-tokyo',
  'https://i.psnprofiles.com/games/d7a784/L6b3939.png',
  1,
  2,
  6,
  58
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 46, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  47,
  $$Lies of P$$,
  'lies-of-p',
  'https://i.psnprofiles.com/games/c05018/Le6b041.png',
  1,
  3,
  13,
  26
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 47, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  48,
  $$Resident Evil 4$$,
  'resident-evil-4',
  'https://i.psnprofiles.com/games/f5f42a/L86eab2.png',
  1,
  5,
  11,
  30
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 48, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  49,
  $$Prince of Persia: The Lost Crown$$,
  'prince-of-persia-the-lost-crown',
  'https://i.psnprofiles.com/games/93620e/L2ab5b1.png',
  1,
  5,
  16,
  20
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 49, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  50,
  $$Alan Wake II$$,
  'alan-wake-ii',
  'https://i.psnprofiles.com/games/1a5343/Ldc0e77.png',
  1,
  0,
  3,
  85
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 50, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  53,
  $$SpongeBob SquarePants: Battle for Bikini Bottom$$,
  'spongebob-squarepants-battle-for-bikini-bottom',
  'https://i.psnprofiles.com/games/0269a6/L861322.png',
  1,
  6,
  5,
  21
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 53, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  54,
  $$The Witcher 3: Wild Hunt$$,
  'the-witcher-3-wild-hunt',
  'https://i.psnprofiles.com/games/a426c2/L4a541a.png',
  1,
  2,
  8,
  68
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 54, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  55,
  $$Assassin's Creed II$$,
  'assassins-creed-ii',
  'https://i.psnprofiles.com/games/ff8d0e/L55839b.png',
  1,
  1,
  15,
  34
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 55, id FROM platforms WHERE name = 'PlayStation 3'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  56,
  $$Assassin's Creed Revelations$$,
  'assassins-creed-revelations',
  'https://i.psnprofiles.com/games/c2a1d2/L81881d.png',
  1,
  1,
  23,
  45
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 56, id FROM platforms WHERE name = 'PlayStation 3'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  58,
  $$Assassin's Creed Odyssey$$,
  'assassins-creed-odyssey',
  'https://i.psnprofiles.com/games/d24000/L4544d2.png',
  1,
  3,
  15,
  75
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 58, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  59,
  $$Assassin's Creed Freedom Cry$$,
  'assassins-creed-freedom-cry',
  'https://i.psnprofiles.com/games/f188c5/L0c5bc8.png',
  0,
  1,
  2,
  9
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 59, id FROM platforms WHERE name = 'PlayStation 3'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  60,
  $$Assassin's Creed Rogue$$,
  'assassins-creed-rogue',
  'https://i.psnprofiles.com/games/cb248b/Ld3a753.png',
  1,
  2,
  14,
  30
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 60, id FROM platforms WHERE name = 'PlayStation 3'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  61,
  $$Assassin's Creed III$$,
  'assassins-creed-iii',
  'https://i.psnprofiles.com/games/5ac8f9/Ldc4936.png',
  1,
  1,
  28,
  35
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 61, id FROM platforms WHERE name = 'PlayStation 3'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  62,
  $$Assassin's Creed Liberation$$,
  'assassins-creed-liberation',
  'https://i.psnprofiles.com/games/8f7249/L2ea488.png',
  1,
  4,
  18,
  8
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 62, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  63,
  $$Assassin's Creed Origins$$,
  'assassins-creed-origins',
  'https://i.psnprofiles.com/games/5c5250/L86b5aa.png',
  1,
  2,
  21,
  44
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 63, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  64,
  $$Assassin's Creed Unity$$,
  'assassins-creed-unity',
  'https://i.psnprofiles.com/games/1b7525/Le47b38.png',
  1,
  2,
  14,
  41
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 64, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  65,
  $$Assassin's Creed Syndicate$$,
  'assassins-creed-syndicate',
  'https://i.psnprofiles.com/games/c2af51/L986c13.png',
  1,
  4,
  7,
  45
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 65, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  66,
  $$Assassin's Creed Valhalla$$,
  'assassins-creed-valhalla',
  'https://i.psnprofiles.com/games/fbaec5/L8c6397.png',
  1,
  1,
  29,
  62
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 66, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  67,
  $$Hello Neighbor 2$$,
  'hello-neighbor-2',
  'https://i.psnprofiles.com/games/ef5e97/L8639e0.png',
  1,
  10,
  3,
  1
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 67, id FROM platforms WHERE name = 'PlayStation 5'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  68,
  $$Assassin's Creed Brotherhood$$,
  'assassins-creed-brotherhood',
  'https://i.psnprofiles.com/games/998763/Lca6af8.png',
  1,
  1,
  18,
  41
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 68, id FROM platforms WHERE name = 'PlayStation 3'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  69,
  $$God of War$$,
  'god-of-war',
  'https://i.psnprofiles.com/games/45f675/La0009b.png',
  1,
  5,
  10,
  20
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 69, id FROM platforms WHERE name = 'PlayStation 3'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  70,
  $$God of War II$$,
  'god-of-war-ii',
  'https://i.psnprofiles.com/games/7d5234/L756f32.png',
  1,
  5,
  11,
  18
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 70, id FROM platforms WHERE name = 'PlayStation 3'
ON CONFLICT DO NOTHING;

INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  71,
  $$God of War III Remastered$$,
  'god-of-war-iii-remastered',
  'https://i.psnprofiles.com/games/8ad7d8/Lc9e04e.png',
  1,
  5,
  11,
  18
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT 71, id FROM platforms WHERE name = 'PlayStation 4'
ON CONFLICT DO NOTHING;

-- Insert guides

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  1,
  2,
  (SELECT title FROM games WHERE id = 2),
  7.0,
  60,
  2,
  'published',
  true,
  '2025-02-16 12:56:51.805522'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  2,
  3,
  (SELECT title FROM games WHERE id = 3),
  2.0,
  5,
  1,
  'published',
  true,
  '2025-02-16 12:59:25.507831'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 2
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  2,
  1,
  $$Stage 1: Beginning Your New Adventure$$,
  $$Please Note: Many spoilers will be told throughout the guide below (most of which contain many easter eggs). Please be careful and keep in mind that any bit of information accidentally read could ruin your experience. You have been warned!Welcome to Astro's Playroom! Here marks the spot to the beginning of your journey to the platinum trophy! Your first step is to get used to the controls and how the game works. The game will put you in a quick tutorial on how your new controller works and how to use it. Astro's Playroom is a fairly simple game that only takes a few minutes to get the hang of. Once you complete the tutorial, you will be given four options of different levels. It is your decision on which level you want to complete first. Each level consists of four sub-levels, for a total of 16 sub-levels. However, it is recommended that you start on Cooling Springs, as this is a small open world level that does a good job on introducing you to what the game has to offer. You'll get a good idea of what each level will look like after playing your first level. Once you have completed your first level, feel free to explore and complete the remaining three levels.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 2
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  2,
  2,
  $$Stage 2: Artifacts, Puzzle Pieces & Gatcha Prizes$$,
  $$After playing some of the levels, you'll most likely have noticed that there are many collectibles to find in the game. There are two different types of collectibles, Artifacts and Puzzle Pieces. There are a total of 46 artifacts and 96 puzzle pieces. Most of these collectibles can be found by exploring all levels and sub-levels, while some can be found at the Gatcha Prize Machine.The Gatcha Prize Machine is a vending machine that will grant you random items. These items include artifacts, puzzle pieces, and statues. In order to obtain a prize, you must spend 100 PS coins, which can be found by simply exploring levels and defeating enemies. Many trophies on this list will require you to unlock certain prizes from the prize machine, so always be on the lookout for coins whenever you have the chance. There are a total of 60 prizes to win, which in total will cost you around 6,000 PS coins. Eventually, all prizes must be collected from the machine, so try to visit the Gatcha Prize Machine periodically to unlock some collectibles.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 2
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  2,
  3,
  $$Stage 3: Cleanup & Miscellaneous Trophies$$,
  $$By now, you should most likely have completed all levels and found all collectibles. All that is left to do is complete some miscellaneous challenges and find a few secrets and easter eggs. Most of these trophies are going to have you travel to all sub-levels to complete them, while others will have you explore the CPU Plaza and PlayStation Labo. A majority of these trophies will require you to interact with various elements around you, so whenever you are given something to interact with, see what possibilities can happen when using certain items or objects.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  3,
  4,
  (SELECT title FROM games WHERE id = 4),
  7.0,
  25,
  1,
  'published',
  true,
  '2025-02-16 12:59:41.711563'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  4,
  5,
  (SELECT title FROM games WHERE id = 5),
  3.0,
  25,
  1,
  'published',
  true,
  '2025-02-16 12:59:55.98737'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 4
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  4,
  1,
  $$Stage 1: Finish the Story$$,
  $$Not only will you get a few of the trophies by naturally playing the story, but you'll also need to progress through the game to unlock all the needed content for the platinum. You can check Tips & Strategies for some pre-game pointers.Also, keep in mind that once you've completed the story, you'll be allowed to free-roam and go back for trophies, so take your time with the game since you can go back for anything you haven't yet done, or you can combine this stage with the ones below - whatever you prefer. Though keep in mind that you should try to complete any random crimes you come across in order to reduce the grind later on.As a reminder, if you decide to play the challenges in this stage: spend challenge tokens sparingly! The Taskmaster challenges are fairly tough, though only a Spectacular (silver) score is needed, which will provide enough tokens to afford all the suits. Try not to spend too many challenge tokens on gadgets or suit mods, or else it may be necessary to get the maximum score for a few of the challenges. However, with NG+ and the DLCs, you will have more opportunities to get tokens, so you should only have to worry about how to spend tokens if you're not planning on doing the DLCs.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 4
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  4,
  2,
  $$Stage 2: Map Markers$$,
  $$Note: For this entire stage you'll need to activate all of the surveillance towers first, which are marked on your map early on.As you go through the story, you'll unlock new map markers, which, by the end of the game, will leave you with the following:BackpacksSide MissionsLandmarksFisk HideoutsSable OutpostsDemon WarehousesPrisoner CampsResearch StationsBlack Cat StakeoutsPigeonsTaskmaster ChallengesCrimes (pop-up markers)In order to fully complete the game, as required for  I Heart Manhattan, you'll need to do all of the above. This will also get you the trophies relating to completing a set of markers, such as  Cat Prints, for completing all of the Black Cat stakeouts. How you choose to go about the markers is up to you, but when doing challenges and bases (camps, outposts, warehouses, hideouts), try to fulfill the objectives you are given as this will give you the extra base tokens needed for  A Suit For All Seasons.All of the markers will be on the map, which you can access via . Markers can also be selected with , which will cause them to show up on your mini-map, or you can fast-travel if you've been there before. This excludes crimes, which can be detected with  while traversing the city - It may take a bit of luck to come across these, but you can hover over districts in the map to see what crimes remain. If you're planning on doing the DLCs, note that they have unique crimes, so you must grind out the main game ones here.If you have the proximity sensor mod, note that optional photos don't count towards trophies.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 4
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  4,
  3,
  $$Stage 3: Clean-Up$$,
  $$After completing the story and all of the map markers, you should have most of the other trophies, but below is a brief rundown of any remaining ones you may still need to achieve.TrophyHow to Unlock Superior Spider-ManPlay the game until you level up enough to afford all of Spidey's skills in the menu (this should be around level 45-50).  A Suit For All SeasonsUnlock all of the suits by fully completing the game, then purchase them.  Science FTW!Upgrade your gadgets in the menu 15 times.  Wing ItEarned by disturbing pigeons on rooftops - the best way to get this is just through playing the game.  King of SwingThis should be earned naturally, but can be located in the benchmarks tab in the menu - get a blue one to level 2.  And Stay Down!Same as above, but you'll need to complete a green benchmark.  Hug It OutThrow trip mines onto enemies standing in front of another enemy so they get tied together (10x).  Spider-SensibleDodge with  right before you get hit (10x).  OverdriveTake down 10 cars by completing nearby car chases (10x).  With Great PowerVisit Uncle Ben's grave in the top left corner of the map.  Hero for HigherClimb Avengers Tower and sit atop one of the red lights at the very top.  Born to RideFast travel 5 times. Spider-Man About TownGreet 10 citizens by pressing  near them.  A Bit of a Fixer-UpperComplete all substance and neuro-interface projects in Otto's lab - some are locked until you progress in the story.  Sticky and TrickyChain 4 tricks in one go, which is best done jumping off a high building and holding + the whole way down.  Snappy DresserChange your suit 5 times.  ArachnophobiaTake down 75 enemies stealthily.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  5,
  6,
  (SELECT title FROM games WHERE id = 6),
  3.0,
  20,
  2,
  'published',
  true,
  '2025-02-16 13:00:07.07732'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  6,
  7,
  (SELECT title FROM games WHERE id = 7),
  3.0,
  12,
  1,
  'published',
  true,
  '2025-02-16 13:00:19.790889'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  7,
  8,
  (SELECT title FROM games WHERE id = 8),
  1.0,
  10,
  1,
  'published',
  true,
  '2025-02-16 13:01:19.487767'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 7
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  7,
  1,
  $$Stage 1: Complete the Story and Get all Collectibles$$,
  $$Your main focus is to complete the game and take all the optional photographs. Throughout the game you will have the option to take photographs. Almost all of the trophies for this game are earned by just taking pictures. If by the time you have completed the game, and for some reason miss one of the optional photographs, then you can replay the game using the Collectible Mode.\n\nIf you want to have a video walkthrough on where to find any of the collectibles, then see  Visionary, Lab Master, Camera Eye, Shutterbug, and  Selfie Awareness for a video walkthrough guide for the photos of each chapter. There's also a text written walkthrough for every optional photo trophy.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  10,
  11,
  (SELECT title FROM games WHERE id = 11),
  2.0,
  5,
  1,
  'published',
  true,
  '2025-02-16 13:02:28.160902'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 10
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  10,
  1,
  $$Stage 1: Play Through the Game Doing Everything$$,
  $$You will get probably everything in your first playthrough because nothing is missable at all, and this game is very easy. This stage has you playing through the game, beating it alone will get you the majority of the trophies. The only thing to explicitly make sure to do is collect Precursor Orbs as you play, and find the hidden mask in the prison level (the last one) for  Putting On A Friendly Face.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 10
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  10,
  2,
  $$Stage 2: Bug Combat and Clean Up$$,
  $$After the game is done, go clean up and play any remaining dream minigames, as well as play one round of Bug Combat.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  11,
  12,
  (SELECT title FROM games WHERE id = 12),
  2.0,
  7,
  1,
  'published',
  true,
  '2025-02-16 13:02:46.458545'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 11
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  11,
  1,
  $$Stage 1: Enjoying the Story$$,
  $$For the first part of the game just go through the story and enjoy this beautiful remaster. If you would like you can 100% each level along the way and do the various level trophies, however, nothing in the game is missable so you don't need to worry if you missed out on something. Your trusty Guidebook will always show you what collectibles you are missing as well.In order to move onto new worlds and progress the game you will need to talk to the Balloonists. Upon arriving at each new world he will have a new task that you need to complete in order to move onto the next world. Below are each world's requirements for continuing to the next world:Artisan World: Free 10 DragonsPeace Keepers World: Obtain 1,200 TreasureMagic Crafters World: Reclaim 5 Dragon EggsBeast Makers World: Free 50 DragonsDream Weavers World: Obtain 6,000 Treasure Gnasty's World: Final World - No Requirements$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 11
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  11,
  2,
  $$Stage 2: Collectible Cleanup & Gnasty's Loot$$,
  $$Now it's time to go back and 100% the game. In total you will need to collect:12,000 Gems80 Dragons 12 Dragon EggsYou can check your Guidebook in the pause menu at any time to see which levels you have yet to 100%. If you're missing a few gems from a level, it's a good idea to press  as this will cause Sparx to point in the direction of anything you are missing. For videos featuring a full collectible guide, please refer to  I'm in the Money! After you have all your collectibles you can head back to Gnasty's World in order to unlock the level Gnasty's Loot. Completing this level is required for 120% completion and the trophy  Hoarder.*Treasure Chest Key Glitch Warning: Some players have reported not being able to re-collect keys (needed to open certain treasure chests and obtain gems) if they turned off their PS4 while playing. It is a good idea to back-up your save every once and while so that if something like this does happen you won't have to play the game from the beginning for the platinum.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 11
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  11,
  3,
  $$Stage 3: Miscellaneous Trophy Cleanup$$,
  $$Now it's time for the level related trophies (Any that were not required for 100%). There is a good chance that you got many of these out of the way as you played through the game. However, you can play a level as many times as you need in order to obtain any trophies that you may have missed.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  12,
  13,
  (SELECT title FROM games WHERE id = 13),
  3.0,
  8,
  1,
  'published',
  true,
  '2025-02-16 13:02:57.868656'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 12
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  12,
  1,
  $$Stage 1: Play and Enjoy the Game!$$,
  $$Practically all the trophies in this game require you to complete certain challenges or meet specific criteria in a level. It might be possible to defeat Ripto without obtaining any trophies at all, although the chances of that happening are slim to none. Thankfully, there are no missable trophies in this game, so you can always come back later if you don't want to worry about it on your first play through of the game. Just have fun!Some levels and home worlds will require you to learn new skills before being able to obtain all the treasures and Orbs, such as learning how to swim, climbing ladders, or the headbash. It's recommended to find all the Gems and Orbs in the levels that don't require you to come back later, so you'll have less backtracking to do. Unlike in the first game, gems are important, because in order to progress through parts of the game, you have to pay a greedy bear by the name of Moneybags a specific number of gems to pass through obstacles, unlock new levels, and learn skills. This is why it's better to take your time and collect as much as you can in every level to avoid having to return multiple times.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 12
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  12,
  2,
  $$Stage 2: All Collectibles and Super Flame$$,
  $$After obtaining all of Spyro's skills, it's time to go back and collect all the Gems and Orbs that you couldn't obtain in previous levels and home worlds. In order to 100% the game, you will need the following:10,000 Gems64 OrbsAfter you have obtained all the Gems and Orbs, you will be able to unlock the permanent Super Flame in Dragon Shores! It's not really that useful considering you have to 100% the game before getting it, but there are certain trophies that are made easier with Super Flame than the standard flame, so it might be worth putting those off until beating the game. If you're having trouble finding out what you're still missing, check the Guidebook! Don't forget that all the Speedway levels in this game each have an Orb challenge as well!Most of these trophies you will obtain while trying to 100% the game. If not, you can always come back to them later.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 12
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  12,
  3,
  $$Stage 3: Extra Trophies and Backtracking$$,
  $$These are trophies that you will most likely miss or fail while casually playing the game. Most of them are fairly easy, although may require a few attempts to learn the patterns of certain bosses or Orb challenges.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  13,
  14,
  (SELECT title FROM games WHERE id = 14),
  3.0,
  7,
  1,
  'published',
  true,
  '2025-02-16 13:03:09.117417'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 13
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  13,
  1,
  $$Stage 1: Play Through the Game Normally$$,
  $$For the purpose of this guide, trophies that require you to collect or destroy a singular/series of items during a level have been marked as collectable.You should play through the game normally and aim for all the eggs you can get. It's strongly recommended that you get every egg possible from the Sunrise Spring and Midday Gardens hub worlds and their individual worlds as they're by far the easiest to get and will save you from having to spend much time cleaning up if you don't have 100 eggs by the time you get to the end of Midnight Mountain.Refer to the Tips & Strategies section of the guide for things you should do to minimize backtracking throughout your playthrough.The trophies marked below are trophies you essentially can't miss and have to try extremely hard to miss at all, they also include two trophies mentioned in the tips above, which you should obtain whilst going for the eggs that they're loosely related to. You can obtain ALL the trophies in one go if you plan accordingly.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 13
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  13,
  2,
  $$Stage 2: End-Game Clean up/100 Egg Collection$$,
  $$The trophies listed here are the ones that are actually possible to mess up in Stage 1 as well as ones that weren't marked on the list for the stage itself. If you're using this stage as an Egg Collection stage and not a clean up, the the final 2 story-related trophies will pop too.Depending on how many eggs you now have this step can go one of two ways for you, either you need to clean up on trophies you missed through your play through or you can grab them whilst you reach 100 eggs for the sorceress.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 13
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  13,
  3,
  $$Stage 3: Definitive Clean up$$,
  $$Finally, these trophies are ones you can most certainly mess up with or miss all together, even with guidelines from the steps above.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  14,
  15,
  (SELECT title FROM games WHERE id = 15),
  2.0,
  2,
  1,
  'published',
  true,
  '2025-02-16 13:03:29.062468'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 14
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  14,
  1,
  $$Stage 1: Complete the Game With the True Ending and Challenge Mode$$,
  $$Welcome to Coffee Talk, barista. Here, you serve the fantastical customers of this aforementioned cafe, whilst listening to their unique stories in the midst of a rainy night, tuning in to your favourite lo-fi and jazz music. There will be no missable trophies, as most of them can be done via chapter select.In this stage, you will unlock trophies along the way, as you serve them. However, your major tasks in this stage are: serving customers the right drinks, getting all four character endings, the True Ending, and unlocking the entire gallery in just one playthrough.You will also complete the Challenge Mode, serving 50 customers with 50 correct drinks, while the clock is running as fast as time can predictably tell.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 14
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  14,
  2,
  $$Stage 2: God of Caffeine + The Platinum Trophy$$,
  $$In this stage, you will replay certain days, while unlocking the secrets behind the barista.For more information on this stage, refer to  God of Caffeine.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  15,
  16,
  (SELECT title FROM games WHERE id = 16),
  2.0,
  5,
  1,
  'published',
  true,
  '2025-02-16 13:03:38.794298'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 15
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  15,
  1,
  $$Stage 1: Play Through the Game However You Please$$,
  $$For Undertale, you don't have to finish the game in order to get the platinum trophy. Out of the ten story-based unmissable trophies, none of them require you to see the end of the game. In other words, there are no trophies attached to the last quarter of the game. The item-related trophies are straightforward and really hard to miss. A couple of the item-related trophies are glitched however. Check  Don't Worry, I Have Lots of Ideas for Trophies to find out how this glitch can be avoided. Keep in mind that the Dog Shrine trophies are missable. Whether you're playing a Pacifist or Genocide run, there's always a way to access the Dog Shrine. However, if you're doing a neutral run and have killed Papyrus, there won't be any way for you to access the Dog Shrine. Check  Dognation Level 15 on how to unlock the Dog Shrine. Therefore, this platinum trophy only requires you to do three things:Play though approximately 75% of the gameCollect four itemsDonate up to 350G at the Dog Shrine$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  16,
  17,
  (SELECT title FROM games WHERE id = 17),
  3.0,
  25,
  1,
  'published',
  true,
  '2025-02-16 13:03:49.442097'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 16
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  16,
  1,
  $$Stage 1: Complete the Story$$,
  $$It is recommended that you focus on completing all Story Quests first. Only gather any collectibles you come across, like Historic Sites and specially try to Synchronize all the Viewpoints you come across, as this will save precious time.Pay attention to  You Snooze, You Lose and  Masquerader as they are potentially missable, and you have the chance to earn them during a couple story missions.About CasesDuring the story, as you try to hunt down the members of the Order of the Ancients, you will be unveiling and solving Cases, which represent Clues and Events that help you gather information about your target, to be able to identify who they are and their location, etc.Do not worry about missing any of them, as you will need to go through all of them to complete the story. Every time a new Case is unveiled, completed, or you progress in it, you will have an on-screen notification about it. You can check the progress in the Investigation Tab in the main menu to track the objective / quest you are following next:$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 16
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  16,
  2,
  $$Stage 2: Exploration & Collectibles$$,
  $$After completing the Story Quests, you will have discovered almost all the map and should have most (if not all) Fast Travel Viewpoints unlocked to make the task of collecting everything a bit faster.RecommendationsJust a few recommendations about the trophies for this stage:Unlock all Viewpoints first as mentioned aboveSave up money by pickpocketing civilians, completing Contracts, etc. and do not spend on anything until you reach the 2007 Dirhams needed for  Hoarder. Then you can spend on upgrading your Weapons and Outfits.To save some time, it is recommended to go for all collectibles for each region before moving to the other. If you want to approach collectibles per type, it will work as well but it will take a bit longer, up to you.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 16
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  16,
  3,
  $$Stage 3: Combat & Stealth Cleanup$$,
  $$Finally, it is time to clean up the combat / stealth related trophies you my have left. It is very likely that many of these trophies will have popped already as a consequence of your gameplay, but in case they have not, check the individual trophy description for information on how to obtain them.RecommendationsJust a few recommendations on the trophies for this stage:Try to use Munadis, Mercenaries, Musicians and Merchants during the Story quests and Contracts and their trophies will be achieve without extra effort, and it will make some objectives / missions easier.Some of these trophies can be obtained together, like the following combinations (though you can also try your own by checking each trophy description): Notorious and  Poster Boy - By staying 10 minutes at level 3 Notoriety and then become anoymous by tearind down 3 wanted posters. Unstoppable  and  The Shadow and the Flame - By using the Assassin Focus skill to increase your notoriety level and then defeat a Shakiriyyah when he appears$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  17,
  18,
  (SELECT title FROM games WHERE id = 18),
  2.0,
  28,
  1,
  'published',
  true,
  '2025-02-16 13:03:58.732267'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 17
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  17,
  1,
  $$Stage 1: Finish the Game Obeying the Narrator$$,
  $$Hello there, employee #427. This is the trophy guide of the much anticipated expanded version of The Stanley Parable (now on consoles!). If you already played The Stanley Parable on PC, you know this is a very weird walking simulator. It is advised to play it a few times before reading this guide, as it's full of spoilers and it could ruin your experience. Most trophies are jokes by the developers instead of actual challenges, so there's no need to worry about missables except for  Test Trophy Please Ignore, which is not too complicated but requires some preparation.You're probably going to play the game a few times before even paying attention to the trophies (unless you're playing it strictly to get the trophies, that is). In any case, the first ending you should go for is the Freedom ending, where you must obey the narrator at all times. This step should take 5 minutes or so. No complications. Check  Beat The Game for more information on this.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 17
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  17,
  2,
  $$Stage 2: Speed Run$$,
  $$For this stage, you'll want to get the speed run out of the way. You'll need to complete the Freedom ending under 4 minutes and 22 seconds. This can be just a little bit tricky if you don't know what you're doing. Check the trophy for tips and a visual aid.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 17
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  17,
  3,
  $$Stage 3: New Content + Collectibles + Epilogue$$,
  $$This stage requires you to complete a series of steps that are highly necessary for  Test Trophy Please Ignore. This involves finishing the new content main story routes, finding a few collectibles and accessing the game's Epilogue. This requires a long preparation that can take anything from 1 to 2 hours of gameplay. In any case, you can simply play the game as much as you want if you're into exploring every aspect of the game. Chances are you'll do the majority of these requirements naturally. If not, you can find a detailed guide inside the trophy that covers everything that needs to be done in order to unlock it. This will be the longest stage of ACTUAL gameplay.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 4 for guide 17
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  17,
  4,
  $$Stage 4: Clean-up$$,
  $$Most miscellaneous trophies are easy, but some of them have ambiguous descriptions with no indications on what to do. All of them are related to different tasks across the office building or tampering with the menus. This is the easiest part of the platinum. There is one trophy related to opening the game after 10 years of real time since the last time you played it. You can do this legitimately if you wish, but there's a workaround for that trophy. Check  Super Go Outside for more info.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  18,
  19,
  (SELECT title FROM games WHERE id = 19),
  3.0,
  30,
  1,
  'published',
  true,
  '2025-02-16 13:04:11.165763'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  33,
  35,
  (SELECT title FROM games WHERE id = 35),
  2.0,
  2,
  1,
  'published',
  true,
  '2025-03-04 16:03:54.644379'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  8,
  9,
  (SELECT title FROM games WHERE id = 9),
  2.0,
  8,
  1,
  'published',
  true,
  '2025-02-16 13:01:30.809538'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  50,
  54,
  (SELECT title FROM games WHERE id = 54),
  7.0,
  110,
  2,
  'published',
  true,
  '2025-03-24 10:15:23.782803'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  19,
  20,
  (SELECT title FROM games WHERE id = 20),
  2.0,
  13,
  1,
  'published',
  true,
  '2025-02-16 13:06:26.690779'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 19
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  19,
  1,
  $$Stage 1: Play the Story While Finding all Collectibles$$,
  $$This game is constructed like the other Life is Strange games where you only have to play through the story and collect items. Some of the collectibles are triggered by certain actions you choose, and those actions will be detailed below to help you find them easily.In this stage, play through the game and the cutscenes until you have control of Sean, the main character. Most of time you will be walking around and exploring the world around you. When you are free to do this, collectibles can be found, and down below you can find how to get them in one play through. There are 5 episodes with 6 collectibles and 1 drawing in each. The good thing is that each collectible can be found in order during the story.As mentioned in the Tips & Strategies section, the Collectible Mode will get you any missed collectible, so don't worry if you missed one by accident. Some of the collectibles are hidden pretty well and take some decisions to get. You can check your journal to see what collectibles you have gotten and it gives you a hint to which ones you haven't.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  20,
  21,
  (SELECT title FROM games WHERE id = 21),
  2.0,
  6,
  1,
  'published',
  true,
  '2025-02-16 13:07:05.860503'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  21,
  22,
  (SELECT title FROM games WHERE id = 22),
  2.0,
  10,
  1,
  'published',
  true,
  '2025-02-16 13:07:17.921273'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 21
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  21,
  1,
  $$Stage 1: Enjoy Your Initial Playthrough Doing Almost Everything$$,
  $$Experience MediEvil™ originally released on the PlayStation® console, enhanced with up-rendering, rewind, quick save, and custom video filters. As it says this stage is your first playthrough of the game. Here you will work on doing everything you can. Namely getting the chalices in all levels and saving up 2,500 coins while beating the game.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 21
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  21,
  2,
  $$Stage 2: Final Steps$$,
  $$This stage is you cleaning up whatever miscellaneous trophies are left, defeating the glass demon with your arm, and doing the witch's ant quest again will likely be the main things you do here. Additionally in this stage you will also be able to go back and get any chalice or weapons you missed during your initial playthrough.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  22,
  23,
  (SELECT title FROM games WHERE id = 23),
  5.0,
  200,
  1,
  'published',
  true,
  '2025-02-16 17:27:56.616056'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  23,
  24,
  (SELECT title FROM games WHERE id = 24),
  3.0,
  70,
  1,
  'published',
  true,
  '2025-02-16 22:05:13.89556'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  24,
  26,
  (SELECT title FROM games WHERE id = 26),
  5.0,
  60,
  2,
  'published',
  true,
  '2025-02-16 22:19:45.856717'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 24
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  24,
  1,
  $$Stage 1: Play Through the Story on any Difficulty$$,
  $$For the first stage of the guide, you can play the game on either Classic, Easy, or Normal difficulties. Hard difficulty will unlock after playing through whatever difficulty you're playing on. However, starting on normal difficulty is recommended so the difficulty of the Hard playthrough doesn't ramp up too much by comparison.Here you will earn the 18 story-related trophies, as well as the possibility of earning some chapter-specific trophies:Chapter 3  Heavenly Dart PlayerChapter 4  Biker BoyChapter 6  Cleanup CrewChapter 7  In LockstepChapter 8  Crate AnnihilatorChapter 8  Say it with FlowersChapter 9  Returning ChampionChapter 9  Sultan of SquatChapter 9  Dancing QueenChapter 14  Whack-a-Box WunderkindChapter 14  Peeress of PullupsChapter 14  Divine GratitudeIt's also recommended to work on collecting the Music Discs for the  Disc Jockey trophy, and it's also recommended to keep an eye on the requirements for  Dressed to the Nines to avoid unnecessary extra playthroughs.Other than that, most other trophies will unlock along the way. So just sit back and enjoy a wonderful dive back into the world of Final Fantasy VII. Most trophies and collectibles in this guide include the chapter they are obtainable in, so they're easier to navigate through with CTRL + F.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 24
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  24,
  2,
  $$Stage 2: Hard Playthrough & Trophy Cleanup with Chapter Select$$,
  $$After finishing the game for the first time, there will be two things left: a Hard mode playthrough, along with replaying Chapters 3, 8, and 9 to obtain the three remaining dresses. Keep an eye on  Dressed to the Nines to avoid a fourth replay of those chapters and you're good to go. If you haven't already, you can hand the last finished quests to Chadley on any Chapter you meet him  Intelligence Agent.Through chapter select it will be far easier to go back to any missing Music Disc ( Disc Jockey) and missing weapons ( Weapons Expert). At any point after obtaining all weapons and abilities, you can go for the 300% stagger trophy ( Staggering Feat).Just progress through the story chapter by chapter again on hard difficulty, and you will be able to do the remaining two quests from Chapter 9 and obtain the  Best in the Business trophy.In Chapter 17, a new Shinra VR system will be in Hojo's lab to tackle new challenges and obtain three trophies:  That's the Smell,  Master of Mimicry, and  Ultimate Weapon. Take a look at this last trophy since it rewards a very powerful accessory.After that, only the 18th and last chapter is left, another encounter with Sephiroth to obtain  Hardened Veteran.Note About Chapter Select: When using chapter select, you can freely jump from one chapter to another and it will retain all of your game progress (battle intel, materia, equipment, stats, etc). However, if you are trying to get  Dressed to the Nines or  Hardened Veteran, you will have to finish the chapter for dress data and hard mode chapter clear data to be counted.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  25,
  27,
  (SELECT title FROM games WHERE id = 27),
  4.0,
  200,
  1,
  'published',
  true,
  '2025-02-17 10:31:36.999326'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  26,
  28,
  (SELECT title FROM games WHERE id = 28),
  7.0,
  40,
  2,
  'published',
  true,
  '2025-02-19 07:05:35.147443'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  28,
  30,
  (SELECT title FROM games WHERE id = 30),
  8.0,
  70,
  3,
  'published',
  true,
  '2025-03-04 16:02:38.418402'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  29,
  31,
  (SELECT title FROM games WHERE id = 31),
  4.0,
  55,
  1,
  'published',
  true,
  '2025-03-04 16:02:50.015295'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  30,
  32,
  (SELECT title FROM games WHERE id = 32),
  2.0,
  10,
  1,
  'published',
  true,
  '2025-03-04 16:03:02.849075'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  32,
  34,
  (SELECT title FROM games WHERE id = 34),
  3.0,
  3,
  1,
  'published',
  true,
  '2025-03-04 16:03:42.233984'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 32
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  32,
  1,
  $$Stage 1: Play the Game$$,
  $$Simply play the game and save your coins. By the time you're done beating this retro style platformer, you should have the platinum real quick. Just enjoy the game and have fun!$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 32
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  32,
  2,
  $$Stage 2: Cleanup$$,
  $$If for some reason, you didn't die 30 times, or saved 5,000 coins at once, now is the time to do so! For the coins, either run the game again, or pick a late game level that has a lot of chests and just keep dying while collecting coins.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  34,
  36,
  (SELECT title FROM games WHERE id = 36),
  2.0,
  7,
  1,
  'published',
  true,
  '2025-03-04 16:04:11.333924'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 34
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  34,
  1,
  $$Stage 1: Finish Chapter 1$$,
  $$Update (13/11/2024): Took on a lot of feedback from guide comments and used it to improve the guide! Apologies for any confusion.Chapter 1 of Röki serves as both the story prologue and tutorial. It's extremely straightforward, featuring some short puzzle segments that do not require backtracking. Everything you need will be available to you in the moment.Follow the story alongside our main characters and complete the puzzles you're faced with. This stage should not take long.Moreover, if you want to make a head-start on  Eye for Detail, which requires you to examine 50 items out of your inventory, there are several items that can be examined in Chapter 1. You can make the most of them here if you wish, and it's recommended to do so.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 34
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  34,
  2,
  $$Stage 2: Finish Chapter 2$$,
  $$Chapter 2 of Röki follows along from Chapter 1 by opening the map and offering far more complex puzzles. You will need to explore, pick up items, backtrack to and from areas, and make the most of what you have to figure out your way through this section of the game. This segment is the longest of the three, taking several hours depending on skill, luck, and Google (should you choose to use it). Overall, it's template is simple and enjoyable. Have fun!Chapter 2 is the biggest chapter of the game and contains several missable miscellaneous trophies.These are: Honour Bound - this one is extremely missable Scenic Route Top Spinner Grave Thoughts Tomte Talk Testrollsterone Connected Eye for DetailMake sure you have all of these before you put the three items in the cauldron or you will have to start a new playthrough.Beware the Point of No ReturnThere will be a point towards the end of this chapter after unlocking the areas along the right side of the map where you need to collect a Ram Skull, two Nattamore Parasites, and Krokeling Beard Hair. These requirements are extremely clear and you will know when this is needed. Feel free to collect these items, but do not put them in the cauldron or you will be locked out of collecting any more of the miscellaneous trophies in Chapter 2. There are no manual saves in this game, only autosaves. The game will only record the three most recent autosaves you've made, and the game autosaves whenever you pick up an item or advance a quest through dialogue, so if these are overwritten in the tiny window they're available, you will have to redo an entire playthrough for the missed trophies. After putting the items in the cauldron, you'll have more puzzles to do, during which you will be able to earn  Growing Pains. This is the only miscellaneous trophy earned after the point of no return, but before the start of Chapter 3.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 34
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  34,
  3,
  $$Stage 3: Finish Chapter 3 and Earn the Platinum Trophy!$$,
  $$Recommendation: make a cloud save at the beginning of this chapter in case you miss any missables!The final chapter of this game is Chapter 3. Chapter 3 has a much smaller map than Chapter 2, but you will be piloting two characters instead of one, each with different abilities requiring you to flip back and forth frequently, and making puzzles much more complex. However, it should not take too long, and the end is near! Good luck.Beware the Point of No ReturnOnce you've opened the main gate in the castle by using the two signet rings, you'll have a long staircase to climb with an elevator at the end. You'll reach the Point of No Return when you get into the elevator. Ensure you have all of these trophies by then, or else you will need to completely restart the game and play through the entirety of Chapters 1 and 2.These are the missable trophies for Chapter 3. Look at each trophy for more information: Forlorn Hope Building Bridges Good Listener Textile DetectiveGeneral tips: you'll be playing as two characters in this section, so make a point to have them interact with each other as frequently as possible to ensure you're exhausting all the possible dialogue between yourselves. If you get to the point of no return and the Building Bridges trophy doesn't pop, you might have missed a piece of shared dialogue, and it's recommended that you restart the chapter via the start menu.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  35,
  37,
  (SELECT title FROM games WHERE id = 37),
  4.0,
  25,
  2,
  'published',
  true,
  '2025-03-04 16:04:19.202963'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  31,
  33,
  (SELECT title FROM games WHERE id = 33),
  4.0,
  60,
  2,
  'published',
  true,
  '2025-03-04 16:03:32.168386'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 31
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  31,
  1,
  $$Στάδιο 1: Ολοκλήρωσε τις Βασικές Αποστολές μέχρι το Πρώτο Σημείο Χωρίς Επιστροφή$$,
  $$Αυτός ο οδηγός για το Stellar Blade θα σε καθοδηγήσει στον καλύτερο τρόπο για να αποκτήσεις όλα τα τρόπαια του παιχνιδιού.\nΤο παιχνίδι απαιτεί συνήθως τρία περάσματα, αφού περιλαμβάνει τρία διαφορετικά τέλη. Ωστόσο, αν χρησιμοποιήσεις το PS+ για να ανεβάζεις τα save data στο cloud ή αν καταφέρεις να νικήσεις το τελευταίο boss στην πρώτη προσπάθεια σε οποιοδήποτε από τα δύο περάσματα, μπορείς να το ολοκληρώσεις με μόνο δύο περάσματα.\n\nΓια να κάνεις μόνο δύο περάσματα, θα πρέπει να χρησιμοποιήσεις το PS+ ή να εκμεταλλευτείς συγκεκριμένα mechanics, όπως το να παίξεις στο Story difficulty όταν φτάσεις στο τελευταίο boss, το οποίο βρίσκεται στη Φωλιά (Nest). Βασικά, όταν φτάσεις στο τελευταίο boss, θα σου δοθεί η επιλογή να... αγγίξεις ένα χέρι. Αν αρνηθείς, θα πάρεις το ending Return to the Colony, ενώ αν δεχτείς, θα πάρεις ένα από τα άλλα δύο endings, ανάλογα με το αν έχεις το progress bar της Lily στο 100% ή όχι.\n\n➡️ Τα collectibles (Memory sticks, documents και cans) και η ολοκλήρωση side quests ή συγκεκριμένων κύριων αποστολών αυξάνουν το progress της Lily.\n➡️ Αν το progress με τη Lily είναι στο 100% πριν το Spire 4 (δεύτερη προς τελευταία περιοχή του παιχνιδιού), θα πάρεις το ending Making New Memories. Αν δεν είναι στο 100%, θα πάρεις το ending Cost of Lost Memories.\n\n🔥 Χρήσιμες Πληροφορίες\n👉 Η δυσκολία δεν επηρεάζει τα τρόπαια.\n👉 Το πρώτο πέρασμα ξεκλειδώνει το υψηλότερο επίπεδο δυσκολίας.\n👉 Το παιχνίδι διαθέτει New Game Plus (NG+), όπου μεταφέρονται όλα τα upgrades, το currency, τα αντικείμενα, τα records, τα character enhancements, οι αναβαθμίσεις του drone, οι αποκτημένες δεξιότητες και τα SP από το προηγούμενο πέρασμα. Ωστόσο, η πρόοδος στις αποστολές δεν θα μεταφερθεί. Τα collectibles θα κάνουν reset στον κόσμο, αλλά η συνολική πρόοδός σου στα τρόπαια θα διατηρηθεί.\n\n🎯 Στρατηγική για το Platinum Trophy\n➡️ Κάνε focus στις κύριες αποστολές στο πρώτο πέρασμα μέχρι να φτάσεις στην Abyss Levoire και να επιστρέψεις στο Presence Chamber.\n➡️ Μόλις μιλήσεις στον Adam στη Xion, θα προχωρήσεις στην ιστορία και θα φτάσεις στο πρώτο σημείο χωρίς επιστροφή.\n➡️ Συνιστάται να ολοκληρώσεις όλες τις side quests και να μαζέψεις όσα collectibles μπορείς στο πρώτο πέρασμα, ώστε να εξασφαλίσεις το ending Making New Memories.\n➡️ Αν θες να πάρεις όλα τα endings, μπορείς να κάνεις rush το παιχνίδι μία τρίτη φορά, ώστε να πάρεις και το ending Cost of Lost Memories.\n\nΑν δεν σε ενδιαφέρει να πάρεις το platinum με τη μεγαλύτερη δυνατή ταχύτητα, μπορείς απλώς να απολαύσεις το παιχνίδι και να επιστρέψεις για τα υπόλοιπα τρόπαια στο New Game Plus.\n\n💡 Το progress bar της Lily είναι το κλειδί για τα endings\nΑν το progress είναι στο 100%, το ending Making New Memories είναι εξασφαλισμένο.\nΑν το progress είναι κάτω από 100%, θα πάρεις το ending Cost of Lost Memories.\nΤα trophies που σχετίζονται με collectibles δεν θα μετρήσουν δύο φορές αν τα πάρεις στο NG+.\n➡️ Συμβουλή: Στο πρώτο πέρασμα, καλό είναι να ολοκληρώσεις τα πάντα στη Xion πριν προχωρήσεις στο Abyss Levoire, γιατί μετά δεν θα μπορείς να επιστρέψεις εκεί.\n\n🏆 Επιλογές για τα Περάσματα\nRoute A:\n✔️ Κάνε τα πάντα στο πρώτο πέρασμα (side quests, collectibles, κτλ.).\n✔️ Έτσι, θα μπορείς να ολοκληρώσεις το platinum στο New Game Plus με λιγότερη προσπάθεια.\n\nRoute B:\n✔️ Παίξε μόνο τις κύριες αποστολές στο πρώτο πέρασμα και ασχολήσου με τα υπόλοιπα στο δεύτερο.\n✔️ Θα χρειαστείς πιθανότατα και τρίτο πέρασμα για να πάρεις όλα τα endings και τα trophies.\n\n➡️ Αν ακολουθήσεις το Route A, το platinum θα είναι πιο γρήγορο.\n➡️ Αν ακολουθήσεις το Route B, μπορεί να χρειαστείς και τρίτο πέρασμα.\n\n🚀 Στρατηγική Περασμάτων\nΠρώτο πέρασμα → Παίξε στο Story difficulty, κάνε τα πάντα και φρόντισε να έχεις το progress bar της Lily στο 100% → Making New Memories.\nΔεύτερο πέρασμα → Rush στις κύριες αποστολές → Μη μαζέψεις collectibles → Κάνε το άλλο ending → Cost of Lost Memories.\nΤρίτο πέρασμα (αν χρειαστεί) → Τρέξε μόνο τις κύριες αποστολές → Κάνε το τελευταίο ending → Return to the Colony.\n👑 Τελικό αποτέλεσμα:\n➡️ Με τη σωστή στρατηγική, μπορείς να ολοκληρώσεις το Stellar Blade σε δύο περάσματα.\n➡️ Αν κάτι πάει στραβά ή αν θες να το απολαύσεις, μπορείς να κάνεις και τρίτο πέρασμα χωρίς άγχος.\n➡️ Όλα τα trophies (συμπεριλαμβανομένων των cumulative) θα μεταφερθούν από το ένα πέρασμα στο άλλο.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 31
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  31,
  2,
  $$Στάδιο 2: Ολοκλήρωσε τις Βασικές Αποστολές Μέχρι την Επιστροφή από το Spire 4$$,
  $$Αφού έχεις προχωρήσει στην ιστορία μιλώντας με τον Adam μετά το Abyss Levoire, είσαι πλέον εντάξει με το να κλειδωθεί το περιεχόμενο της Xion.\nΑπό εδώ και πέρα, εστιάζεις στις κύριες αποστολές μέχρι να νικήσεις τον Demogorgon (ένα τεράστιο Naytiba στον διαστημικό σταθμό) στο τέλος του Spire 4.\n\nΜόλις επιστρέψεις από το Spire 4, ανάλογα με το πώς σκοπεύεις να συνεχίσεις το roadmap, έχεις δύο επιλογές:\n\n✅ Route A: Καθαρίζεις Τα Πάντα\n➡️ Αν ακολουθήσεις αυτή τη διαδρομή, ο στόχος σου είναι να ολοκληρώσεις τα πάντα πριν προχωρήσεις στο τελευταίο boss.\n➡️ Θα πρέπει να έχεις ήδη αποκτήσει τα εξής trophies:\n\n🏆 Beyond Fate\n🏆 Sisterly Love\n🏆 Beep!\n\n➡️ Συγκέντρωσε επίσης τα τρόπαια που αφορούν τα collectibles:\n\n🏆 Can Collector (για όλα τα κουτάκια)\n🏆 Records Collector (για όλα τα αρχεία)\n🏆 Box Hunter (για όλα τα κουτιά)\n\n➡️ Η πρόοδος στα Naytiba Researcher και Meticulous Explorer πρέπει να είναι:\n\n✅ Naytiba Researcher: 63/67\n✅ Meticulous Explorer: 87/89\n\n👉 Οι δύο τελευταίες τοποθεσίες για το Meticulous Explorer θα ξεκλειδωθούν μετά από συνομιλία με τη Lily και την πρόοδο προς το τελευταίο boss στο τέλος του παιχνιδιού.\n👉 Τρία από τα δεδομένα του Naytiba είναι συνδεδεμένα με το ending Return to the Colony.\n\n🔒 Save Strategy\n✔️ Δημιούργησε ένα save file και ανέβασέ το στο PS+ cloud όταν φτάσεις στη Nest.\n✔️ Αυτό θα σου επιτρέψει να φορτώσεις ξανά το save μετά το ending.\n\n✔️ Αν αρνηθείς το χέρι → Return to the Colony\n✔️ Αν δεχτείς το χέρι και έχεις 100% progress με τη Lily → Making New Memories\n\n👉 Αν δεν χρησιμοποιήσεις το PS+ και χάσεις στο τελευταίο boss και στα δύο περάσματα, θα χρειαστεί να ολοκληρώσεις το παιχνίδι τρεις φορές.\n👉 Αν δεχτείς το χέρι και πάρεις το ending Making New Memories, μπορείς να κλείσεις το παιχνίδι, να αντικαταστήσεις το save από το cloud και να πας για το ending Return to the Colony.\n\n🎯 Τι Πρέπει να Έχεις Πετύχει πριν το Τέλος του Route A:\n✅ Να έχεις τουλάχιστον ένα από τα δύο endings ολοκληρωμένο (κατά προτίμηση το Making New Memories).\n✅ Να έχεις ολοκληρώσει όλες τις side missions και να έχεις μαζέψει όλα τα collectibles.\n✅ Αν τα έχεις κάνει σωστά, είσαι έτοιμος να ξεκινήσεις το δεύτερο πέρασμα.\n\n✅ Route B: Μόνο οι Κύριες Αποστολές\n➡️ Αν ακολουθήσεις αυτή τη διαδρομή, ο στόχος σου είναι να επικεντρωθείς μόνο στις κύριες αποστολές χωρίς να ασχοληθείς με side quests και collectibles.\n➡️ Δημιούργησε ένα save file και ανέβασέ το στο PS+ cloud όταν φτάσεις στη Nest.\n➡️ Αυτό θα σου επιτρέψει να φορτώσεις ξανά το save μετά το ending.\n\n✔️ Αν αρνηθείς το χέρι → Return to the Colony\n✔️ Αν δεχτείς το χέρι και το progress με τη Lily είναι κάτω από 100% → Cost of Lost Memories\n\n👉 Αν δεν χρησιμοποιήσεις το PS+ και χάσεις στο τελευταίο boss και στα δύο περάσματα, θα χρειαστεί να ολοκληρώσεις το παιχνίδι τρεις φορές.\n👉 Αν δεχτείς το χέρι και πάρεις το ending Cost of Lost Memories, μπορείς να κλείσεις το παιχνίδι, να αντικαταστήσεις το save από το cloud και να πας για το ending Return to the Colony.\n\n🔥 Στρατηγική Αν Θες Να Πετύχεις Όλα Τα Endings σε 2 Περάσματα:\nΑκολούθησε το Route A στο πρώτο πέρασμα → Επικεντρώσου σε όλα (side quests, collectibles κτλ.).\nΚάνε save πριν το τελευταίο boss → Δέξου το χέρι και πάρε το ending Making New Memories.\nΑντικατάστησε το save → Άρνηση χεριού και πάρε το ending Return to the Colony.\nΞεκίνησε το δεύτερο πέρασμα → Ακολούθησε το Route B και πάρε το ending Cost of Lost Memories.\n👉 Route A = Όλα τα trophies + το ending Making New Memories\n👉 Route B = Μόνο τα story trophies + το ending Cost of Lost Memories\n\n🚀 Τελικός Στόχος:\n✔️ Αν ακολουθήσεις αυτό το πλάνο, μπορείς να αποκτήσεις το platinum σε 2 περάσματα.\n✔️ Αν δεν έχεις PS+ ή δεν πετύχεις τα endings όπως πρέπει, πιθανόν να χρειαστείς και τρίτο πέρασμα.\n✔️ Αν τελειώσεις σωστά το Route A και το Route B, το τρίτο πέρασμα γίνεται άχρηστο.\n\n🏆 Στρατηγική Αν Χρειαστεί Τρίτο Πέρασμα:\n➡️ Αν θες και το τελευταίο ending, ακολούθησε ένα τρίτο πέρασμα στο New Game Plus.\n➡️ Rush τις κύριες αποστολές → Πήγαινε στο τελευταίο boss → Άρνηση χεριού για το ending Return to the Colony.\n➡️ Αν έχεις ήδη ολοκληρώσει το Making New Memories και το Cost of Lost Memories, θα πάρεις το platinum trophy.\n\n💡 Tips για να Μην Κολλήσεις:\n✔️ Αν κολλήσεις σε boss fight, δοκίμασε να αλλάξεις τη δυσκολία σε Story Mode.\n✔️ Αν χάσεις collectibles, μπορείς να τα ξαναμαζέψεις στο New Game Plus.\n✔️ Τα τρόπαια που σχετίζονται με collectibles δεν θα μετρήσουν δύο φορές αν τα πάρεις στο New Game Plus.\n\n👑 Τελικό Αποτέλεσμα:\n🏆 Με τη σωστή στρατηγική, μπορείς να ολοκληρώσεις το Stellar Blade σε δύο περάσματα.\n🏆 Αν κάτι πάει στραβά ή αν θες να το απολαύσεις περισσότερο, μπορείς να κάνεις και τρίτο πέρασμα χωρίς άγχος.\n🏆 Όλα τα trophies (συμπεριλαμβανομένων των cumulative) θα μεταφερθούν από το ένα πέρασμα στο άλλο.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 31
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  31,
  3,
  $$Στάδιο 3: Το Πρώτο New Game Plus$$,
  $$Έχεις πλέον ολοκληρώσει το πρώτο πέρασμα και είσαι έτοιμος να μπεις σε New Game Plus.\nΑυτό το στάδιο αφορά την επίτευξη όλων των εναπομεινάντων trophies και την ολοκλήρωση των endings που σου λείπουν. Όπως και στα προηγούμενα στάδια, μπορείς να ακολουθήσεις είτε τη Route A (πλήρης ολοκλήρωση) είτε τη Route B (μόνο οι κύριες αποστολές).\n\n✅ Route A: Καθάρισες Τα Πάντα Στο Πρώτο Πέρασμα\n➡️ Αν έχεις ολοκληρώσει τα πάντα στο πρώτο πέρασμα, το New Game Plus είναι απλά μια επανάληψη της ιστορίας.\n➡️ Εστίασε μόνο στις κύριες αποστολές, παράλειψε τα collectibles και τα side quests.\n➡️ Παρακολούθησε την πρόοδό σου στα cumulative trophies (π.χ. σκοτωμένα Naytiba, συλλεγμένα αντικείμενα κ.λπ.) και συμπλήρωσε τις απαραίτητες ενέργειες για τα trophies.\n\n🔧 Αναβαθμίσεις\n✔️ Αναβάθμισε τα αντικείμενα σου στο μέγιστο επίπεδο.\n✔️ Ολοκλήρωσε τα εξής τρόπαια:\n\n🏆 Lonely Fisherman\n🏆 Nano Suit Collector\n🏆 Τελικό Boss & Ending\n\n➡️ Δέξου το χέρι όταν φτάσεις στο τελευταίο boss.\n➡️ Αν έχεις χρησιμοποιήσει το PS+ save backup ή δεν έχεις χάσει στο τελευταίο boss, τότε θα πάρεις το ending Making New Memories αν το progress με τη Lily είναι στο 100%.\n➡️ Αν έχεις ήδη τα άλλα δύο endings (Cost of Lost Memories και Return to the Colony), θα πάρεις το platinum.\n\n👉 Αν σου λείπει το ending Return to the Colony, μπορείς να κάνεις ένα τρίτο πέρασμα και να τρέξεις μέχρι το τέλος για να το πάρεις.\n\n✅ Route B: Μόνο οι Κύριες Αποστολές στο Πρώτο Πέρασμα\n➡️ Αν ακολούθησες τη Route B και έκανες μόνο τις κύριες αποστολές, τότε πιθανότατα έχεις πάρει το ending Cost of Lost Memories.\n➡️ Αν έχεις κάνει ήδη τα endings Cost of Lost Memories και Return to the Colony, τότε το μόνο που απομένει είναι το ending Making New Memories.\n\n🔄 Πλάνο για να ολοκληρώσεις τα πάντα:\n✅ Επικεντρώσου στην απόκτηση affinity με τη Lily.\n✅ Ολοκλήρωσε side quests και μάζεψε τα περισσότερα collectibles στη Xion.\n✅ Σταμάτα τις κύριες αποστολές αφού τελειώσεις το Abyss Levoire.\n✅ Συγκέντρωσε όλα τα collectibles από τη Xion (κουτιά, κονσέρβες, αρχεία).\n✅ Ολοκλήρωσε τα τρία side quest trophies πριν συνεχίσεις με την ιστορία.\n\n🔧 Αναβαθμίσεις\n✔️ Αναβάθμισε τα αντικείμενα σου στο μέγιστο επίπεδο.\n✔️ Παρακολούθησε την πρόοδό σου στα cumulative trophies (π.χ. σκοτωμένα Naytiba, συλλεγμένα αντικείμενα κ.λπ.).\n✔️ Κάνε clear όλα τα remaining trophies (εκτός από τα ending trophies).\n\n🏆 Τελικό Boss & Ending\n➡️ Δέξου το χέρι όταν φτάσεις στο τελευταίο boss.\n➡️ Αν έχεις χρησιμοποιήσει το PS+ save backup ή δεν έχεις χάσει στο τελευταίο boss, τότε θα πάρεις το ending Making New Memories αν το progress με τη Lily είναι στο 100%.\n➡️ Αν έχεις ήδη τα άλλα δύο endings (Cost of Lost Memories και Return to the Colony), θα πάρεις το platinum.\n\n👉 Αν σου λείπει το ending Return to the Colony, μπορείς να κάνεις ένα τρίτο πέρασμα και να τρέξεις μέχρι το τέλος για να το πάρεις.\n\n🎯 Στρατηγική για να Μην Χρειαστεί Τρίτο Πέρασμα\n✅ Χρησιμοποίησε το PS+ cloud backup πριν το τελευταίο boss.\n✅ Αν αρνηθείς το χέρι → Return to the Colony\n✅ Αν δεχτείς το χέρι και έχεις 100% με τη Lily → Making New Memories\n✅ Αν δεχτείς το χέρι και ΔΕΝ έχεις 100% με τη Lily → Cost of Lost Memories\n\n🚀 Στόχος:\n✔️ Αν εκτελέσεις το πλάνο σωστά, μπορείς να ολοκληρώσεις το platinum σε δύο περάσματα.\n✔️ Αν κάτι πάει στραβά ή χάσεις κάποια ευκαιρία, το τρίτο πέρασμα είναι απλή υπόθεση.\n✔️ Το New Game Plus σε κάνει πιο δυνατό λόγω των αναβαθμίσεων, οπότε το τελευταίο πέρασμα θα είναι πολύ πιο εύκολο!\n\n💡 Tips για να Μην Κολλήσεις:\n✔️ Αν κολλήσεις σε boss fight, δοκίμασε να αλλάξεις τη δυσκολία σε Story Mode.\n✔️ Αν χάσεις collectibles, μπορείς να τα ξαναμαζέψεις στο New Game Plus.\n✔️ Τα τρόπαια που σχετίζονται με collectibles δεν θα μετρήσουν δύο φορές αν τα πάρεις στο New Game Plus.\n✔️ Αν κάνεις λάθος σε ending, μπορείς να ξαναφορτώσεις το save από το cloud.\n\n👑 Τελικό Αποτέλεσμα:\n🏆 Με τη σωστή στρατηγική, μπορείς να ολοκληρώσεις το Stellar Blade σε δύο περάσματα.\n🏆 Αν κάτι πάει στραβά, ένα τρίτο πέρασμα είναι πάντα διαθέσιμο.\n🏆 Όλα τα trophies (συμπεριλαμβανομένων των cumulative) θα μεταφερθούν από το ένα πέρασμα στο άλλο.\n🏆 Τα upgrades και τα αντικείμενα θα μεταφερθούν και θα κάνουν το τελευταίο πέρασμα πολύ πιο εύκολο.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 4 for guide 31
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  31,
  4,
  $$Στάδιο 4: Το Δεύτερο New Game Plus (Προαιρετικό)$$,
  $$Αν σου λείπει ακόμα το ending Return to the Colony, ήρθε η ώρα για ένα τρίτο πέρασμα. Στόχος σου είναι να τερματίσεις το παιχνίδι όσο πιο γρήγορα γίνεται, παραλείποντας τα πάντα και αρνούμενος το χέρι στο τελευταίο boss.\n\n✅ Γρήγορο Πέρασμα για Return to the Colony\n➡️ Άρχισε το παιχνίδι ξανά σε New Game Plus.\n➡️ Παίξε μόνο τις κύριες αποστολές και αγνόησε τα side quests και τα collectibles.\n➡️ Στο τελευταίο boss, αρνήσου το χέρι για να πάρεις το ending Return to the Colony.\n➡️ Αν έχεις κάνει όλα σωστά μέχρι τώρα, τότε είσαι ο περήφανος κάτοχος του Stellar Blade Platinum Trophy! 🏆\n\n🔥 Στρατηγικές για τα DLC και τα SP Exp Gains\n➡️ Τα μελλοντικά DLCs πιθανότατα θα απαιτήσουν τουλάχιστον τρία πλήρη περάσματα.\n➡️ Τα SP (Skill Points) συνδέονται στενά με το side content και τα collectibles, οπότε θα χρειαστεί να κάνεις δύο ολοκληρωμένα περάσματα για να μαζέψεις αρκετά.\n\n💡 Χρήσιμος Εξοπλισμός\n✔️ Χρησιμοποίησε το Training Gear (αυξάνει το SP EXP gain) για να γλιτώσεις το τρίτο πέρασμα.\n✔️ Η Kaya στο Sisters' Junk πουλάει το 2-star Training Gear.\n✔️ Άλλα Training Gear μπορούν να βρεθούν στις περιοχές Great Desert και Wasteland.\n\n💪 Boss Rush Mode\n➡️ Το παιχνίδι διαθέτει Boss Rush Mode από το κεντρικό μενού.\n➡️ Αν καταφέρεις να το ολοκληρώσεις, θα πάρεις μια Nano Suit ως ανταμοιβή.\n➡️ Είναι επίσης καλό μέρος για virtual photography – ιδανικό για screenshots και show-offs!\n\n🎯 Στόχος: Platinum Trophy\n✔️ Αν ακολούθησες σωστά τα βήματα:\n✅ 1ο πέρασμα → Making New Memories (100% Lily)\n✅ 2ο πέρασμα → Cost of Lost Memories (αρνούμενος το χέρι με under 100% Lily)\n✅ 3ο πέρασμα → Return to the Colony (δεχόμενος το χέρι)\n\n➡️ Αν ολοκλήρωσες όλα τα endings, έφτασες στο Stellar Blade Platinum Trophy! 🏆\n➡️ Μπράβο, ολοκλήρωσες ένα από τα πιο απαιτητικά trophy guides – συγχαρητήρια! 🚀\n\n🚀 Αν υπάρχει νέο περιεχόμενο/DLC:\n👉 Δες τα social media του παιχνιδιού για πληροφορίες σχετικά με νέα updates και προσθήκες.\n👉 Προετοιμάσου για επερχόμενα DLC και νέες προκλήσεις με τα υπάρχοντα upgrades και τον εξοπλισμό σου.\n\n🏆 Καλή επιτυχία για το Platinum! 😎$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  36,
  38,
  (SELECT title FROM games WHERE id = 38),
  2.0,
  2,
  1,
  'published',
  true,
  '2025-03-04 16:04:36.437727'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 36
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  36,
  1,
  $$Stage 1: First Playthrough Getting Everything$$,
  $$This stage is your playthrough of the game getting every secret ideally and also shooting for an S rank. For more information on S ranks please see  S Rank. Nothing is missable apart from your rank so you can enjoy and spend your time sifting through the old park.Apart from that the game will have you solving puzzles and killing (but mainly avoiding) enemies, almost every trophy here will come from getting every secret in the game.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 36
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  36,
  2,
  $$Stage 2: S Rank Cleanup$$,
  $$In case you missed the S Rank, this stage is for you. Run through the game again using your newfound knowledge and skill and shoot for the S rank as you did before. A good goal for this stage is to complete the game with under 8 heals as well as 14/15 secrets.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  37,
  39,
  (SELECT title FROM games WHERE id = 39),
  2.0,
  7,
  1,
  'published',
  true,
  '2025-03-04 16:04:45.882773'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  39,
  41,
  (SELECT title FROM games WHERE id = 41),
  3.0,
  6,
  1,
  'published',
  true,
  '2025-03-04 16:07:03.92115'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 39
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  39,
  1,
  $$Stage 1: All Traces, Food, Skills, and Cubs$$,
  $$While the Platinum can be earned in one playthrough, it is recommended that you use two; one to get a feel of the layout of the game and then a second to focus on the missable trophies, most notably  We Are a Family,  Omnivore, and  For a Better Tomorrow. If you prefer to use a video guide, one is provided under  Extinction is Forever. If you're going for everyone in one playthrough, see We Are a Family for a full breakdown of what to focus on each day (food, skills, trophies, etc). That trophy also provides the order in which the trophies will unlock if you're going for everything in one go.The autosave in the game happens at the start of each night, so if you happen to miss something on any day, you can exit the game and reload it to try again. There is no chapter select so this is the next best thing. Your main goal will be keeping all the Cubs alive until the end of the game. The trophies related to saving the Cubs are stackable so if you go for all 4 first, you'll unlock  All For One,  Two Peas in a Pod,  Three Little Foxes, and  We Are a Family together. You'll feed them most of the food required for  Omnivore but there are some foods (fish and deer) that are highly missable so be sure to check the food locations before starting. The nights on which you need to find the Traces are provided under their respective trophies. The Climb skill can potentially glitch if approached incorrectly so once you get to Night 15, double-check  For a Better Tomorrow to ensure you don't miss your chance to unlock the skill. The game itself is pretty linear so just take your time each day to make sure you grab everything needed.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  40,
  42,
  (SELECT title FROM games WHERE id = 42),
  6.0,
  14,
  1,
  'published',
  true,
  '2025-03-04 16:07:11.203075'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  41,
  43,
  (SELECT title FROM games WHERE id = 43),
  4.0,
  20,
  1,
  'published',
  true,
  '2025-03-04 16:07:18.174546'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  42,
  44,
  (SELECT title FROM games WHERE id = 44),
  3.0,
  20,
  2,
  'published',
  true,
  '2025-03-04 16:07:25.773217'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  43,
  45,
  (SELECT title FROM games WHERE id = 45),
  4.0,
  10,
  1,
  'published',
  true,
  '2025-03-04 16:07:34.301718'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 43
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  43,
  1,
  $$Stage 1: The One and Only Playthrough$$,
  $$Stage 1 is relatively simple and is the only stage you'll need to tackle. The majority of the trophies in the game are linked to activities performed in the game that reward the player with power cells. Since the story requires you to gather power cells in order to progress, it is a relatively easy process to acquire these trophies simply by completing every mission in an area before leaving.\n\nThere are nine trophies that are linked to collectibles in the game; three for collecting Power Cells, three for collecting Precursor Orbs, and another three for collecting Scout Flies. Collecting all 7 Scout Flies in an area will reward you with a Power Cell, which counts towards that area's total cells. Collecting all Precursor Orbs in an area is useful as well, as in the hub areas, there are NPC's with which you can trade orbs for Power Cells which count towards the total cell's in that area as well. Therefore, by collecting all orbs and all Scout Flies in an area, it will make it easier to collect all Power Cells in that area, and by the end of the game, you should have collected most, if not all, of each category of collectible.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 43
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  43,
  2,
  $$Stage 2: Cleanup$$,
  $$Now, if you would prefer to enjoy the story rather than mindlessly hunt and toil for hours in order to clear every area of all collectibles, it will still be easy to clean up all the trophies. Any power cell missions you miss can be revisited after the final boss in order to collect them, and you may find it easier to run through areas without scouring for collectibles first, then return later for a more thorough search. Either way, anything you miss on your path through the story can be done later on and you will only need to revisit old areas if you do not clear everything the first time.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  44,
  46,
  (SELECT title FROM games WHERE id = 46),
  3.0,
  40,
  1,
  'published',
  true,
  '2025-03-04 16:07:41.065607'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  45,
  47,
  (SELECT title FROM games WHERE id = 47),
  7.0,
  50,
  2,
  'published',
  true,
  '2025-03-04 16:07:51.010969'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  46,
  48,
  (SELECT title FROM games WHERE id = 48),
  6.0,
  50,
  7,
  'published',
  true,
  '2025-03-04 16:07:58.080847'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  47,
  49,
  (SELECT title FROM games WHERE id = 49),
  4.0,
  25,
  1,
  'published',
  true,
  '2025-03-04 16:08:06.028208'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 47
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  47,
  1,
  $$Stage 1: Finish the Main Story (10 - 15 hours, Depending on Difficulty)$$,
  $$In this stage, focus all your attention on doing the Main Quests to activate all 6 powers of Simurgh because after that, no place in Qaf Mountain is beyond your reach and you can search all the corners of the map. Also, try to pick up every collectible you see along your journey, and if you don't have the required power yet, mark it on the map so you can visit it later and try to get it.Whenever you have enough Ores  to upgrade Qays & Layla, go to Kaheva and upgrade them because your swords are your best friends, but don't forget about your health, because sometimes you can lose the fight because you couldn't get one more hit. Also, when you break 5 jars of sand, return to the Prophecy Room to receive your reward because they help Sargon to progress.There are 9 main story quests in total:Lost In Mount Qaf (Fight with Jahandar for  The Maneater)The Abducted Prince The Tiger and The Rat The Path to the Sand Prison (Fight with Kiana for  The Forest Trespasser)The Darkest of Souls (Fight with Azhdaha for  Snake in the Sand)Warning: One player has experienced a gamebreaking bug with this quest, detailed in this post.The Celestial Guardians (Fight with Menolias for  Fists & Arrows) / (Fight with Orod for  The Storm Master)Return to the Past (Fight against Vahram for  The White Lion)Father and Son (Fight with King Darius for  King of Kings)The Crossroads of Time (Fight the God Prince for  The End of Time)$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 47
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  47,
  2,
  $$Stage 2: Finish Side Quests (5 - 10 Hours, Depending on Your Skills)$$,
  $$Qaf Mountain has 9 side quests:3 of them are collection types; you have to break 30 jars to reveal the complete prophecy, solve 9 puzzles to open the entrance to Maryam's workshop, and also defeat 9 warriors and Ardeshir because you are the only one who can break the curse of time.The other 3 are skill based and you have to complete several platforms to get your reward from Kaheva, Hermit, and King of Pirate.The last 3 are task quests, and for which one, you have to do something and get a reward in return.Collection TypeThe Lost Warriors (Lower City, From Nojan)The Architect (Upper City, From Maryam)Prophecy of Mount Qaf (Lower City, From First Jar)Skill BaseAncient Power Unearthed (Lower City, From Kaheva)The Impossible Climb (Upper City, From Hermit)Treasures of the Seven Seas (Sunken Harbor, From King of Pirate.)Problem: There was no problem for the author after completing the game twice, but there are reports that the parrot may disappear if it's lost during the platforming part. This can destroy the entire side quest and the trophy related to completing all the side quests, so be sure to back up your saves using Ubi-Cloud before starting.Suggested Solution: As soon as you see the parrot disappear, restart the console and do not go to any\nWak-Wak Tree because they are saving points. But if your parrot disappeared before, restart the console several times when you are in the platforming room; it's possible that everything will be fixed (a friend had this problem and everything was fixed by restarting the console 3 times, but this did not work for another person, so the solution is not certain).Problem: Some players have experienced the game freezing after accepting the quest (and other quests).Suggested Solution: Turn the controller on and off, or connect and disconnect a second controller.Task QuestsThe Moon Gatherer (Sacred Archives, From Prisoner)Motherly Love (The Depths, From Old Lady)The Deserter (Hyrcanian Forest, From Brute)During this stage, considering that you have all the powers of Simurgh, don't forget the collectables; just remember that it is not necessary to collect lore and all Xerxes Coins (you only need 18 to buy scrapper items or some more to upgrade your amulets).$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 47
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  47,
  3,
  $$Stage 3: Collectibles and Miscellaneous$$,
  $$In this last stage, you'll have to collect about 70% of the collectibles, although you won't need to find any lore or collect all Xerxes Coins or open all the chests. In each biome, you just have to break all the Sand Jars and open the chests that have special items, and also take some valuable items like Ore and Soma Tree Petal after completing a platform.All collectibles are required as follows: 36 Amulets30 Sand Jars (warning: in the current patch, they are known to not always track correctly)30 Soma Tree Petals (warning: they are known to currently be buggy and not always drop as expected)9 Wak-Wak Tree Heads9 Amulet Holders8 Lost Warriors (finished in the previous stage)In the end, there are some combat and exploration trophies that can be done within 30 minutes.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  48,
  50,
  (SELECT title FROM games WHERE id = 50),
  3.0,
  18,
  1,
  'published',
  true,
  '2025-03-04 16:08:14.954742'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  9,
  10,
  (SELECT title FROM games WHERE id = 10),
  3.0,
  15,
  1,
  'published',
  true,
  '2025-02-16 13:02:16.098593'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 9
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  9,
  1,
  $$Στάδιο 1: Πρώτο Πέρασμα με Συγκεκριμένα Trophies Ανά Επίπεδο$$,
  $$Σε αυτό το στάδιο, θα χρειαστεί να εξερευνήσεις κάθε επίπεδο, να μαζέψεις τα τρόπαια που σχετίζονται με αυτό, να συλλέξεις όλα τα αντικείμενα και να κάνεις ένα τελευταίο καθάρισμα στο τέλος. Εστίασε στο να απολαύσεις το πρώτο σου πέρασμα στο παιχνίδι, κρατώντας πάντα στο μυαλό σου τα τρόπαια που είναι συνδεδεμένα με κάθε επίπεδο.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 9
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  9,
  2,
  $$Στάδιο 2: Τρόπαια Χαρακτήρα και Καθάρισμα$$,
  $$Σε αυτό το στάδιο, ο στόχος σου είναι να ολοκληρώσεις ό,τι έχεις αφήσει πίσω στα επίπεδα και να αποκτήσεις τα ειδικά τρόπαια με χαρακτήρες στο Crash Site. Αυτά τα τρόπαια συνήθως απαιτούν να βρεις συγκεκριμένους χαρακτήρες, να συλλέξεις τα αντικείμενά τους από το Gatcha machine και να αλληλεπιδράσεις μαζί τους με έναν μοναδικό τρόπο.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 9
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  9,
  3,
  $$Στάδιο 3: Collectibles και το Χρυσό Bot$$,
  $$Σε αυτό το στάδιο, θα ολοκληρώσεις τη συλλογή των τελευταίων τροπαίων, που πιθανότατα θα σου πάρουν τον περισσότερο χρόνο. Συγκεκριμένα, θα πρέπει να συγκεντρώσεις αρκετά νομίσματα για 150 έπαθλα, να βρεις όλα τα Κομμάτια Παζλ και να διασώσεις όλα τα Bots. Η τελική πρόκληση με το Χρυσό Bot μπορεί να είναι δύσκολη, αλλά δεν θα πρέπει να σου δημιουργήσει σοβαρά προβλήματα.\n$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  49,
  53,
  (SELECT title FROM games WHERE id = 53),
  3.0,
  12,
  1,
  'published',
  true,
  '2025-03-12 22:06:32.640671'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 49
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  49,
  1,
  $$Στάδιο 1: Ολοκλήρωσε τη Βασική Ιστορία$$,
  $$Τα περισσότερα τρόπαια θα τα κερδίσεις ολοκληρώνοντας το βασικό παιχνίδι, που απαιτεί να μαζέψεις 75 χρυσές σπάτουλες και να νικήσεις το τελικό boss. Μπορείς να επιλέξεις εσύ ποιες σπάτουλες και κάλτσες θα κυνηγήσεις, ανάλογα με το στυλ σου. Επίσης, μπορείς να αφήσεις τη μάχη με το τελικό boss για το τέλος, καθώς αυτό θα σου ξεκλειδώσει ένα ελαφρώς διαφορετικό τελικό cutscene.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 49
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  49,
  2,
  $$Στάδιο 2: Ολοκλήρωση 100%$$,
  $$Αφού τελειώσεις με την ιστορία, ήρθε η ώρα να μαζέψεις ό,τι έχεις αφήσει πίσω. Θα χρειαστεί να βρεις όλα τα χρυσά σπατουλάρια, τις κάλτσες και τα υπόλοιπα τρόπαια που σου λείπουν. Πιθανότατα θα χρειαστεί να κάνεις λίγο farming για λαμπερά αντικείμενα, ώστε να ολοκληρώσεις όλες τις ανταλλαγές με τον Mr. Krabs.\n\n✅ All Golden Spatulas\nSpongeBob's Closet > Bikini Bottom > SpongeBob's house > Unlock the door that requires 50 shiny objects > N/A\n\nOn Top of the Pineapple > Bikini Bottom > - > Activate button underneath two Tikis, then activate floating button. Before time runs out, use platforms to get on top of SpongeBob's house > N/A\n\nAnnoy Squidward > Bikini Bottom > Squidward's house > Enter Squidward's house and talk to him. Then jump around in front of him a few times > N/A\n\nAmbush at the Tree Dome > Bikini Bottom > Sandy's house > Enter Sandy's house. Defeat all the robots within the time limit > Unlock 15 golden spatulas gate\n\nOn Top of Shady Shoals > Bikini Bottom > - > Stand on pressure pad next to police station and use Bubble Bowling move to activate button. Use trampoline and platforms to get on top of Shady Shoals > Unlock 15 golden spatulas gate, SpongeBob's Bubble Bowling move\n\nOn Top of Chum Bucket > Bikini Bottom > - > Use Cruise Bubble to activate three buttons on side of Chum Bucket. Use trampoline to get on the roof > Unlock 40 golden spatulas gate, SpongeBob's Cruise Bubble move\n\nInfestation at the Krusty Krab > Bikini Bottom > The Krusty Krab > Clear the Krusty Krab of robots > Unlock 40 golden spatulas\n\nA Wall Jump in the Bucket > Bikini Bottom > The Chum Bucket > At the back of the Chum Bucket is a pipe curving up. Jump onto it using the table > Unlock 40 golden spatulas\n\nReturn X Socks to Patrick > Bikini Bottom > Patrick > Patrick is standing outside his house. For every 10 of his socks he'll give you a spatula > Find 10 socks\n\nPay Mr. Krabs X Shiny Objects > Bikini Bottom > Mr. Krabs > Mr. Krabs can be found in Bikini Bottom. He'll ask you for increasing amounts of shiny objects in exchange for spatulas > Find enough shiny objects\n\n\n✅ Patrick's Socks\nSpongeBob's house > Library > Atop the timed platforms (activated by pressing switch above the door) > N/A\n\nSquidward's house > - > Destroy everything you can in the room, it appears by the window > N/A\n\nBikini Bottom > Patrick > Approach Patrick by his house and talk to him > N/A\n\nPatrick's house > - > Attack Patrick's couch > N/A\n\nShady Shoals Rest Home > - > Attack the TV, appears on a table > Unlock 15 Golden Spatulas gate\n\nBikini Bottom > Fountain > Jump on top of the fountain and spin attack > Unlock 15 Golden Spatulas gate\n\nThe Krusty Krab > Main room > Destroy everything you can, will appear in the crow’s nest > Unlock 40 Golden Spatulas gate\n\nBikini Bottom > Behind The Krusty Krab > Attack the dumpster, it’ll move and reveal a sock > Unlock 40 Golden Spatulas gate\n\n\n✅ Golden Underwear\nBikini Bottom, top of Squidward's house > Stomp the Tikis between Patrick and Squidward’s houses to push a button. Use the platform to get on top of Squidward's house > N/A\n\nBikini Bottom, top of police station > Next to the police station is a button and a pressure pad. Stand on the pad and use SpongeBob’s Bubble Bowling move to hit the button. Use trampoline to reach the roof. Golden underwear is behind the funnel > SpongeBob’s Bubble Bowling ability, unlock 15 golden spatulas gate\n\nBikini Bottom, on Krusty Krab sign > Use SpongeBob’s Cruise Bubble to hit three buttons on the side of the Chum Bucket. A trampoline will appear — use this to get onto the Krusty Krab sign > SpongeBob’s Cruise Bubble ability, unlock 40 golden spatulas gate\n$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  38,
  40,
  (SELECT title FROM games WHERE id = 40),
  3.0,
  10,
  1,
  'published',
  true,
  '2025-03-04 16:05:32.773302'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 38
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  38,
  1,
  $$Stage 1: Go Through the Game With Your Eyes Open test$$,
  $$You arrive at a small island with your ghostly companion, your task finding the most purreacious treasure there is. Enjoy the game and explore it. Most of the trophies will come naturally.Throughout the game, you'll find compass towers that will guide you to your next main quest target location, but you're going to be underleveled very fast if you ignore everything else.Level requirements jump in paces of 10. The final boss fight is easily doable with Lv.50, and with skill, it can be done even before that. If you are struggling with some bosses, though, remember that you can upgrade your gear at the smithy in Port Purvanna.After beating the game once, you'll unlock NG+, raising level caps for yourself and the monsters. Or you can return to your initial save-game and exit the final dungeon to claim any missing trophies.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 38
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  38,
  2,
  $$Stage 2: Clean up$$,
  $$Reload your old save (Do NOT start New Game+) to collect anything you missed before going into the final fight.Presumably that would mean searching some missing equipment pieces and/or completing miscellaneous side quests, including some higher level bounties.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  51,
  55,
  (SELECT title FROM games WHERE id = 55),
  3.0,
  20,
  1,
  'published',
  true,
  '2025-03-24 10:17:46.885636'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 51
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  51,
  1,
  $$Stage 1: Story$$,
  $$The game has an amazing story that it is highly advised to follow first. Don't rush the game instead of enjoying it. While doing all of the story missions you will probably get some of the random trophies as well.What you MUST concentrate on is the Fly Swatter trophy during the 8th DNA sequence, which is the game's only missable trophy if you don't own the game's DLC The Battle of Forli, the GOTY version of the game or the PS4's remastered edition. If you have the base version of the game without the DLC, then you should focus on getting this trophy to avoid an extra playthrough.If you come along some feathers it is suggested to not pick them up, because this could confuse you for the next part. Collect the Codex pages as you roam the city, since you will need all 30 of them to unlock DNA Sequence 14.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 51
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  51,
  2,
  $$Stage 2: Collectibles$$,
  $$Now that you have completed the story, it is time to start the biggest pain in this game. The feathers. Grab a map (I provide videos in the trophies section) and cross out each feather you get. After that you will get rid of the Glyphs and finally the statues around your villa.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 51
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  51,
  3,
  $$Stage 3: Stronghold & Purchases$$,
  $$With the story gone, you will probably have a lot of money from the story missions. Now it's time to put this to good use. Upgrade your stronghold enough to get the  Podestà of Monteriggioni trophy. Buy enough courtesans, clothes, armor and item upgrades.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 4 for guide 51
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  51,
  4,
  $$Stage 4: Cleaning Up$$,
  $$For the final step you need the remaining trophies. These are the combat trophies, the side missions and other miscellaneous stuff. You have all the time in the world to get them all and grab your .$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  52,
  56,
  (SELECT title FROM games WHERE id = 56),
  4.0,
  50,
  1,
  'published',
  true,
  '2025-03-24 10:18:06.532051'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  54,
  58,
  (SELECT title FROM games WHERE id = 58),
  3.0,
  70,
  1,
  'published',
  true,
  '2025-03-24 10:20:45.437538'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 54
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  54,
  1,
  $$Stage 1: Play Through the Game to the End$$,
  $$First thing's first: There is no real optimal way of tackling this game's trophy list. It's very lenient and there is only one missable trophy to be careful of, which is  Aphrodite's Embrace.In this step, you should simply play through the game and enjoy its story, characters, gameplay, etc. Keep in mind of the one only missable in the game. Once you have taken care of that missable throughout the game, then you will be good to go for the rest of the trophy list. Note that there are not any difficulty specific trophies, therefore you can play the game on the easiest difficulty if you so choose.Also, you'll notice that this game has a lot of dialogue choices that can affect the story and/or quest narrative in some way. Choices that you make will not affect any trophies or any story segments to the point of you missing any trophies. The only exception is  Aphrodite's Embrace. View that trophy entry for more information.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 54
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  54,
  2,
  $$Stage 2: Post-Game Trophy Cleanup$$,
  $$This roadmap stage is simply dedicated to any trophies that you may have skipped over or simply missed during your initial playthrough.Again, with the leniency of this game's trophy list, you can pretty much go and do anything that you'd like in whatever order you want.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  55,
  59,
  (SELECT title FROM games WHERE id = 59),
  2.0,
  10,
  1,
  'published',
  true,
  '2025-03-24 10:21:06.967684'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 55
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  55,
  1,
  $$Stage 1: Play the Story and Achieve all Optional Objectives$$,
  $$This game is pretty short and has many easy trophies. Paying attention to the trophies' descriptions is recommended, since there is a number of trophies that you probably won't earn on a normal playthrough, some even require a mild form of grinding. However, none of the trophies are missable, as Freedom Cry offers you to replay story missions. The miscellaneous trophies are related to generic events that repeatedly happen on sea and land.\n\nBecause this game is the standalone version of a DLC, some of its trophies are taken from the main game. In this stage you will focus on achieving a 100% synchronization. This is done by simply completing all of the the main missions' optional objectives.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 55
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  55,
  2,
  $$Stage 2: Cleanup for Miscellaneous Trophies$$,
  $$You may already have earned a number of these throughout your playthrough, but there may be some left. By now, you have every type of equipment available and can focus on earning the rest of the trophies. Just pay close attention to their requirements.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  56,
  60,
  (SELECT title FROM games WHERE id = 60),
  3.0,
  35,
  1,
  'published',
  true,
  '2025-03-24 10:21:12.372091'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 56
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  56,
  1,
  $$Stage 1: Complete The Story With 100% Sync$$,
  $$Start the game and enjoy it as much you can - there are no difficulty-related trophies to worry about. It's highly recommended that you complete the optional objectives while completing the game, in order to save more time later. Unlike Assassin's Creed III, you are able to complete objectives within multiple playthroughs of the same memory. It's not necessary to complete them all in just one memory.\n\nIt's important to remember that there are so many collectibles in the game and the maps don't help too much, since they are very big, especially the map of the North Atlantic. That's why it's recommended to collect every totem, fragment, templar map, templar relic, and blueprint that you come across.\n\nIt's also important to be careful with the challenges. The  Dedicated Employee trophy is bugged. Please refer to this trophy for more information about the glitch.\n\nNOTE: Once you have beaten the last sequence, you MUST wait until the credits end. Do not skip the credits because the trophy will not pop, which means you will have to repeat the last sequence again.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 56
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  56,
  2,
  $$Stage 2: Economic Zones$$,
  $$At this point, you will need a decent amount of materials and money in order to upgrade your ship (Morrigan), and you'll also need those things for the renovations. There are three possible ways to get money:\n\n\tCapturing Assassin's Headquarters ( Capture all Gang HQs).\n\tCapturing Forts ( For the Empire).\n\tSending ships to Naval Missions ( Globe Trotter).\n\n\nNOTE: It would be better to work on the  Do not want trophy when attempting to take the Assassin's Headquarters. For more information, refer to this trophy.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 56
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  56,
  3,
  $$Stage 3: Collectibles$$,
  $$There are a ton of collectibles throughout all three maps in the game. There are five type of collectibles:\n\n\tFragments (200)  Memory collector.\n\tTemplar Maps (24) and Templar Relics (24)  Knight of Yore.\n\tNative Totems (7)  Ancient Hero.\n\tBlueprints (19)  Phantom Queen.\n\n\nBefore going for the collectibles you should synchronize all viewpoints. When you synchronize a viewpoint, the whole map is revealed with all of its activities, renovations, collectibles, chests, and quest items. Once you collect everything in one location, you will get the  Owned trophy.\n\nThere are collectibles in every location in the game, so it's impossible to miss  Cartographer trophy.\n\nNOTE: The Templar relics are the only collectibles that don't have an icon, so it doesn't matter if you synchronize a viewpoint. They can only be collected by following the indicated coordinates in the Templar Maps.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 4 for guide 56
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  56,
  4,
  $$Stage 4:  Miscellaneous Trophies$$,
  $$Now that you have progressed so much in the game, you should work towards remaining miscellaneous trophies. For more information, refer to the trophies below.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 5 for guide 56
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  56,
  5,
  $$Stage 5: Fully Upgrade Morrigan, Finish All Renovations and Legendary Battles$$,
  $$At this stage, you will already have a lot of money and materials to buy the renovations and to level up the Morrigan (remember to find the blueprints first). \n\nRefer to the  Whats yours is mine trophy for more information about getting materials and money without glitches.\n\nWhen the ship Morrigan is fully upgraded, you can start the Legendary Battles.  Master of the North Atlantic gives further details on that.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 6 for guide 56
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  56,
  6,
  $$Stage 6: Cheat Trophies$$,
  $$Every time you complete five Abstergo Challenges, a cheat unlocks. In total you'll need 65 challenges to unlock the last cheat, necessary for a trophy - the Veterans Cheat. \n\nIt's pretty likely you won't get the 65 Abstergo Challenges, even if you followed the above steps. So, in this stage keep an eye on the challenges and complete the ones you consider the easiest. There is a total of 70 Abstergo Challenges.\n\nA list with all the challenges and the unlockable cheats are in the description of the  Dedicated Employee trophy.\n\nNOTE: The game will not save while cheats are active.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  57,
  61,
  (SELECT title FROM games WHERE id = 61),
  6.0,
  60,
  1,
  'published',
  true,
  '2025-03-24 10:21:22.314684'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  58,
  62,
  (SELECT title FROM games WHERE id = 62),
  3.0,
  15,
  1,
  'published',
  true,
  '2025-03-24 10:21:37.602373'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 58
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  58,
  1,
  $$Stage 1: Play Through The Story$$,
  $$NOTE: This guide can be used for both the PS3 and PS4 versions. Also, this guide contains spoilers from the main story. Read at your own risk. There is also a PS Vita trophy stack for this game, but it has multiplayer and other trophies that will not be covered in this guide.Like any other game, it is best that you just enjoy the story to get a feel for how the game works and what this game provides. The story is much shorter compared to other Assassins Creed titles, especially since this game serves as a spin-off/tie in to Assassins Creed 3. Also, none of the trophies are missable since you can replay memories once they are completed to clean up any optional objectives if necessary.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 58
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  58,
  2,
  $$Stage 2: Side Missions and Cleanup$$,
  $$In this stage, you will be focusing on the several side missions the game offers as well as the miscellaneous trophies requiring certain actions in combat. In other words, you are getting to 100% of the game by completing all the side missions, finding all the collectibles, synchronizing all viewpoints, etc. You should also grind out the game's money (ecu) to buy all the pocket watches from random smugglers found within New Orleans and The Bayou.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  59,
  63,
  (SELECT title FROM games WHERE id = 63),
  3.0,
  50,
  1,
  'published',
  true,
  '2025-03-24 10:21:47.779004'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  60,
  64,
  (SELECT title FROM games WHERE id = 64),
  4.0,
  50,
  1,
  'published',
  true,
  '2025-03-24 10:21:57.886343'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 60
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  60,
  1,
  $$Stage 1: Play the Story, do all Single-Player Challenges, & Sync all Viewpoints$$,
  $$In this stage you'll be completing all the main story-related missions. While doing them, you'll want to try to do as many challenges as you can, but if you miss some it's not a problem because you will have the ability to replay Memories. To see a list of all the challenges, take a look at the  I Want It All trophy.\n\nAdditionally, as soon as you can, you should Synchronize all of the viewpoints because they'll make everything easier due to the fact that they uncover the map as well as giving you the  Panoramic View trophy.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 60
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  60,
  2,
  $$Stage 2: Side Missions and Miscellaneous Trophies$$,
  $$In this stage you'll be working toward completing all necessary side missions along with getting miscellaneous trophies. You'll complete all of the Café Théatre, Social club, and Helix Rift related trophies, as well as the kill-related trophies.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 60
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  60,
  3,
  $$Stage 3: Collectables$$,
  $$This is by far the longest stage. There are over 400 collectables (294 chests and 128 cockades). In addition, Nostradamus riddles take a long time to complete because you'll have to traverse across the map quite a bit to solve each riddle.\n\nNOTE: There are 4 types of chests but for the  Curiosity trophy you only need to open White and Red chests.\n\n\tWhite - Classic chest\n\tRed - Locked chest\n\tBlue - Companion app quests\n\tYellow - Initiates chests$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 4 for guide 60
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  60,
  4,
  $$Stage 4: Co-op Trophies$$,
  $$In this stage you'll be getting all of the co-op related trophies.\n\nNote: There's no specific trophy for the sync points but you'll still need to collect them all for the  I Got Skills trophy.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 5 for guide 60
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  60,
  5,
  $$Stage 5: Buy all Skills and do all the Training Missions$$,
  $$This is the final stage and it will require about 1 hour or your time. At this point you should have all the resources to be able to buy every skill and you simply need to complete all of the training exercises at Café Théatre.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  61,
  65,
  (SELECT title FROM games WHERE id = 65),
  4.0,
  35,
  1,
  'published',
  true,
  '2025-03-24 10:22:07.238198'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 61
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  61,
  1,
  $$Stage 1: Complete the Main Story and Complete Optional Story Objectives$$,
  $$During this stage, you are required to complete all main story missions, while completing all optional objectives/challenges. Most challenges are simple and will come naturally, if you have trouble with a certain challenge refer to  Mentor for more information. It is recommended that you also go for  Without a Grudge to save grinding towards the end of your platinum journey.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 61
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  61,
  2,
  $$Stage 2: Liberate and Conquer London$$,
  $$In this stage you'll want to finish up all side activities that you haven't completed yet, there are a number of trophies that you'll get for doing these activities.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 61
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  61,
  3,
  $$Stage 3: Cleanup$$,
  $$During the first two stages, you should naturally obtain a number of these trophies. That being said there will be a number of them that you'll have left to get, now's the time to finish those trophies up.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  62,
  66,
  (SELECT title FROM games WHERE id = 66),
  3.0,
  100,
  1,
  'published',
  true,
  '2025-03-24 10:23:08.054441'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  63,
  67,
  (SELECT title FROM games WHERE id = 67),
  2.0,
  1,
  1,
  'published',
  true,
  '2025-03-24 12:28:31.228564'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 63
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  63,
  1,
  $$Stage 1: Earn all Trophies During One Run$$,
  $$Hello Neighbor 2 is a little bigger and more complicated than the first part, which can increase the enjoyment of the game. This time, you don't have to fight only with the neighbor, but the other members of the city who are also complicit with him, and you have to find out their secrets so that you can reach your final destination.Hello Neighbor 2 has 4 stages in the morning (2 of them have missable trophies that you can refer to in order to find out what you should do. In short, you have to pet the dog and cat) and 4 stages at night (climb to the highest point on the museum during any night), and most of the trophies are earned during the story. You only need to pay attention to 3 of them so you don't miss them, and if you use the guide, you can finish the game in around 30 minutes (if you forget any of these three trophies, you have to start the game from the beginning, so be careful not to get confused).See  Climber,  Cat Person, and  Dog Person for details on the missable trophies.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  64,
  68,
  (SELECT title FROM games WHERE id = 68),
  6.0,
  55,
  1,
  'published',
  true,
  '2025-03-24 12:30:17.756818'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 64
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  64,
  1,
  $$Stage 1: Story / Missable Trophies$$,
  $$SERVER SHUTDOWN WARNING:Ubisoft has announced on their website that the online servers for Assassin's Creed Brotherhood (PS3) will be shutting down on October 1st, 2022. All of the trophies marked as multiplayer in this guide will become unobtainable after that date, so if you are looking to get the platinum, this is your last chance to get the trophies while the servers are open. Use boosting sessions to help you obtain these trophies quickly!EDIT: The servers are now closed.PS4 Ezio Collection Version:This trophy guide was created in 2014 and was intended for the PS3 version of the game. In 2016 Ubisoft released Assassins Creed: The Ezio Collection which contained a PS4 version of Assassins Creed: Brotherhood and gave us a new trophy list. No new trophies were introduced however they did remove the Multiplayer component from the game and therefore the multiplayer trophies in this guide are not required for the AC:B PS4 platinum, making the PS4 version much easier. However the Ezio Collection version includes the Da Vinci Disappearance DLC and the DLC trophy list has been merged into the main list for the PS4 version therefore 100% sync is required for PS4 platinum. Please use the DLC guide to help you with this.\n                        \n                                \n                                    \n                                        \n                                            Linked: Assassin's Creed Brotherhood Trophy GuideAfter the fall of Borgia in Rome, Leonardo da Vinci was kidnapped by an underground cult. It is your job to recover your old friend in this enjoyable downloadable expansion.\n                                        \n\n                                        \n                                            \n                                                Guide Rating\n                                            \n                                        \n\n                                        \n                                            \n                                                65,122Views\n                                            \n                                        \n                                    \n                                \n                        \n                    Stage 1:Simply play and enjoy the story for now. If you want to replay any memories for opportunities for trophies, optional objectives, or any other reason, press  to go to the pause menu and then go to the DNA Section (Note: This unlocks   Déjà Vu).The only thing you should worry about is the two missable trophies,  Dust to Dust and   Mailer Daemon. These trophies require you to use Desmond in the present. You have to get these two trophies before Sequence 8, where Desmond becomes inaccessible. If you reached Sequence 8 without getting the trophy, you'll have to start another game.NOTE: If you plan on doing the DLC, it may be a good idea to work on each mission's optional objectives. Don't entirely focus on them when enjoying the story, just get as many as you can out of the way. This will save a lot time later on when you go after Il Principe.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 64
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  64,
  2,
  $$Stage 2: Shrines, Da Vinci's Machines, and Misc Trophies$$,
  $$Now that you've finished the story, you can start on the shrines and the machines. While doing this, you may want to burn the Borgia Towers, because upon entering Borgia territory, soldiers may attack you, and they can cause problems. Not only are you going to shrines and destroying Da Vinci's machines, but you will also be picking up misc trophies in this stage. Luckily, they aren't as complicated as Assassin's Creed 2's Sweeper or Messer Sandman. Doing this stage shouldn't take long.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 64
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  64,
  3,
  $$Stage 3: Collectibles + Assassin Rank$$,
  $$Now it is time to do the Collectibles. Doing this stage will finish up the single-player.\n\nLook at they're individual trophies below. While getting the Collectibles, you're going to also want to be going for the  Welcome to the Brotherhood, as getting it here will save time later.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 4 for guide 64
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  64,
  4,
  $$Stage 4: Multiplayer$$,
  $$As of October 1, 2022, the online servers for a number of Ubisoft titles have been decommissioned (shut down). If you haven’t earned the multiplayer trophies prior to this date, then the platinum is forever unobtainable.You have finished the single-player. Now all that is left is the hardest part of the game. MP. First of all, gaming sessions is your best friend, so click here to set one up to boost. Boosting is the easiest way to get the multiplayer trophies, but if that doesn't work, then you are going to have to do it the old-fashioned way.  Download Complete and  Abstergo Employee of theMonth is going to take up most of your time, so save these for last and get then other ones first. Some you may get playing normally, and some you may get boosting.\n                        \n                                \n                                    \n                                        \n                                            Linked: Abstergo Employee of the Month GuideWelcome, this is a specific guide on how to get the trophy, Abstergo Employee of the Month. In this guide, all of the bonuses are listed along with what ability is required, and basically how to do it all.\n                                        \n\n                                        \n                                            \n                                                Guide Rating\n                                            \n                                        \n\n                                        \n                                            \n                                                46,837Views\n                                            \n                                        \n                                    \n                                \n                        \n                    After you have gotten the other MP trophies, now it is time to tackle the grindy trophies. Click on the links to learn more about the trophies, and how to boost them. This should take you more then a few hours. After you have gotten the two grindy trophies, you will now have the platinum. Congrats!$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  65,
  69,
  (SELECT title FROM games WHERE id = 69),
  5.0,
  15,
  2,
  'published',
  true,
  '2025-03-26 06:14:13.186734'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 65
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  65,
  1,
  $$Stage 1: Play through the game on Easy while obtaining all collectibles.$$,
  $$Start a new game on Normal difficulty. You can either let yourself get your ass kicked right away or let the game offer Easy mode to you naturally. In either case,  Getting My Ass Kicked will pop when the game offers to turn down the difficulty. You can stay on Normal, but as there are no difficulty-specific trophies in this game there's no reason you shouldn't play on Easy.\n\nFrom here, play through the game while focusing on getting all collectibles and leveling up Kratos' abilities all the way. You will obviously receive every story-related trophy along the way. You should make sure to get every missable trophy that you can. If you do miss one, you can spend some time attempting it again on your speed run. See each trophy description for more details.\n\nAfter the game, at the Main Menu, navigate to Extras and then select Birth of the Beast. This is a short video giving some history on Kratos and his brother Deimos as they grew up in Sparta. Once the video is over, you will receive the  Legend of the Twins trophy.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 65
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  65,
  2,
  $$Stage 2: Complete the Challenge of the Gods.$$,
  $$From the Main Menu, choose Extras, then select and complete the Challenge of the Gods. See the trophy description for\n I'll Take the Physical Challenge for details. Completing the challenges will unlock the Dairy Bastard costume, which will give you infinite magic for your speed run. This is the most difficult trophy in the game, and all challenges must be done in one sitting.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 65
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  65,
  3,
  $$Stage 3: Perform a speed run on Easy.$$,
  $$Using the Dairy Bastard costume (or the Ares Armor costume if you are comfortable attempting the infinite magic glitch), you should start a new game on Easy and aim to complete the game in under 5 hours. With this costume, you should have no issues. See the trophy description for  Speed of Jason McDonald for more details.\n\nAt the conclusion of this step you should have your platinum. If you are missing any trophies, you will need to start a playthrough to get them.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  66,
  70,
  (SELECT title FROM games WHERE id = 70),
  3.0,
  12,
  1,
  'published',
  true,
  '2025-03-26 06:15:41.027105'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 66
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  66,
  1,
  $$Stage 1: Beat the Game and Find all the Collectables$$,
  $$Welcome, Spartan. Begin your journey on any difficulty and watch Kratos' wrath unfold before your eyes.\n\nThis stage should not be difficult (especially playing on easy difficulty) and will probably take the most time, however it will also give you most of the trophies. You will need to be mindful of the time limited  15 Min Fight Scene and the glitchy  Boss Batch 3. A large portion of the trophies here are story-related and not missable.\n\nIt is important to try and collect most of the red orb chests throughout the game for completing  Blowin' Your Wad, while also keeping track and finding all 18 Phoenix Feathers and Gorgon Eyes, all 3 Uber Chests and at least 2 Urns of Power. Refer to  Eye Can't Believe It for a link to a very useful collectables guide so that you don't miss anything during your playthrough, as many chests can't be backtracked once you reach certain checkpoints. \n\nThere are also several miscellaneous trophies that can be obtained during this stage, however you may get them naturally during the playthrough. The only miscellaneous trophy that you should watch out for in this stage is  Super Sized. If you miss any of the other trophies you can still mop them up in the last stage.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 66
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  66,
  2,
  $$Stage 2: Beat the 'Challenge of the Titans'$$,
  $$Once you have beaten the game, select the 'Treasures' option from the main menu and then select 'Challenge of the Titans'.\n\nSince this is the second title of the God of War HD Collection, most of you will have already played the first title and be familiar with this mode. You will need to beat 7 challenges of varying difficulty (as opposed to 10 challenges in the original). After beating the first challenge, the second challenge will be unlocked and so on down the list. Simply beating every challenge once is enough to unlock  Bleeding Thumbs.\n\nYou can also get  Eye Sore by beating Challenge #1 repeatedly and  Stoner during Challenge #3 if you did not get it during Stage 1.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 66
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  66,
  3,
  $$Stage 3: Clean up any Remaining Trophies$$,
  $$By this stage you should have most of the trophies and only a few remaining. The remaining trophies are quick and easy to obtain, after which you will have your shiny new platinum.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  67,
  71,
  (SELECT title FROM games WHERE id = 71),
  4.0,
  12,
  1,
  'published',
  true,
  '2025-03-26 06:15:51.43948'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

-- Insert step 1 for guide 67
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  67,
  1,
  $$Stage 1: Beat the Game on Any Difficulty$$,
  $$Start by playing the game on God (Normal) or Spartan (Easy). If you're a hardcore gamer of the God of War series, you can start the game on Titan Mode (Hard difficulty) and in that case you'll only need one playthrough in your platinum trophy journey. If you do select this difficulty, then check stage three of the roadmap if you want a challenge from the very beginning.\n\nDuring this playthrough, earn all the story-related trophies and focus on getting all the missable trophies. To be more specific, these trophies:\n\n\t Mr. Hand\n\t Nice Tan\n\t Obedience School\n\t It’s getting hot in here...\n\t Souled Out\n\t No Guts, No Glory\n\t Hit Man\n\t Torn Up\n\t Ladies Man\n\n\nYou can go straight for the collectibles trophies in this run, like the Godly Possessions or the health, magic, and item upgrades. It is your choice if you want to collect them, but you can go for them in your second playthrough in Titan Mode, and trust me, you will need the upgrades in this mode. Do not bother on checking a collectible guide during your first playthrough. Take into account that collectibles are fairly easy to obtain since they are not in hidden areas, so you can get their respectful trophies without checking a guide.\n\nOptional Missable trophies: \n\n\n\t Maxed Out!: It requires that you upgrade all of your weapons. You'll need red orbs to upgrade your weapons, so unless you did not earn this trophy in your Normal Playthrough, be sure to do it in your Hard playthrough. See the trophy for more details. \n\t Priceless: Godly Possessions are another type of collectibles in this game. It's not recommended to check a collectible guide to get them in this playthrough, but it is your choice. If you get all of them by yourself, good, one less thing for your Hard playthrough. \n\t Eye Candy,  Feather Plucker,  Horn of Plenty: These three trophies are related to collectibles that increase your health, magic, or item upgrades. You will obtain most of them since they are not in hard-to-reach areas. Although, if you collect them all and did not skip any of the chests you'll be rewarded with red orbs in the remaining chests. It is highly recommend that you not check a collectible guide in this run, but if you earn these three trophies by yourself, good, but you'll have to do it again in your Hard playthrough to make it easier. \n\t aMAZEd: This trophy can be really hard if you're new in the series, or to hack-and-slash games. You have to beat the Labyrinth without dying or failing. You can do this during this run, or in the second one, your choice. It's an optional task for you in this playthrough. See the trophy for more details. \n\n\nNothing more to mention for this stage, enjoy Kratos' fury!$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 2 for guide 67
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  67,
  2,
  $$Stage 2: Beat the Challenge of Olympus$$,
  $$After beating the game, you'll unlock the Challenge of Olympus. Complete all the seven challenges to earn the golden trophy. See the  Up to the Challenge trophy for tips and videos.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 3 for guide 67
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  67,
  3,
  $$Stage 3: Titan (Hard) Playthrough$$,
  $$This playthrough can be frustrating at some points. Refer to the  Unhuman trophy for a complete walkthrough and tips for your Titan playthrough. In this playthrough you should aim for:\n\n\n\tMaxing out all your weapons ( Maxed Out!). Collect all red chests, and do brutal kills to get more red orbs. More details in its respective trophy description. \n\tCollect all Gorgon Eyes (health upgrades), Phoenix Feathers (magic upgrades), Minotaurs' Horns (Item upgrades) to get these three trophies:  Eye Candy,  Feather Plucker,  Horn of Plenty. A complete list and collectible video has been added to their respective trophies.\n\tCollect all Godly Possessions. If you did not collect them all in your first run, then now will be the time to do it. For more information, refer to  Priceless.\n\t aMAZEd: You can create a new save file once you reach the Labyrinth. You can quit to the main menu and your death will be deleted and you can try again, but do not hit the Restart from the last checkpoint option. See the trophy description for a complete strategy.$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- Insert step 4 for guide 67
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  67,
  4,
  $$Stage 4: Clean Up$$,
  $$If you did not earn any of the missable trophies mentioned in the previous stages, then you'll have to create a New Game on Spartan (Easy) to get all that remains.\n\nIt is time to claim your prize, you are now the  King of the Hill!$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;


-- Update game statistics
UPDATE games SET total_guides = (
  SELECT COUNT(*) FROM guides WHERE game_id = games.id
);

COMMIT;

-- =====================================================
-- IMPORT COMPLETE!
-- Games imported: 65
-- Guides imported: 65
-- =====================================================
