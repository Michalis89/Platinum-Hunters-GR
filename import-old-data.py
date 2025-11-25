#!/usr/bin/env python3
"""
Import script for migrating old Platinum Hunters backup data to new schema.

This script reads the old Supabase backup and generates SQL INSERT statements
compatible with the new database schema.
"""

import re
import json
from typing import List, Dict, Any

# Input/Output files
BACKUP_FILE = r"C:\Users\karka\Downloads\db_cluster-22-06-2025@05-20-26.backup\db_cluster-22-06-2025@05-20-26.backup"
OUTPUT_SQL = r"C:\Users\karka\Υπολογιστής\Michalis\Code\NextJS\platinum-hunters\imported-data.sql"


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')


def extract_games_data(backup_content: str) -> List[Dict[str, Any]]:
    """Extract games data from backup file."""
    games = []

    # Find the COPY public.games section
    games_match = re.search(
        r'COPY public\.games.*?FROM stdin;\n(.*?)\n\\.',
        backup_content,
        re.DOTALL
    )

    if not games_match:
        print("⚠️  No games data found in backup")
        return games

    games_data = games_match.group(1).strip()

    for line in games_data.split('\n'):
        if not line.strip():
            continue

        parts = line.split('\t')
        if len(parts) < 8:
            continue

        game_id, platform, game_image, platinum, gold, silver, bronze, title = parts[:8]

        games.append({
            'id': int(game_id),
            'title': title,
            'slug': slugify(title),
            'platform': platform,
            'cover_image': game_image,
            'trophy_platinum': int(platinum),
            'trophy_gold': int(gold),
            'trophy_silver': int(silver),
            'trophy_bronze': int(bronze)
        })

    print(f"✅ Extracted {len(games)} games")
    return games


def extract_guides_data(backup_content: str) -> List[Dict[str, Any]]:
    """Extract guides data from backup file."""
    guides = []

    # Find the COPY public.guides section
    guides_match = re.search(
        r'COPY public\.guides.*?FROM stdin;\n(.*?)\n\\.',
        backup_content,
        re.DOTALL
    )

    if not guides_match:
        print("⚠️  No guides data found in backup")
        return guides

    guides_data = guides_match.group(1).strip()

    for line in guides_data.split('\n'):
        if not line.strip():
            continue

        parts = line.split('\t')
        if len(parts) < 10:
            continue

        guide_id, game_id, difficulty, playthroughs, steps_json, created_at, diff_color, play_color, hours_color, hours = parts[:10]

        # Parse steps JSON
        try:
            steps = json.loads(steps_json)
        except:
            steps = []

        # Convert difficulty to rating (e.g., "7/10" -> 7.0)
        difficulty_rating = None
        if '/' in difficulty:
            try:
                rating = float(difficulty.split('/')[0])
                difficulty_rating = rating
            except:
                pass

        guides.append({
            'id': int(guide_id),
            'game_id': int(game_id),
            'difficulty_rating': difficulty_rating,
            'estimated_playthroughs': int(playthroughs) if playthroughs.isdigit() else 1,
            'estimated_hours': int(hours) if hours.isdigit() else None,
            'steps': steps,
            'created_at': created_at
        })

    print(f"✅ Extracted {len(guides)} guides")
    return guides


def generate_platform_sql(games: List[Dict[str, Any]]) -> str:
    """Generate SQL for unique platforms."""
    platforms = set()
    for game in games:
        platform = game['platform']
        if platform:
            platforms.add(platform)

    sql = "-- Insert unique platforms\n"
    sql += "INSERT INTO platforms (name, short_name) VALUES\n"

    platform_values = []
    for platform in sorted(platforms):
        short_name = platform.replace('PlayStation ', 'PS')
        platform_values.append(f"  ('{platform}', '{short_name}')")

    sql += ',\n'.join(platform_values)
    sql += "\nON CONFLICT (name) DO NOTHING;\n\n"

    return sql


def generate_games_sql(games: List[Dict[str, Any]]) -> str:
    """Generate SQL INSERT statements for games."""
    if not games:
        return ""

    sql = "-- Insert games\n"
    sql += "-- Note: We're inserting without developer/publisher/genre for now\n"
    sql += "-- You can update these later using the RAWG API integration\n\n"

    for game in games:
        sql += f"""INSERT INTO games (
  id, title, slug, cover_image,
  trophy_platinum, trophy_gold, trophy_silver, trophy_bronze
) VALUES (
  {game['id']},
  $${game['title']}$$,
  '{game['slug']}',
  '{game['cover_image']}',
  {game['trophy_platinum']},
  {game['trophy_gold']},
  {game['trophy_silver']},
  {game['trophy_bronze']}
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  cover_image = EXCLUDED.cover_image,
  trophy_platinum = EXCLUDED.trophy_platinum,
  trophy_gold = EXCLUDED.trophy_gold,
  trophy_silver = EXCLUDED.trophy_silver,
  trophy_bronze = EXCLUDED.trophy_bronze;

"""

        # Link game to platform
        platform_map = {
            'PS5': 'PlayStation 5',
            'PS4': 'PlayStation 4',
            'PS3': 'PlayStation 3',
            'PS Vita': 'PlayStation Vita'
        }
        platform_name = platform_map.get(game['platform'], game['platform'])

        sql += f"""-- Link game to platform
INSERT INTO game_platforms (game_id, platform_id)
SELECT {game['id']}, id FROM platforms WHERE name = '{platform_name}'
ON CONFLICT DO NOTHING;

"""

    return sql


