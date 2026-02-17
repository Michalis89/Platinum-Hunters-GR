-- Temporary fix: Clean up bad pet entries structure
-- Run this in Supabase SQL Editor ONCE

UPDATE user_category_profiles
SET profiles = jsonb_set(
  profiles,
  '{pet}',
  jsonb_build_object(
    'type', COALESCE(profiles->'pet'->>'type', ''),
    'name', COALESCE(profiles->'pet'->>'name', ''),
    'breed', COALESCE(profiles->'pet'->>'breed', ''),
    'since', COALESCE(profiles->'pet'->>'since', ''),
    'notes', COALESCE(profiles->'pet'->>'notes', '')
  )
)
WHERE profiles ? 'pet'
  AND profiles->'pet' ? 'entries';

-- Remove empty string values
UPDATE user_category_profiles
SET profiles = jsonb_set(
  profiles,
  '{pet}',
  (
    SELECT jsonb_object_agg(key, value)
    FROM jsonb_each(profiles->'pet')
    WHERE value::text != '""' AND value::text != 'null'
  )
)
WHERE profiles ? 'pet';