def generate_guides_sql(guides: List[Dict[str, Any]]) -> str:
    """Generate SQL INSERT statements for guides."""
    if not guides:
        return ""

    sql = "-- Insert guides\n\n"

    for guide in guides:
        difficulty_rating = guide['difficulty_rating'] if guide['difficulty_rating'] else 'NULL'
        estimated_hours = guide['estimated_hours'] if guide['estimated_hours'] else 'NULL'

        sql += f"""INSERT INTO guides (
  id, game_id, title, difficulty_rating,
  estimated_hours, estimated_playthroughs,
  status, is_verified, created_at
) VALUES (
  {guide['id']},
  {guide['game_id']},
  (SELECT title FROM games WHERE id = {guide['game_id']}),
  {difficulty_rating},
  {estimated_hours},
  {guide['estimated_playthroughs']},
  'published',
  true,
  '{guide['created_at']}'
)
ON CONFLICT (id) DO UPDATE SET
  game_id = EXCLUDED.game_id,
  difficulty_rating = EXCLUDED.difficulty_rating,
  estimated_hours = EXCLUDED.estimated_hours,
  estimated_playthroughs = EXCLUDED.estimated_playthroughs;

"""

        # Insert guide steps
        if guide['steps']:
            for step_num, step in enumerate(guide['steps'], 1):
                title = step.get('title', f'Stage {step_num}')
                description = step.get('description', '')

                # Escape dollar signs for PostgreSQL
                title_clean = title.replace('$', '$$')
                desc_clean = description.replace('$', '$$')

                sql += f"""-- Insert step {step_num} for guide {guide['id']}
INSERT INTO guide_steps (guide_id, step_number, title, description)
VALUES (
  {guide['id']},
  {step_num},
  $${title_clean}$$,
  $${desc_clean}$$
)
ON CONFLICT (guide_id, step_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

"""

    return sql


def main():
    """Main import function."""
    print("=" * 60)
    print("PLATINUM HUNTERS - DATA IMPORT SCRIPT")
    print("=" * 60)
    print()

    # Read backup file
    print("📖 Reading backup file...")
    try:
        with open(BACKUP_FILE, 'r', encoding='utf-8') as f:
            backup_content = f.read()
    except Exception as e:
        print(f"❌ Error reading backup file: {e}")
        return

    print(f"✅ Read {len(backup_content)} characters")
    print()

    # Extract data
    print("🔍 Extracting data...")
    games = extract_games_data(backup_content)
    guides = extract_guides_data(backup_content)
    print()

    # Generate SQL
    print("📝 Generating SQL statements...")
    sql_output = "-- =====================================================\n"
    sql_output += "-- PLATINUM HUNTERS GR - DATA IMPORT\n"
    sql_output += "-- Migrated from old backup\n"
    sql_output += "-- =====================================================\n\n"
    sql_output += "BEGIN;\n\n"

    sql_output += generate_platform_sql(games)
    sql_output += generate_games_sql(games)
    sql_output += generate_guides_sql(guides)

    sql_output += "\n-- Update game statistics\n"
    sql_output += "UPDATE games SET total_guides = (\n"
    sql_output += "  SELECT COUNT(*) FROM guides WHERE game_id = games.id\n"
    sql_output += ");\n\n"

    sql_output += "COMMIT;\n\n"
    sql_output += "-- =====================================================\n"
    sql_output += "-- IMPORT COMPLETE!\n"
    sql_output += f"-- Games imported: {len(games)}\n"
    sql_output += f"-- Guides imported: {len(guides)}\n"
    sql_output += "-- =====================================================\n"

    # Write output
    print(f"💾 Writing to {OUTPUT_SQL}...")
    try:
        with open(OUTPUT_SQL, 'w', encoding='utf-8') as f:
            f.write(sql_output)
        print(f"✅ SQL file created successfully!")
    except Exception as e:
        print(f"❌ Error writing output file: {e}")
        return

    print()
    print("=" * 60)
    print("✨ IMPORT SCRIPT COMPLETE!")
    print("=" * 60)
    print()
    print(f"📊 Summary:")
    print(f"   - Games imported: {len(games)}")
    print(f"   - Guides imported: {len(guides)}")
    print(f"   - Output file: {OUTPUT_SQL}")
    print()
    print("Next steps:")
    print("1. Create new Supabase project")
    print("2. Run all migration files (01-06)")
    print("3. Run the generated imported-data.sql file")
    print("4. Update application code")
    print()


if __name__ == '__main__':
    main()
